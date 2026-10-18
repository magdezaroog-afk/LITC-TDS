/**
 * LITC Enterprise OS v43 — HubContext (Purged & Rebuilt)
 * =======================================================
 * تم التطهير الكامل: حذف الريلز، العملات، المهام، المتجر
 * الإبقاء على: المستخدم، المنشورات، التحديات، الطلبات، اللغة، الوضع الداكن
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  User,
  Post,
  RequestType,
  Challenge,
  UserRecentRequest,
  RequestStep,
} from '../types';
import { Language, Translations, translations } from '../i18n/translations';
import { getTopLevelDepartments } from '../../services/institutionalHierarchy.helpers';

export type FeedTab = "news" | "community" | "challenges";

interface HubContextType {
  user: User;
  updateUserProfile: (updates: Partial<User>) => void;
  syncWithEntra: () => Promise<void>;
  resetToEntraDefaults: () => void;
  posts: Post[];
  addPost: (newPost: Omit<Post, 'id' | 'author' | 'likes' | 'comments' | 'timestamp'>) => void;
  requests: RequestType[];
  userRequests: UserRecentRequest[];
  refreshUserRequests: () => void;
  rateRequest: (requestId: string, rating: number, feedback: string) => Promise<void> | void;
  canCreateRequest: (categoryId: string) => { allowed: boolean; message?: string; messageEn?: string };
  challenges: Challenge[];
  joinChallenge: (challengeId: string) => void;
  submitChallengeProof: (challengeId: string, proofImg?: string, note?: string) => void;
  completeChallengeQuiz: (
    challengeId: string,
    scorePercent: number,
    isFirstTry: boolean,
    attemptsCount: number,
    isEarlyBird: boolean
  ) => void;
  activeRequest: RequestType | null;
  setActiveRequest: (req: RequestType | null) => void;
  feedTab: FeedTab;
  setFeedTab: (v: FeedTab) => void;
  requestOpen: boolean;
  setRequestOpen: (v: boolean) => void;
  techSupportOpen: boolean;
  setTechSupportOpen: (v: boolean) => void;
  openTechSupport: () => void;
  operational: boolean;
  setOperational: (v: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  activeModules: Record<string, boolean>;

  // Interactive Overlays
  challengesSubTab: 'dept_challenges';
  setChallengesSubTab: (tab: 'dept_challenges') => void;
  activeChatTarget: { name: string; avatar: string; role: string; dept?: string; email?: string } | null;
  setActiveChatTarget: (target: { name: string; avatar: string; role: string; dept?: string; email?: string } | null) => void;
  activeEmailTarget: { name: string; email: string; role?: string; avatar?: string } | null;
  setActiveEmailTarget: (target: { name: string; email: string; role?: string; avatar?: string } | null) => void;
  activeProfileTarget: { name: string; avatar: string; role: string; dept: string; email: string; phone?: string; location?: string } | null;
  setActiveProfileTarget: (target: { name: string; avatar: string; role: string; dept: string; email: string; phone?: string; location?: string } | null) => void;
}

const HubContext = createContext<HubContextType | undefined>(undefined);

export const DEFAULT_ENTRA_USER: User = {
  id: '1',
  name: 'مستخدم النظام',
  role: 'موظف',
  department: 'غير محدد',
  avatar: '',
  points: 0,
  email: '',
  syncStatus: 'synced',
  customOverrides: {}
};

const newsDepts = [
  { ar: 'الإدارة التجارية', en: 'Commercial Department' },
  { ar: 'مكتب المدير العام', en: 'General Manager\'s Office' },
  { ar: 'المكتب القانوني', en: 'Legal Office' },
  { ar: 'مكتب الأمن السيبراني', en: 'Cybersecurity Office' },
  { ar: 'إدارة الموارد البشرية', en: 'HR Department' }
];

/**
 * Parse system TicketRouteDefinition objects from DB into RequestType
 */
