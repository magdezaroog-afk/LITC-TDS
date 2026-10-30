import { ConfidentialClientApplication } from '@azure/msal-node';
import { prisma } from '../../db/client';
import { ImmutableLogService } from './ImmutableLogService';
import { SIEMLogger } from '../security/SIEMLogger';
import { redisManager } from '../infrastructure/RedisClient';

export interface EntraConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class EntraSyncService {
  /**
   * Load Entra ID configuration from SystemSetting table, with fallback to environment variables.
   */
  public static async getConfig(): Promise<EntraConfig> {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'ENTRA_ID_CONFIG' }
    });

    let config: Partial<EntraConfig> = {};
    if (setting?.settingValue) {
      try {
        config = JSON.parse(setting.settingValue);
      } catch (err) {
        console.error('[EntraSyncService] Failed to parse ENTRA_ID_CONFIG settingValue:', err);
      }
    }

    return {
      tenantId: config.tenantId || process.env.ENTRA_TENANT_ID || '',
      clientId: config.clientId || process.env.ENTRA_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.ENTRA_CLIENT_SECRET || '',
      redirectUri: config.redirectUri || process.env.ENTRA_REDIRECT_URI || 'http://localhost:5173/api/v1/auth/microsoft/callback'
    };
  }

  /**
   * Saves Entra ID configuration into SystemSetting
   */
  public static async saveConfig(data: Partial<EntraConfig>): Promise<void> {
    const current = await this.getConfig();
    const clientSecret = data.clientSecret && !data.clientSecret.includes('••••')
      ? data.clientSecret
      : current.clientSecret;

    const newConfig: EntraConfig = {
      tenantId: data.tenantId !== undefined ? data.tenantId.trim() : current.tenantId,
      clientId: data.clientId !== undefined ? data.clientId.trim() : current.clientId,
      clientSecret: clientSecret ? clientSecret.trim() : '',
      redirectUri: data.redirectUri !== undefined ? data.redirectUri.trim() : current.redirectUri
    };

    await prisma.systemSetting.upsert({
      where: { settingKey: 'ENTRA_ID_CONFIG' },
      update: {
        settingValue: JSON.stringify(newConfig),
        description: 'Microsoft Entra ID & Graph API SSO Federation Configuration'
      },
      create: {
        settingKey: 'ENTRA_ID_CONFIG',
        settingValue: JSON.stringify(newConfig),
        description: 'Microsoft Entra ID & Graph API SSO Federation Configuration'
      }
    });
  }

  /**
   * Build MSAL Confidential Client Application
   */
  private static async getMsalClient(customConfig?: EntraConfig): Promise<{ cca: ConfidentialClientApplication; config: EntraConfig }> {
    const config = customConfig || await this.getConfig();

    if (!config.tenantId || !config.clientId || !config.clientSecret) {
      throw new Error('بيانات الربط مع Microsoft Entra ID غير مكتملة (Tenant ID, Client ID, Client Secret مطلوبة).');
    }

    const msalConfig = {
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        clientSecret: config.clientSecret
      }
    };

    const cca = new ConfidentialClientApplication(msalConfig);
    return { cca, config };
  }

  /**
   * Test connection to Microsoft Entra ID using Client Credentials flow
   */
  public static async testConnection(): Promise<{ success: boolean; message: string; organization?: string }> {
    try {
      const { cca } = await this.getMsalClient();

      const authResult = await cca.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default']
      });

      if (!authResult?.accessToken) {
        throw new Error('فشل الحصول على توكن المصادقة من مخدمات مايكروسوفت.');
      }

      // Query Microsoft Graph Organization endpoint to verify API permissions
      const response = await fetch('https://graph.microsoft.com/v1.0/organization', {
        headers: {
          'Authorization': `Bearer ${authResult.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`استجاب Microsoft Graph بالرمز ${response.status}: ${errorText}`);
      }

      const orgData = await response.json();
      const orgName = orgData.value?.[0]?.displayName || 'Verified Microsoft Tenant';

      return {
        success: true,
        message: `تم التحقق من الاتصال بنجاح بمستأجر مايكروسوفت: [${orgName}] وصلاحيات Graph API فعالة.`,
        organization: orgName
      };
    } catch (err: any) {
      console.error('[EntraSyncService.testConnection] Error:', err);
      throw new Error(err.message || 'فشل الاتصال بدليل Microsoft Entra ID');
    }
  }

  /**
   * Get Microsoft Authorization URL for interactive SSO login
   */
  public static async getAuthCodeUrl(customRedirectUri?: string): Promise<string> {
    const { cca, config } = await this.getMsalClient();
    const redirectUri = customRedirectUri || config.redirectUri;

    return cca.getAuthCodeUrl({
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri
    });
  }

  /**
   * Acquire Token By Authorization Code (Callback after SSO login)
   */
  public static async acquireTokenByCode(code: string, customRedirectUri?: string) {
    const { cca, config } = await this.getMsalClient();
    const redirectUri = customRedirectUri || config.redirectUri;

    return cca.acquireTokenByCode({
      code,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri
    });
  }

  /**
   * Comprehensive Directory Sync from Microsoft Graph API
   */
  public static async syncUsers(changedBy: number = 1, sourceIp: string = 'INTERNAL') {
    const { cca, config } = await this.getMsalClient();

    const authResult = await cca.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });

    if (!authResult?.accessToken) {
      throw new Error('فشل الحصول على توكن الوصول لسحب بيانات الموظفين من Graph API.');
    }

    // Resolve END_USER role to assign to newly provisioned users
    let endUserRole = await prisma.role.findFirst({
      where: { name: { in: ['END_USER', 'Employee', 'EMPLOYEE', 'موظف'] } }
    });
    if (!endUserRole) {
      endUserRole = await prisma.role.findFirst({ orderBy: { id: 'desc' } });
    }
    if (!endUserRole) {
      throw new Error('لم يتم العثور على أي دور وظيفي افتراضي في جدول الأدوار.');
    }

    // Fetch users from Graph API with paging
    let nextUrl: string | null = 'https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department,mobilePhone,businessPhones,companyName,officeLocation,city,country,accountEnabled,employeeId&$top=999';
    let totalProcessed = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let frozenCount = 0;

    while (nextUrl) {
      const response: any = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${authResult.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل استعلام مستخدمي Graph API (${response.status}): ${errorText}`);
      }

      const graphData: any = await response.json();
      const graphUsers: any[] = graphData.value || [];
      nextUrl = graphData['@odata.nextLink'] || null;

      for (const u of graphUsers) {
        const email = (u.mail || u.userPrincipalName || '').toLowerCase().trim();
        if (!email || !email.includes('@')) continue;

        totalProcessed++;
        const entraObjectId = u.id;
        const tenantDomain = email.split('@')[1];
        const isEnabled = u.accountEnabled !== false;

        // Find existing user in database by entraObjectId or email
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { entraObjectId: entraObjectId },
              { email: email }
            ]
          }
        });

        if (!existingUser) {
          // ─── 1. Provision New Employee ───
          const baseUsername = email.split('@')[0];
          let username = baseUsername;
          const userWithSameUsername = await prisma.user.findUnique({ where: { username } });
          if (userWithSameUsername) {
            username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
          }

          await prisma.user.create({
            data: {
              username,
              email,
              fullName: u.displayName || baseUsername,
              jobTitle: u.jobTitle || 'موظف مؤسسي',
              phone: u.mobilePhone || (u.businessPhones && u.businessPhones[0]) || null,
              company: u.companyName || null,
              officeLocation: u.officeLocation || null,
              city: u.city || null,
              country: u.country || null,
              employeeId: u.employeeId || null,
              entraObjectId: entraObjectId,
              tenantDomain: tenantDomain,
              ssoProvider: 'Microsoft_SSO',
              ssoRole: 'EMPLOYEE',
              roleId: endUserRole.id,
              password: null, // SSO managed
              isActive: isEnabled,
              isFrozen: !isEnabled,
              syncStatus: 'synced',
              lastSyncedAt: new Date()
            }
          });
          createdCount++;
        } else {
          // ─── 2. Existing Employee Synchronization ───
          // Check if disabled in Microsoft Entra ID
          if (!isEnabled) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                isActive: false,
                isFrozen: true,
                lastSyncedAt: new Date()
              }
            });
            redisManager.publish('USER_FROZEN', JSON.stringify({ userId: existingUser.id }));
            frozenCount++;
            continue;
          }

          // STRICT CONDITION: If syncStatus === "overridden", protect local organizational assignments
          if (existingUser.syncStatus === 'overridden') {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                entraObjectId: entraObjectId,
                tenantDomain: tenantDomain,
                lastSyncedAt: new Date(),
                isActive: true,
                phone: u.mobilePhone || (u.businessPhones && u.businessPhones[0]) || existingUser.phone,
                employeeId: u.employeeId || existingUser.employeeId
              }
            });
          } else {
            // syncStatus === "synced" -> Sync full profile from Microsoft while preserving local roleId
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                fullName: u.displayName || existingUser.fullName,
                jobTitle: u.jobTitle || existingUser.jobTitle,
                phone: u.mobilePhone || (u.businessPhones && u.businessPhones[0]) || existingUser.phone,
                company: u.companyName || existingUser.company,
                officeLocation: u.officeLocation || existingUser.officeLocation,
                city: u.city || existingUser.city,
                country: u.country || existingUser.country,
                employeeId: u.employeeId || existingUser.employeeId,
                entraObjectId: entraObjectId,
                tenantDomain: tenantDomain,
                isActive: true,
                isFrozen: false,
                lastSyncedAt: new Date()
              }
            });
          }
          updatedCount++;
        }
      }
    }

    // ─── Immutable Audit Trail & SIEM Logging ───
    await ImmutableLogService.appendLog(
      'ENTRA_DIRECTORY',
      0,
      'DIRECTORY_SYNC_EXECUTED',
      changedBy,
      { createdCount, updatedCount, frozenCount, totalProcessed },
      sourceIp
    );

    SIEMLogger.logEvent(
      'ENTRA_SYNC_COMPLETED',
      'INFO',
      sourceIp,
      { createdCount, updatedCount, frozenCount, totalProcessed },
      changedBy
    );

    return {
      success: true,
      createdCount,
      updatedCount,
      frozenCount,
      totalProcessed
    };
  }
}

