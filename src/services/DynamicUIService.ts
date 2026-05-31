import { prisma } from '../db/client';
import { uiCache } from '../utils/cache';
import { NotFoundError } from '../errors/customErrors';

export class DynamicUIService {
  /**
   * Resolves and aggregates the UI configuration JSON for the frontend.
   * Leverages caching for sub-millisecond lookups.
   * 
   * @param roleId - User's role ID
   * @param stateId - Current Ticket State ID
   * @param ticketType - The ticket type (e.g., "TECHNICAL", "HR", "FINANCE")
   * @returns Dynamic UI configuration JSON
   */
  async getFormConfiguration(
    roleId: number, 
    stateId: number, 
    ticketType: string
  ): Promise<any> {
    const cacheKey = `ui_config:role:${roleId}:state:${stateId}:type:${ticketType}`;

    // 1. Check if the configuration is stored in the cache
    const cachedConfig = uiCache.get<any>(cacheKey);
    if (cachedConfig) {
      // Returned from cache instantly!
      return {
        ...cachedConfig,
        _metadata: {
          source: 'cache',
          timestamp: new Date()
        }
      };
    }

    // 2. Cache miss: retrieve from database
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        template: {
          include: {
            theme: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundError(`Role with ID ${roleId} not found.`);
    }

    if (!role.templateId || !role.template) {
      throw new NotFoundError(`No UI template assigned to Role "${role.name}" (ID: ${roleId}).`);
    }

    // Fetch template widgets, fields, and role-specific widget actions
    const templateWidgets = await prisma.templateWidget.findMany({
      where: { templateId: role.templateId },
      orderBy: { orderIndex: 'asc' },
      include: {
        widget: {
          include: {
            fields: {
              orderBy: { orderIndex: 'asc' }
            },
            actions: {
              where: { roleId: roleId },
              orderBy: { orderIndex: 'asc' },
              include: {
                action: true
              }
            }
          }
        }
      }
    });

    // Retrieve transitions allowed for this user role in the current ticket state
    const allowedTransitions = await prisma.ticketStateTransition.findMany({
      where: {
        fromStateId: stateId,
        OR: [
          { roleId: roleId },
          { roleId: null }
        ]
      },
      include: {
        toState: true
      }
    });

    // Map transitions into standardized transition action buttons
    const transitionActions = allowedTransitions.map(t => ({
      type: 'STATE_TRANSITION',
      label: `Move to ${t.toState.label}`,
      targetStateId: t.toStateId,
      apiEndpoint: `/api/v1/tickets/transitions`,
      payload: {
        targetStateId: t.toStateId
      }
    }));

    // Filter widgets by ticketType.
    // If a widget specifies a type that is NOT the ticketType AND is not 'GENERAL' or 'ALL', we filter it out.
    const filteredWidgets = templateWidgets
      .map(tw => tw.widget)
      .filter(w => {
        const typeUpper = w.type.toUpperCase();
        const ticketTypeUpper = ticketType.toUpperCase();
        return typeUpper === ticketTypeUpper || typeUpper === 'GENERAL' || typeUpper === 'ALL';
      })
      .map(w => {
        // Map Widget Actions and inject transition actions on the principal ticket widget
        let actions = w.actions.map(wa => ({
          type: 'WIDGET_ACTION',
          label: wa.action.name,
          apiEndpoint: wa.action.apiEndpoint,
          orderIndex: wa.orderIndex
        }));

        // If this is the main ticket form widget, inject transition actions
        if (w.type.toUpperCase() === ticketType.toUpperCase() || w.type.toUpperCase() === 'GENERAL') {
          actions = [...actions, ...transitionActions];
        }

        return {
          id: w.id,
          name: w.name,
          type: w.type,
          fields: w.fields.map(f => ({
            id: f.id,
            name: f.fieldName,
            type: f.fieldType,
            order: f.orderIndex
          })),
          actions: actions
        };
      });

    // 3. Construct the UI Configuration response
    const uiConfig = {
      templateId: role.template.id,
      templateName: role.template.name,
      theme: role.template.theme ? {
        themeName: role.template.theme.themeName,
        primaryColor: role.template.theme.primaryColor,
        secondaryColor: role.template.theme.secondaryColor
      } : null,
      widgets: filteredWidgets
    };

    // 4. Save config to cache with infinite TTL (Invalidated on write/update)
    uiCache.set(cacheKey, uiConfig);

    return {
      ...uiConfig,
      _metadata: {
        source: 'database',
        timestamp: new Date()
      }
    };
  }

  /**
   * Invalidates the UI configurations cache.
   * Should be triggered whenever any UI metadata changes (templates, widgets, roles).
   * 
   * @param roleId - Optional specific role ID
   * @param stateId - Optional specific state ID
   * @param ticketType - Optional specific ticket type
   */
  invalidateCache(roleId?: number, stateId?: number, ticketType?: string): void {
    if (roleId !== undefined && stateId !== undefined && ticketType !== undefined) {
      const key = `ui_config:role:${roleId}:state:${stateId}:type:${ticketType}`;
      uiCache.delete(key);
      console.log(`[Cache Invalidate] Cleared specific key: ${key}`);
    } else {
      uiCache.clearPrefix('ui_config:');
      console.log('[Cache Invalidate] Cleared all UI configurations cache (ui_config:*).');
    }
  }
}