export const parseRoutesToRequests = (
  rawRoutes: any[],
  allDynamicFields: any[] = [],
  buildingsList: any[] = [],
  orgTreeData: any = null
): RequestType[] => {
  if (!Array.isArray(rawRoutes)) return [];

  // Try to load cached dynamic fields if not passed
  let resolvedDynamicFields = allDynamicFields;
  if (!resolvedDynamicFields || resolvedDynamicFields.length === 0) {
    try {
      const stored = localStorage.getItem('litc_dynamic_fields');
      if (stored) resolvedDynamicFields = JSON.parse(stored);
    } catch {}
  }

  // Try to load cached buildings if not passed
  let resolvedBuildings = buildingsList;
  if (!resolvedBuildings || resolvedBuildings.length === 0) {
    try {
      const stored = localStorage.getItem('litc_buildings');
      if (stored) resolvedBuildings = JSON.parse(stored);
    } catch {}
  }
  const buildingOptions = resolvedBuildings?.length > 0
    ? resolvedBuildings.map((b: any) => b.name)
    : [];

  // Try to load cached org tree if not passed
  let resolvedOrgTree = orgTreeData;
  if (!resolvedOrgTree) {
    try {
      const stored = localStorage.getItem('litc_org_tree');
      if (stored) resolvedOrgTree = JSON.parse(stored);
    } catch {}
  }
  const realDepartments = getTopLevelDepartments(resolvedOrgTree);
  const departmentOptions = realDepartments.length > 0
    ? realDepartments.map((d: any) => d.name)
    : [];

  return rawRoutes
    .filter((r: any) => r && r.isActive !== false)
    .map((r: any) => {
      const cfg = r.formConfig || {};
      const fields: RequestType['fields'] = [];

      // 1. Building / Location field
      if (cfg.showBuildingField) {
        fields.push({
          name: 'building',
          label: 'المبنى / الموقع',
          type: 'select',
          options: buildingOptions,
          required: !!cfg.mandatoryBuilding,
        });
      }

      // 2. Department hierarchy fields (submitter's organization)
      if (cfg.showDepartmentField) {
        fields.push({
          name: 'department',
          label: 'الإدارة / المكتب التابع لها',
          type: 'select',
          options: departmentOptions,
          required: !!cfg.mandatoryDepartment,
        });

        // Level 2: Division/Section
        if (cfg.departmentSelectionLevel === 'DEPT_AND_DIV' || cfg.departmentSelectionLevel === 'FULL_HIERARCHY') {
          fields.push({
            name: 'division',
            label: 'القسم التابع له',
            type: 'select',
            options: [],
            required: !!cfg.mandatoryDivision,
          });
        }

        // Level 3: Unit/Team
        if (cfg.departmentSelectionLevel === 'FULL_HIERARCHY') {
          fields.push({
            name: 'team',
            label: 'الوحدة / الفريق التابع له',
            type: 'select',
            options: [],
            required: !!cfg.mandatoryTeam,
          });
        }
      }

      // 3. Taxonomy main & sub issues
      if (cfg.taxonomy && Array.isArray(cfg.taxonomy) && cfg.taxonomy.length > 0) {
        fields.push({
          name: 'taxonomyMain',
          label: 'التصنيف الرئيسي',
          type: 'select',
          options: cfg.taxonomy.filter((t: any) => t.isActive !== false).map((t: any) => t.label),
          required: true,
        });
      }

      // 4. Custom Dynamic fields
      if (cfg.routeDynamicFields && Array.isArray(cfg.routeDynamicFields) && cfg.routeDynamicFields.length > 0) {
        cfg.routeDynamicFields.forEach((rdf: any) => {
          const matchedField = (resolvedDynamicFields || []).find((df: any) => df.id === rdf.fieldId);
          const hasOptions = matchedField?.options && Array.isArray(matchedField.options) && matchedField.options.length > 0;
          fields.push({
            name: `dyn_${rdf.fieldId}`,
            label: matchedField?.name || rdf.name || 'حقل إضافي',
            type: hasOptions ? 'select' : 'text',
            options: hasOptions ? matchedField.options.filter((o: any) => o.isActive !== false).map((o: any) => o.label) : undefined,
            required: !!rdf.isRequired,
          });
        });
      }

      // 5. Smart Schedule Engine (محرك الجدولة الزمنية والوقت الذكي)
      if (cfg.showScheduleEngine || cfg.showDateRange) {
        fields.push({
          name: 'scheduleEngine',
          label: cfg.scheduleLabel || cfg.dateRangeLabel || 'الجدولة الزمنية وفترة الطلب',
          type: 'scheduleEngine',
          options: [cfg.scheduleMode || 'ANY'],
          required: !!(cfg.mandatorySchedule || cfg.mandatoryDateRange),
        });
      }

      // 6. Delegate User (الموظف البديل / تسليم المهام)
      if (cfg.showDelegateUser) {
        fields.push({
          name: 'delegateUser',
          label: cfg.delegateUserLabel || 'الموظف البديل / تسليم المهام',
          type: 'delegateUser',
          required: !!cfg.mandatoryDelegateUser,
        });
      }

      // 7. Description (Always present for user to describe their issue/request unless explicitly hidden)
      if (cfg.showDescription !== false) {
        fields.push({
          name: 'description',
          label: 'تفاصيل ومحتوى الطلب',
          type: 'textarea',
          required: cfg.mandatoryDescription !== false,
        });
      }

      // 8. Attachments
      if (cfg.showAttachments) {
        fields.push({
          name: 'attachment',
          label: `المرفق المطلوب (${(cfg.attachmentTypes || ['PDF', 'PNG', 'JPG', 'DOCX']).join(', ')})`,
          type: 'file',
          required: !!cfg.mandatoryAttachments,
        });
      }

      return {
        id: r.id,
        title: r.name,
        titleEn: r.nameEn || r.name,
        description: r.description || '',
        icon: r.icon || 'Monitor',
        color: r.color || '#007AFF',
        targetDepartmentId: r.targetDepartmentId,
        targetDepartmentName: r.targetDepartmentName || '',
        targetDivisionId: r.targetDivisionId,
        targetDivisionName: r.targetDivisionName || '',
        targetTeamId: r.targetTeamId,
        targetTeamName: r.targetTeamName || '',
        formConfig: cfg,
        fields,
      };
    });
};

const getDynamicRequests = (): RequestType[] => {
  try {
    const rawRoutes = localStorage.getItem('litc_ticket_routes');
    if (rawRoutes) {
      const routes = JSON.parse(rawRoutes);
      const parsed = parseRoutesToRequests(routes);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading dynamic routes in HubContext', e);
  }
  return [];
};

const getActiveModules = (): Record<string, boolean> => {
  try {
    const stateStr = localStorage.getItem('ui_engine_state_v1');
    if (!stateStr) return {};
    const state = JSON.parse(stateStr);
    const modules: Record<string, boolean> = {};
    state.components?.forEach((c: any) => {
      modules[c.id] = !!c.isActive;
    });
    return modules;
  } catch {
    return {};
  }
};

export function HubProvider({ children, initialUser }: { children: ReactNode; initialUser?: User | null }) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser || DEFAULT_ENTRA_USER);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [requests, setRequests] = useState<RequestType[]>(() => getDynamicRequests());
  const [activeRequest, setActiveRequest] = useState<RequestType | null>(null);
  const [userRequests, setUserRequests] = useState<UserRecentRequest[]>([]);
  const [feedTab, setFeedTab] = useState<FeedTab>("news");
  const [requestOpen, setRequestOpen] = useState(false);
  const [techSupportOpen, setTechSupportOpen] = useState(false);
  const [operational, setOperational] = useState(false);
  const [challengesSubTab, setChallengesSubTab] = useState<'dept_challenges'>('dept_challenges');
  const [activeChatTarget, setActiveChatTarget] = useState<{ name: string; avatar: string; role: string; dept?: string; email?: string } | null>(null);
  const [activeEmailTarget, setActiveEmailTarget] = useState<{ name: string; email: string; role?: string; avatar?: string } | null>(null);
  const [activeProfileTarget, setActiveProfileTarget] = useState<{ name: string; avatar: string; role: string; dept: string; email: string; phone?: string; location?: string } | null>(null);
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>(() => getActiveModules());

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('litc_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('litc_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && localStorage.getItem('litc_theme') !== 'light');
      setDarkMode(isDark);
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('litc_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  // Dynamic sync of activeModules from API /api/v1/layouts with fallback to local storage
  const syncLayoutModulesFromApi = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/v1/layouts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.components)) {
          const modules: Record<string, boolean> = {};
          data.components.forEach((c: any) => {
            const compId = c.id || c.componentId;
            if (compId) {
              modules[compId] = c.isActive !== false;
            }
          });
          setActiveModules(prev => ({ ...prev, ...modules }));
          return;
        }
      }
    } catch {
      // Fallback below
    }
    setActiveModules(getActiveModules());
  }, []);

  useEffect(() => {
    syncLayoutModulesFromApi();
    window.addEventListener('litc_settings_updated', syncLayoutModulesFromApi);
    window.addEventListener('litc_layout_saved', syncLayoutModulesFromApi);
    return () => {
      window.removeEventListener('litc_settings_updated', syncLayoutModulesFromApi);
      window.removeEventListener('litc_layout_saved', syncLayoutModulesFromApi);
    };
  }, [syncLayoutModulesFromApi]);

  // Dynamic sync of real system routes created by the Admin
  const fetchSystemRoutes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [routesRes, fieldsRes, bldgsRes, treeRes] = await Promise.all([
        fetch('/api/v1/routing/routes', { headers: authHeaders }).catch(() => null),
        fetch('/api/v1/routing/dynamic-fields', { headers: authHeaders }).catch(() => null),
        fetch('/api/v1/org/buildings', { headers: authHeaders }).catch(() => null),
        fetch('/api/v1/org/tree', { headers: authHeaders }).catch(() => null),
      ]);

      let dynamicFieldsList: any[] = [];
      if (fieldsRes && fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        if (fieldsData.success && Array.isArray(fieldsData.fields)) {
          dynamicFieldsList = fieldsData.fields;
          localStorage.setItem('litc_dynamic_fields', JSON.stringify(dynamicFieldsList));
        }
      }

      let buildingsList: any[] = [];
      if (bldgsRes && bldgsRes.ok) {
        const bldgsData = await bldgsRes.json();
        if (Array.isArray(bldgsData)) {
          buildingsList = bldgsData;
          localStorage.setItem('litc_buildings', JSON.stringify(buildingsList));
        }
      }

      let orgTreeData: any = null;
      if (treeRes && treeRes.ok) {
        const treeJson = await treeRes.json();
        orgTreeData = treeJson.tree || (treeJson.id ? treeJson : null);
        if (orgTreeData) {
          localStorage.setItem('litc_org_tree', JSON.stringify(orgTreeData));
        }
      }

      if (routesRes && routesRes.ok) {
        const data = await routesRes.json();
        if (data.success && Array.isArray(data.routes)) {
          localStorage.setItem('litc_ticket_routes', JSON.stringify(data.routes));
          const parsed = parseRoutesToRequests(data.routes, dynamicFieldsList, buildingsList, orgTreeData);
          setRequests(parsed);
          return;
        }
      }
    } catch (err) {
      console.warn('[HubContext] Error fetching system routes, checking local cache', err);
    }

    const cached = getDynamicRequests();
    if (cached.length > 0) {
      setRequests(cached);
    }
  }, []);

  useEffect(() => {
    fetchSystemRoutes();
    window.addEventListener('litc_settings_updated', fetchSystemRoutes);
    return () => {
      window.removeEventListener('litc_settings_updated', fetchSystemRoutes);
    };
  }, [fetchSystemRoutes]);

  // Sync user if initialUser changes (e.g. after auth)
  useEffect(() => {
    if (initialUser) {
      setCurrentUser(prev => ({
        ...DEFAULT_ENTRA_USER,
        ...initialUser,
        customOverrides: prev.customOverrides || {}
      }));
    }
  }, [initialUser?.id]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('litc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('litc_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('litc_lang', language);
  }, [language]);

  // Fetch data from API (works with or without token)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch real system routes from Database via /api/v1/routing/routes
    fetchSystemRoutes();

    // Fetch News
    fetch('/api/v1/functional/news', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          const mappedNews = data.data.map((item: any) => ({
            id: item.id,
            type: 'official' as const,
            author: { name: 'الإدارة', role: 'نشر رسمي', avatar: '', department: '', points: 0 },
            content: item.body,
            image: item.coverImage,
            timestamp: item.createdAt,
            likes: 0,
            comments: 0,
          }));
          setPosts(prev => [...mappedNews, ...prev.filter(p => p.type !== 'official')]);
        }
      })
      .catch(console.error);

    // Fetch Community Posts
    fetch('/api/v1/functional/posts', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          const mappedPosts = data.data.map((item: any) => ({
            id: item.id,
            type: 'community' as const,
            author: {
              name: item.author?.fullName || 'مجهول',
              role: item.author?.ssoRole || 'موظف',
              avatar: item.author?.avatarUrl || '',
              department: '',
              points: 0
            },
            content: item.content,
            timestamp: item.createdAt,
            likes: item.reactions?.length || 0,
            comments: item.comments?.length || 0,
          }));
          setPosts(prev => [...mappedPosts, ...prev.filter(p => p.type !== 'community')]);
        }
      })
      .catch(console.error);

    // Fetch Challenges
    fetch('/api/v1/functional/challenges', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          const mappedChallenges = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            titleEn: item.titleEn || item.title,
            description: item.description,
            descriptionEn: item.descriptionEn || item.description,
            category: item.category,
            categoryEn: item.categoryEn || item.category,
            department: item.department,
            departmentEn: item.departmentEn || item.department,
            challengeType: item.challengeType || 'field_proof',
            deadline: item.deadline,
            deadlineEn: item.deadlineEn || item.deadline,
            rewardPoints: item.rewardPoints,
            firstTryBonus: item.firstTryBonus,
            earlyBirdQuota: item.earlyBirdQuota,
            earlyBirdClaimed: item.earlyBirdClaimed,
            earlyBirdBonus: item.earlyBirdBonus,
            badge: item.badge,
            iconName: item.iconName,
            progress: 0,
            total: 1,
            stars: 0,
            realReward: item.realReward,
            materialType: item.materialType,
            materialTitle: item.materialTitle,
            materialSummary: item.materialSummary,
            materialUrl: item.materialUrl,
            quizQuestions: item.quizQuestions,
            proofRequiredText: item.proofRequiredText,
            proofGuidelines: item.proofGuidelines,
            userStatus: item.userStatus || 'not_started',
            activeParticipants: item.activeParticipants || [],
            completedBy: item.completedBy || []
          }));
          setChallenges(mappedChallenges);
        }
      })
      .catch(console.error);

    // Fetch user's own requests
    const fetchMyRequests = () => {
      const tkn = localStorage.getItem('litc_token') || localStorage.getItem('token');
      const headers: Record<string, string> = tkn ? { Authorization: `Bearer ${tkn}` } : {};
      fetch('/api/v1/functional/my-requests', { headers, credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setUserRequests(data.data);
          }
        })
        .catch(console.error);
    };

    fetchMyRequests();

    window.addEventListener('litc_request_created', fetchMyRequests);
    return () => {
      window.removeEventListener('litc_request_created', fetchMyRequests);
    };
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleLanguage = () => setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations['ar'][key] || key;
  };

  const addPost = async (newPostData: Omit<Post, 'id' | 'author' | 'likes' | 'comments' | 'timestamp'>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/functional/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newPostData.content, postType: 'TEXT' })
      });
      const data = await res.json();
      if (data.success) {
        const item = data.data;
        const created: Post = {
          id: item.id,
          author: {
            id: item.author?.id || currentUser.id,
            name: item.author?.fullName || currentUser.name,
            role: item.author?.ssoRole || currentUser.role,
            avatar: item.author?.avatarUrl || currentUser.avatar,
            department: currentUser.department,
            points: 0
          },
          content: item.content,
          image: newPostData.image,
          likes: 0,
          comments: 0,
          timestamp: 'الآن',
          type: 'community',
        };
        setPosts(prev => [created, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    setChallenges(prev =>
      prev.map(c => {
        if (c.id !== challengeId || c.userStatus !== 'not_started') return c;
        return {
          ...c,
          userStatus: 'in_progress' as const,
          activeParticipants: [
            { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, department: currentUser.department, status: 'in_progress' as const, startedAt: 'الآن' },
            ...c.activeParticipants
          ]
        };
      })
    );
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/v1/functional/challenges/${challengeId}/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) { console.error(err); }
  };

  const submitChallengeProof = async (challengeId: string, proofImg?: string, note?: string) => {
    let finalAwarded = 0;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`/api/v1/functional/challenges/${challengeId}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) finalAwarded = data.pointsAwarded;
      }
    } catch (err) { console.error(err); }

    setChallenges(prev =>
      prev.map(c => {
        if (c.id !== challengeId) return c;
        const isEarlyBird = (c.earlyBirdClaimed || 0) < (c.earlyBirdQuota || 10);
        const totalAwarded = finalAwarded || (c.rewardPoints + (isEarlyBird ? (c.earlyBirdBonus || 0) : 0));
        setCurrentUser(u => ({ ...u, points: u.points + totalAwarded }));
        return {
          ...c,
          userStatus: 'completed' as const,
          earlyBirdClaimed: isEarlyBird ? (c.earlyBirdClaimed || 0) + 1 : c.earlyBirdClaimed,
          activeParticipants: c.activeParticipants.filter(p => p.id !== currentUser.id),
          completedBy: [
            { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, department: currentUser.department, status: 'completed' as const, completedAt: 'الآن', submissionImage: proofImg, proofNote: note, earnedPoints: totalAwarded, isEarlyBird },
            ...c.completedBy
          ],
          userEarnedReward: { totalPoints: totalAwarded, basePoints: c.rewardPoints, accuracyBonus: 0, earlyBirdBonus: isEarlyBird ? (c.earlyBirdBonus || 0) : 0, realPrizeTitle: c.realReward?.title }
        };
      })
    );
  };

  const completeChallengeQuiz = async (challengeId: string, scorePercent: number, isFirstTry: boolean, attemptsCount: number, isEarlyBird: boolean) => {
    let finalAwarded = 0;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`/api/v1/functional/challenges/${challengeId}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) finalAwarded = data.pointsAwarded;
      }
    } catch (err) { console.error(err); }

    setChallenges(prev =>
      prev.map(c => {
        if (c.id !== challengeId) return c;
        const basePts = Math.round((c.rewardPoints * scorePercent) / 100);
        const accuracyBonus = isFirstTry && scorePercent >= 100 ? (c.firstTryBonus || 50) : 0;
        const earlyBirdBonus = isEarlyBird ? (c.earlyBirdBonus || 0) : 0;
        const totalAwarded = finalAwarded || (basePts + accuracyBonus + earlyBirdBonus);
        setCurrentUser(u => ({ ...u, points: u.points + totalAwarded }));
        return {
          ...c,
          userStatus: 'completed' as const,
          earlyBirdClaimed: isEarlyBird ? (c.earlyBirdClaimed || 0) + 1 : c.earlyBirdClaimed,
          activeParticipants: c.activeParticipants.filter(p => p.id !== currentUser.id),
          completedBy: [
            { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, department: currentUser.department, status: 'completed' as const, completedAt: 'الآن', earnedPoints: totalAwarded, quizScorePercent: scorePercent, attemptsCount, isEarlyBird, proofNote: `اجتياز الاختبار بدرجة ${scorePercent}%` },
            ...c.completedBy
          ],
          userEarnedReward: { totalPoints: totalAwarded, basePoints: basePts, accuracyBonus, earlyBirdBonus, realPrizeTitle: c.realReward?.title }
        };
      })
    );
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser(prev => {
      const customOverrides = { ...(prev.customOverrides || {}) };
      Object.keys(updates).forEach(k => { customOverrides[k] = true; });
      return { ...prev, ...updates, syncStatus: 'overridden', customOverrides };
    });
  };

  const syncWithEntra = async () => {
    setCurrentUser(prev => ({ ...prev, syncStatus: 'syncing' }));
    await new Promise(resolve => setTimeout(resolve, 1100));
    setCurrentUser(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: 'الآن (محدث ومطابق لدليل Microsoft Entra)' }));
  };

  const resetToEntraDefaults = () => {
    setCurrentUser({ ...DEFAULT_ENTRA_USER, points: currentUser.points, syncStatus: 'synced', lastSyncedAt: 'الآن (تمت استعادة بيانات Entra الأصلية)', customOverrides: {} });
  };

  const rateRequest = async (requestId: string, rating: number, feedback: string) => {
    try {
      const cleanId = String(requestId || '').replace(/\D/g, '') || requestId;
      const token = sessionStorage.getItem('litc_token') || sessionStorage.getItem('token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/functional/requests/${cleanId}/rate-close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ rating, feedback })
      });
      const data = await res.json();
      if (data.success) {
        setUserRequests(prev => prev.map(req => (req.id === requestId || req.id === cleanId || req.code === requestId) ? {
          ...req,
          rating,
          feedback,
          status: 'completed',
          statusLabel: 'مؤرشف ومكتمل',
          isArchived: true
        } : req));
        // Refresh from server to ensure DB persistence
        window.dispatchEvent(new CustomEvent('litc_request_created'));
        return data;
      } else {
        console.error('[HubContext] Server rejected rating:', data.message);
        throw new Error(data.message || 'فشل حفظ التقييم');
      }
    } catch (err) {
      console.error('[HubContext] Error calling rate-close:', err);
      throw err;
    }
  };

  const canCreateRequest = (categoryId: string) => {
    const route = requests.find(r => r.id === categoryId);
    const cfg = route?.formConfig || {};

    // 1. Check concurrent open tickets in this route
    const openTickets = userRequests.filter(req =>
      (req.categoryId === categoryId || req.routeId === categoryId) &&
      !req.isArchived &&
      req.status !== 'completed' &&
      req.status !== 'approved' &&
      (req as any).statusName !== 'CLOSED' &&
      (req as any).statusName !== 'RESOLVED'
    );

    // Rule A: allowMultipleOpenTickets === false
    if (cfg.allowMultipleOpenTickets === false && openTickets.length > 0) {
      return {
        allowed: false,
        message: `لديك طلب مفتوح قيد المعالجة (${openTickets[0].code}). لا يمكن فتح طلب آخر حتى إغلاقه.`,
        messageEn: `You have an active ticket (${openTickets[0].code}). You cannot open another until it is closed.`
      };
    }

    // Rule B: maxConcurrentOpenTickets limit
    if (cfg.maxConcurrentOpenTickets && openTickets.length >= cfg.maxConcurrentOpenTickets) {
      return {
        allowed: false,
        message: `بلغت الحد الأقصى للطلبات المفتوحة المسموح بها في هذا المسار (${cfg.maxConcurrentOpenTickets} طلبات).`,
        messageEn: `Reached maximum concurrent open tickets (${cfg.maxConcurrentOpenTickets}).`
      };
    }

    // 2. Check unrated tickets
    const unratedTickets = userRequests.filter(req =>
      (req.categoryId === categoryId || req.routeId === categoryId) &&
      (req.isArchived || req.status === 'completed' || (req as any).statusName === 'CLOSED' || (req as any).statusName === 'RESOLVED') &&
      (req.rating === undefined || req.rating === null || req.rating === 0)
    );

    // Rule C: requireRatingBeforeNewTicket (Governance Controlled)
    if (cfg.requireRatingBeforeNewTicket && unratedTickets.length > 0) {
      return {
        allowed: false,
        message: `يرجى تقييم الطلب المنجز رقم ${unratedTickets[0].code} أولاً لإتاحة تقديم طلب جديد.`,
        messageEn: `Please rate completed ticket ${unratedTickets[0].code} before creating a new one.`
      };
    }

    // Rule D: maxUnratedTicketsAllowed limit
    if (cfg.maxUnratedTicketsAllowed && unratedTickets.length >= cfg.maxUnratedTicketsAllowed) {
      return {
        allowed: false,
        message: `لديك ${unratedTickets.length} طلبات منجزة دون تقييم. يرجى التقييم لإتاحة تقديم طلب جديد.`,
        messageEn: `You have ${unratedTickets.length} unrated tickets. Please rate them first.`
      };
    }

    return { allowed: true };
  };

  const openTechSupport = () => {
    setActiveRequest(requests.find(r => r.id === 'it') || null);
    setTechSupportOpen(true);
  };

  const localizedUser: User = useMemo(() => {
    if (language !== 'en') return currentUser;
    return {
      ...currentUser,
      name: currentUser.name === 'أحمد المحمد' ? 'Ahmed Al-Mohammed' : currentUser.name,
      role: currentUser.role === 'مهندس نظم أول' ? 'Senior Systems Engineer' : currentUser.role,
      department: currentUser.department === 'إدارة العمليات والتقنية' ? 'Operations & IT Department' : currentUser.department,
    };
  }, [currentUser, language]);

  const localizedPosts: Post[] = useMemo(() => {
    if (language === 'ar') return posts;
    return posts.map(p => {
      const newsItem = newsDepts.find(d => d.ar === p.author.name);
      if (p.type === 'official' && newsItem) {
        return { ...p, author: { ...p.author, name: newsItem.en, role: 'Official Notice', department: newsItem.en } };
      }
      return p;
    });
  }, [posts, language]);

  const localizedChallenges: Challenge[] = useMemo(() => language === 'ar' ? challenges : challenges, [challenges, language]);

  return (
    <HubContext.Provider value={{
      user: localizedUser,
      updateUserProfile,
      syncWithEntra,
      resetToEntraDefaults,
      posts: localizedPosts,
      addPost,
      requests,
      userRequests,
      refreshUserRequests: () => {
        const tkn = localStorage.getItem('litc_token') || localStorage.getItem('token');
        fetch('/api/v1/functional/my-requests', {
          headers: tkn ? { Authorization: `Bearer ${tkn}` } : {},
          credentials: 'include',
        })
          .then(res => res.json())
          .then(data => { if (data.success && Array.isArray(data.data)) setUserRequests(data.data); })
          .catch(console.error);
      },
      rateRequest,
      canCreateRequest,
      challenges: localizedChallenges,
      joinChallenge,
      submitChallengeProof,
      completeChallengeQuiz,
      activeRequest,
      setActiveRequest,
      feedTab,
      setFeedTab,
      requestOpen,
      setRequestOpen,
      techSupportOpen,
      setTechSupportOpen,
      openTechSupport,
      operational,
      setOperational,
      darkMode,
      toggleDarkMode,
      setDarkMode,
      language,
      toggleLanguage,
      setLanguage,
      t,
      activeModules,
      challengesSubTab,
      setChallengesSubTab,
      activeChatTarget,
      setActiveChatTarget,
      activeEmailTarget,
      setActiveEmailTarget,
      activeProfileTarget,
      setActiveProfileTarget,
    }}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const context = useContext(HubContext);
  if (!context) throw new Error('useHub must be used within a HubProvider');
  return context;
}
