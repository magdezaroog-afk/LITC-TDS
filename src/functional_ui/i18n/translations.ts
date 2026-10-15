/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'en';

export interface Translations {
  // Brand & General
  brandTitle: string;
  brandTagline: string;
  pointsBadge: string;
  excellencePoints: string;
  notifications: string;
  searchPlaceholder: string;
  searchResults: string;
  quickLinks: string;
  noResults: string;
  searchKbd: string;
  
  // Navigation Tabs & Items
  tabOfficialNews: string;
  tabCommunity: string;
  tabChallenges: string;
  tabReels: string;
  navHome: string;
  navRequests: string;
  navHealthcare: string;
  navDirectory: string;
  navChallenges: string;
  navProfile: string;
  navSettings: string;
  newRequest: string;

  // Profile Popover & Settings
  profileDocuments: string;
  medicalCare: string;
  systemSettings: string;
  logout: string;
  themeToggle: string;
  darkModeTitle: string;
  lightModeTitle: string;
  darkModeDesc: string;
  lightModeDesc: string;
  languageToggle: string;
  arabicLang: string;
  englishLang: string;
  currentLangDesc: string;

  // Bottom Navigation
  menuAndServices: string;

  // Mobile Drawer
  employeePortal: string;
  quickRequests: string;
  annualLeave: string;
  annualLeaveDesc: string;
  salaryCert: string;
  salaryCertDesc: string;
  techSupport: string;
  techSupportDesc: string;
  medicalCard: string;
  medicalCardDesc: string;
  systemNavigation: string;
  unifiedPlatform: string;

  // Feed & Circulars
  newsFeedTitle: string;
  communityFeedTitle: string;
  postsCount: string;
  watchReels: string;
  loadMorePosts: string;
  endOfPosts: string;
  welcomeUser: string;
  communitySpace: string;
  communitySub: string;
  whatsOnYourMind: string;
  photoOrVideo: string;
  feelingsAndEmojis: string;
  publishPost: string;
  officialAnnouncements: string;
  urgentCirculars: string;
  celebrationsTitle: string;
  officialCircular: string;
  sharePostPlaceholder: string;
  publish: string;
  like: string;
  comment: string;
  share: string;

  // Reels
  reelsHeader: string;
  reelsLiveBadge: string;
  viewAll: string;
  closeReels: string;
  previousReel: string;
  nextReel: string;
  follow: string;
  publishReel: string;
  holdToHideHint: string;
  commentsCount: string;
  writeComment: string;
  linkCopied: string;
  soundOn: string;
  soundOff: string;

  // Requests Page
  requestsHubTitle: string;
  requestsHubDesc: string;
  trackRequests: string;
  newRequestBtn: string;
  pendingStatus: string;
  approvedStatus: string;
  rejectedStatus: string;
  activeRequests: string;
  viewAllHistory: string;
  viewTracks: string;
  categoryAdmin: string;
  categoryIT: string;
  categoryHR: string;
  categoryTravel: string;

  // Healthcare Page
  healthcareTitle: string;
  healthcareSub: string;
  emergency247: string;
  fullMedicalGuide: string;
  bookAppointment: string;
  approvedMeds: string;
  medicalClaims: string;
  accreditedClinics: string;
  openNow: string;
  open247: string;

  // Directory Page
  directoryTitle: string;
  directorySub: string;
  searchColleaguesPlaceholder: string;
  allDepartments: string;

  // Challenges Page
  challengesHeroTitle: string;
  challengesHeroSub: string;
  challengesProgram: string;
  allChallenges: string;
  activeChallenges: string;
  myChallenges: string;
  completedChallenges: string;
  leaderboardTitle: string;
  leaderboardSub: string;
  joinChallenge: string;
  submitProof: string;
  viewDetails: string;

  // Profile Page
  profileAvailable: string;
  profileRank: string;
  completedTasks: string;
  workInfo: string;
  employeeId: string;
  joinDate: string;
  workLocation: string;
  directManager: string;
  digitalBadges: string;
  recentActivity: string;
  entraConnected: string;
  syncNow: string;
  syncing: string;
  lastSynced: string;
  editProfile: string;
  editProfileDesc: string;
  saveChanges: string;
  cancel: string;
  resetDefaults: string;
  jobDetails: string;
  contactDetails: string;
  skillsAndBio: string;
  entraSecurity: string;
  mobilePhone: string;
  businessPhone: string;
  officeRoom: string;
  cityCountry: string;
  aboutMeLabel: string;
  skillsLabel: string;
  addSkillPlaceholder: string;
  managerInfo: string;
  directReports: string;
  licensesLabel: string;
  mfaEnforced: string;
  overrideBadge: string;
  syncedBadge: string;
  hrCorrectionNote: string;
  profileUpdatedToast: string;
  profileSyncedToast: string;

  // Settings Page
  settingsTitle: string;
  settingsDesc: string;
  appearanceAndNotifications: string;
  systemNotifications: string;
  systemNotificationsDesc: string;
  interfaceLanguage: string;
  securityAndPrivacy: string;
  changePassword: string;
  connectedDevices: string;
  directoryVisibility: string;
  directoryVisibilityDesc: string;

  // App Quests & Perks Store
  appCoins: string;
  appQuestsTab: string;
  deptChallengesTab: string;
  perksStoreTab: string;
  appQuestsTitle: string;
  appQuestsSub: string;
  perksStoreTitle: string;
  perksStoreSub: string;
  unlockFeature: string;
  unlockedActive: string;
  insufficientCoins: string;
  questClaimReward: string;
  questClaimed: string;
  lockedFeatureNotice: string;
  openPerksStore: string;
  chatWithColleague: string;
  sendColleagueEmail: string;
  blockColleague: string;
  unblockColleague: string;
  colleagueBlocked: string;
  colleagueUnblocked: string;
  perkUnlockedToast: string;
  coinsEarnedToast: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    // Brand & General
    brandTitle: 'Nexus',
    brandTagline: 'الفضاء الذكي للمؤسسات | The Intelligent Space for Enterprises',
    pointsBadge: 'نقطة',
    excellencePoints: 'نقطة تميز',
    notifications: 'التنبيهات',
    searchPlaceholder: 'ابحث في الأخبار، الزملاء، والخدمات...',
    searchResults: 'نتائج البحث',
    quickLinks: 'روابط سريعة ومقترحة',
    noResults: 'لا توجد نتائج مطابقة',
    searchKbd: 'بحث',

    // Navigation Tabs & Items
    tabOfficialNews: 'الأخبار الرسمية',
    tabCommunity: 'المجتمع',
    tabChallenges: 'التحديات',
    tabReels: 'Reels',
    navHome: 'الرئيسية',
    navRequests: 'الطلبات',
    navHealthcare: 'الرعاية',
    navDirectory: 'الدليل',
    navChallenges: 'التحديات',
    navProfile: 'الملف الشخصي',
    navSettings: 'الإعدادات',
    newRequest: 'طلب جديد',

    // Profile Popover
    profileDocuments: 'الملف الشخصي والمستندات',
    medicalCare: 'البطاقة الطبية والرعاية',
    systemSettings: 'إعدادات النظام والأمان',
    logout: 'تسجيل الخروج',
    themeToggle: 'المظهر',
    darkModeTitle: 'الوضع الداكن',
    lightModeTitle: 'الوضع الفاتح',
    darkModeDesc: 'مفعل بألوان الريلز الداكنة',
    lightModeDesc: 'مفعل بالواجهات الفاتحة',
    languageToggle: 'اللغة',
    arabicLang: 'العربية',
    englishLang: 'English',
    currentLangDesc: 'تغيير لغة المنظومة',

    // Bottom Navigation
    menuAndServices: 'القائمة والخدمات الذاتية',

    // Mobile Drawer
    employeePortal: 'بوابة الخدمات الشاملة',
    quickRequests: 'الخدمات السريعة والطلبات',
    annualLeave: 'طلب إجازة سنوية',
    annualLeaveDesc: 'تقديم طلب إجازة واعتمادها آلياً',
    salaryCert: 'شهادة مرتب وتأكيد عمل',
    salaryCertDesc: 'إصدار فوري معتمد رقمياً',
    techSupport: 'طلب دعم فني وتجهيزات',
    techSupportDesc: 'بلاغات الأنظمة والبرمجيات والمعدات',
    medicalCard: 'البطاقة العلاجية الرقمية',
    medicalCardDesc: 'عرض الشبكة الطبية والمستشفيات',
    systemNavigation: 'أقسام المنظومة',
    unifiedPlatform: 'منظومة LITC الموحدة',

    // Feed & Circulars
    newsFeedTitle: '🏛️ الأخبار والبيانات الرسمية',
    communityFeedTitle: '👥 مشاركات ومجتمع الموظفين',
    postsCount: 'منشور',
    watchReels: 'مشاهدة Reels',
    loadMorePosts: 'تحميل المزيد من المنشورات',
    endOfPosts: 'نهاية المنشورات ✨',
    welcomeUser: 'مرحبًا',
    communitySpace: 'مساحة المجتمع',
    communitySub: 'شارك زملاءك تجاربك، إنجازاتك اليومية، أو أفكارك المبتكرة',
    whatsOnYourMind: 'ما الذي ترغب بمشاركته اليوم مع الزملاء؟',
    photoOrVideo: 'صورة أو فيديو',
    feelingsAndEmojis: 'تفاعل وشعور',
    publishPost: 'نشر في المجتمع',
    officialAnnouncements: 'التعاميم والقرارات الرسمية',
    urgentCirculars: 'تعاميم هامة ومحدثة',
    celebrationsTitle: 'مناسبات وتهاني الزملاء',
    officialCircular: 'إعلان رسمي 📢',
    sharePostPlaceholder: 'شارك زملاءك منشوراً جديداً، تهنئة، أو فكرة ملهمة...',
    publish: 'نشر',
    like: 'إعجاب',
    comment: 'تعليق',
    share: 'مشاركة',

    // Reels
    reelsHeader: 'قصص وريلز الميدان',
    reelsLiveBadge: 'مباشر',
    viewAll: 'عرض الكل',
    closeReels: 'إغلاق الريلز',
    previousReel: 'الريل السابق',
    nextReel: 'الريل التالي',
    follow: 'متابعة',
    publishReel: 'نشر',
    holdToHideHint: 'المس مع الاستمرار لإخفاء العناصر',
    commentsCount: 'التعليقات',
    writeComment: 'أضف تعليقاً لائقاً...',
    linkCopied: 'تم نسخ رابط المقطع للمشاركة',
    soundOn: 'تشغيل الصوت',
    soundOff: 'كتم الصوت',

    // Requests Page
    requestsHubTitle: 'مركز الطلبات الذكي',
    requestsHubDesc: 'تتبع وقم بإنشاء طلباتك الإدارية والتقنية بكل سهولة',
    trackRequests: 'متابعة حالة الطلبات',
    newRequestBtn: 'إنشاء طلب جديد',
    pendingStatus: 'قيد المراجعة',
    approvedStatus: 'معتمد',
    rejectedStatus: 'مرفوض',
    activeRequests: 'الطلبات النشطة',
    viewAllHistory: 'مشاهدة السجل الكامل',
    viewTracks: 'عرض المسارات',
    categoryAdmin: 'إدارية',
    categoryIT: 'تقنية',
    categoryHR: 'موارد بشرية',
    categoryTravel: 'سفر ومهام',

    // Healthcare Page
    healthcareTitle: 'بوابتك الذكية للرعاية الصحية',
    healthcareSub: 'احجز موعدك، ابحث عن أقرب صيدلية معتمدة، وقم بإدارة مطالباتك الطبية وتأمينك في مكان واحد وبكل سهولة.',
    emergency247: 'طوارئ 24/7',
    fullMedicalGuide: 'دليلي الطبي الكامل',
    bookAppointment: 'حجز موعد',
    approvedMeds: 'الأدوية المعتمدة',
    medicalClaims: 'المطالبات الطبية',
    accreditedClinics: 'المرافق الصحية والعيادات المعتمدة',
    openNow: 'مفتوح الآن',
    open247: 'مفتوح 24 ساعة',

    // Directory Page
    directoryTitle: 'دليل الزملاء',
    directorySub: 'اكتشف وتواصل مع زملائك المبدعين في مختلف الإدارات',
    searchColleaguesPlaceholder: 'ابحث بالاسم، الدور، أو الإدارة...',
    allDepartments: 'جميع الإدارات',

    // Challenges Page
    challengesHeroTitle: 'شارك في التحديات واكسب نقاط التميز والأوسمة',
    challengesHeroSub: 'حقق أهدافك المهنية والصحية، شارك إثباتاتك المصورة، ونافس زملاءك في قائمة الشرف.',
    challengesProgram: 'برنامج تحديات وتميز موظفي LITC',
    allChallenges: 'جميع التحديات',
    activeChallenges: 'التحديات النشطة',
    myChallenges: 'تحدياتي',
    completedChallenges: 'المكتملة',
    leaderboardTitle: 'لوحة الشرف الشهرية',
    leaderboardSub: 'ترتيب الموظفين الأكثر تفاعلاً وإنجازاً',
    joinChallenge: 'انضم للتحدي',
    submitProof: 'رفع إثبات مصور',
    viewDetails: 'عرض التفاصيل',

    // Profile Page
    profileAvailable: 'متاح للعمل الآن',
    profileRank: 'الترتيب العام',
    completedTasks: 'المعاملات المنجزة',
    workInfo: 'المعلومات الوظيفية',
    employeeId: 'الرقم الوظيفي',
    joinDate: 'تاريخ الانضمام',
    workLocation: 'مقر العمل',
    directManager: 'المدير المباشر',
    digitalBadges: 'الأوسمة والإنجازات',
    recentActivity: 'النشاط الأخير',
    entraConnected: 'متصل مع Microsoft Entra ID',
    syncNow: 'مزامنة مع مايكروسوفت',
    syncing: 'جاري المزامنة...',
    lastSynced: 'آخر مزامنة',
    editProfile: 'تعديل وتصحيح البيانات',
    editProfileDesc: 'تعديل بياناتك الوظيفية والشخصية مع إمكانية إشعار قسم الموارد البشرية',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',
    resetDefaults: 'استعادة بيانات Entra الأصلية',
    jobDetails: 'البيانات الوظيفية',
    contactDetails: 'بيانات الاتصال والمكتب',
    skillsAndBio: 'المهارات والنبذة المهنية',
    entraSecurity: 'الهوية السحابية والأمان',
    mobilePhone: 'رقم الهاتف المحمول',
    businessPhone: 'الهاتف المكتبي / التحويلة',
    officeRoom: 'موقع المكتب / الغرفة',
    cityCountry: 'المدينة والدولة',
    aboutMeLabel: 'نبذة عني / سيرة مهنية',
    skillsLabel: 'المهارات والشهادات',
    addSkillPlaceholder: 'أضف مهارة جديدة واضغط Enter...',
    managerInfo: 'معلومات المدير المباشر',
    directReports: 'فريق العمل التابع',
    licensesLabel: 'التراخيص الممنوحة (M365)',
    mfaEnforced: 'التحقق الثنائي (MFA Enforced)',
    overrideBadge: 'معدل محلياً',
    syncedBadge: 'معتمد من Entra ID',
    hrCorrectionNote: 'ملاحظة: التعديلات تنعكس فورياً في حسابك بالتطبيق، ويتم إرسال طلب تصحيح اختياري لقاعدة بيانات الموارد البشرية و Microsoft 365.',
    profileUpdatedToast: 'تم تحديث بيانات الملف الشخصي بنجاح!',
    profileSyncedToast: 'تمت مزامنة البيانات بنجاح مع Microsoft Entra ID ✨',

    // Settings Page
    settingsTitle: 'الإعدادات والمظهر',
    settingsDesc: 'خصص تجربتك وواجهات منظومة Nexus حسب تفضيلاتك',
    appearanceAndNotifications: 'المظهر والتنبيهات',
    systemNotifications: 'إشعارات النظام والطلبات',
    systemNotificationsDesc: 'تنبيهات عند الرد على طلباتك أو إضافة تعاميم جديدة',
    interfaceLanguage: 'لغة الواجهة',
    securityAndPrivacy: 'الأمان والخصوصية',
    changePassword: 'تغيير كلمة المرور وتفعيل 2FA',
    connectedDevices: 'الأجهزة المتصلة والجلسات النشطة',
    directoryVisibility: 'إمكانية ظهور الملف بالدليل',
    directoryVisibilityDesc: 'مرئي لجميع الزملاء',

    // App Quests & Perks Store
    appCoins: 'عملات التطبيق',
    appQuestsTab: 'مهام وتحديات التطبيق',
    deptChallengesTab: 'تحديات الإدارات والجوائز',
    perksStoreTab: 'متجر امتيازات التطبيق',
    appQuestsTitle: 'مهام التطبيق وتحديات التفاعل',
    appQuestsSub: 'أنجز مهام التفاعل اليومية واكسب عملات رقمية لفتح ميزات حصرية',
    perksStoreTitle: 'متجر ترقيات وخصائص التطبيق',
    perksStoreSub: 'استبدل عملات نشاطك لفتح الوضع الداكن، المحادثات، البريد، وحظر المستخدمين والمزيد',
    unlockFeature: 'فتح الخاصية',
    unlockedActive: 'مفعلة وتعمل',
    insufficientCoins: 'عملات غير كافية',
    questClaimReward: 'استلام العملات',
    questClaimed: 'تم الاستلام',
    lockedFeatureNotice: 'هذه الخاصية مقفلة في حسابك حالياً. يمكنك فتحها من متجر امتيازات التطبيق عبر عملات النشاط!',
    openPerksStore: 'فتح متجر الخصائص',
    chatWithColleague: 'دردشة فورية',
    sendColleagueEmail: 'إرسال بريد رسمي',
    blockColleague: 'حظر وكتم الزميل',
    unblockColleague: 'إلغاء الحظر',
    colleagueBlocked: 'تم حظر الموظف وكتم تفاعلاته بنجاح',
    colleagueUnblocked: 'تم إلغاء حظر الموظف',
    perkUnlockedToast: '🎉 تم فتح وتفعيل الخاصية بنجاح في حسابك!',
    coinsEarnedToast: '💰 تم كسب عملات إضافية في رصيدك!',
  },
  en: {
    // Brand & General
    brandTitle: 'Nexus',
    brandTagline: 'The Intelligent Space for Enterprises',
    pointsBadge: 'pts',
    excellencePoints: 'Excellence Points',
    notifications: 'Notifications',
    searchPlaceholder: 'Search news, colleagues, services...',
    searchResults: 'Search Results',
    quickLinks: 'Quick & Suggested Links',
    noResults: 'No matching results',
    searchKbd: 'Search',

    // Navigation Tabs & Items
    tabOfficialNews: 'Official News',
    tabCommunity: 'Community',
    tabChallenges: 'Challenges',
    tabReels: 'Reels',
    navHome: 'Home',
    navRequests: 'Requests',
    navHealthcare: 'Healthcare',
    navDirectory: 'Directory',
    navChallenges: 'Challenges',
    navProfile: 'Profile',
    navSettings: 'Settings',
    newRequest: 'New Request',

    // Profile Popover
    profileDocuments: 'Profile & Documents',
    medicalCare: 'Health Card & Care',
    systemSettings: 'System & Security Settings',
    logout: 'Sign Out',
    themeToggle: 'Appearance',
    darkModeTitle: 'Dark Mode',
    lightModeTitle: 'Light Mode',
    darkModeDesc: 'Activated with sleek dark reel tones',
    lightModeDesc: 'Activated with crisp light interfaces',
    languageToggle: 'Language',
    arabicLang: 'العربية',
    englishLang: 'English',
    currentLangDesc: 'Switch platform language',

    // Bottom Navigation
    menuAndServices: 'Menu & Self-Services',

    // Mobile Drawer
    employeePortal: 'Comprehensive Services Portal',
    quickRequests: 'Quick Services & Requests',
    annualLeave: 'Annual Leave Request',
    annualLeaveDesc: 'Submit leave request with automated approval',
    salaryCert: 'Salary & Work Certificate',
    salaryCertDesc: 'Digitally verified instant issuance',
    techSupport: 'IT & Equipment Support',
    techSupportDesc: 'Software, system & device support tickets',
    medicalCard: 'Digital Medical Card',
    medicalCardDesc: 'View healthcare network & hospitals',
    systemNavigation: 'Platform Sections',
    unifiedPlatform: 'Unified LITC Platform',

    // Feed & Circulars
    newsFeedTitle: '🏛️ Official News & Announcements',
    communityFeedTitle: '👥 Staff Community & Posts',
    postsCount: 'posts',
    watchReels: 'Watch Reels',
    loadMorePosts: 'Load More Posts',
    endOfPosts: 'End of posts ✨',
    welcomeUser: 'Welcome',
    communitySpace: 'Community Space',
    communitySub: 'Share your experiences, daily achievements, or inspiring ideas with colleagues',
    whatsOnYourMind: "What's on your mind today?",
    photoOrVideo: 'Photo or Video',
    feelingsAndEmojis: 'Feelings & Emojis',
    publishPost: 'Publish to Community',
    officialAnnouncements: 'Official Circulars & Decisions',
    urgentCirculars: 'Important & Recent Circulars',
    celebrationsTitle: 'Colleagues Celebrations & Greetings',
    officialCircular: 'Official Circular 📢',
    sharePostPlaceholder: 'Share a new update, greeting, or inspiring idea...',
    publish: 'Post',
    like: 'Like',
    comment: 'Comment',
    share: 'Share',

    // Reels
    reelsHeader: 'Field Stories & Reels',
    reelsLiveBadge: 'LIVE',
    viewAll: 'View All',
    closeReels: 'Close Reels',
    previousReel: 'Previous Reel',
    nextReel: 'Next Reel',
    follow: 'Follow',
    publishReel: 'Share',
    holdToHideHint: 'Hold screen to clear all elements',
    commentsCount: 'Comments',
    writeComment: 'Add a comment...',
    linkCopied: 'Reel link copied to clipboard',
    soundOn: 'Unmute Audio',
    soundOff: 'Mute Audio',

    // Requests Page
    requestsHubTitle: 'Smart Requests Center',
    requestsHubDesc: 'Easily track and create your administrative and technical requests',
    trackRequests: 'Track Request Status',
    newRequestBtn: 'Create New Request',
    pendingStatus: 'Under Review',
    approvedStatus: 'Approved',
    rejectedStatus: 'Rejected',
    activeRequests: 'Active Requests',
    viewAllHistory: 'View Full History',
    viewTracks: 'View Tracks',
    categoryAdmin: 'Administrative',
    categoryIT: 'IT Support',
    categoryHR: 'Human Resources',
    categoryTravel: 'Travel & Missions',

    // Healthcare Page
    healthcareTitle: 'Your Smart Healthcare Portal',
    healthcareSub: 'Book appointments, find accredited pharmacies, and manage medical insurance easily in one place.',
    emergency247: 'Emergency 24/7',
    fullMedicalGuide: 'Full Medical Guide',
    bookAppointment: 'Book Appointment',
    approvedMeds: 'Approved Medications',
    medicalClaims: 'Medical Claims',
    accreditedClinics: 'Accredited Healthcare Facilities & Clinics',
    openNow: 'Open Now',
    open247: 'Open 24/7',

    // Directory Page
    directoryTitle: 'Colleagues Directory',
    directorySub: 'Discover and connect with your colleagues across all departments',
    searchColleaguesPlaceholder: 'Search by name, role, or department...',
    allDepartments: 'All Departments',

    // Challenges Page
    challengesHeroTitle: 'Join Challenges & Earn Excellence Points and Badges',
    challengesHeroSub: 'Achieve career and wellness goals, upload photo proofs, and climb the leaderboard.',
    challengesProgram: 'LITC Employee Challenges & Excellence Program',
    allChallenges: 'All Challenges',
    activeChallenges: 'Active Challenges',
    myChallenges: 'My Challenges',
    completedChallenges: 'Completed',
    leaderboardTitle: 'Monthly Leaderboard',
    leaderboardSub: 'Top active and high-achieving employees',
    joinChallenge: 'Join Challenge',
    submitProof: 'Upload Photo Proof',
    viewDetails: 'View Details',

    // Profile Page
    profileAvailable: 'Available for work now',
    profileRank: 'Global Rank',
    completedTasks: 'Completed Requests',
    workInfo: 'Employment Information',
    employeeId: 'Employee ID',
    joinDate: 'Join Date',
    workLocation: 'Work Location',
    directManager: 'Direct Manager',
    digitalBadges: 'Badges & Achievements',
    recentActivity: 'Recent Activity',
    entraConnected: 'Connected with Microsoft Entra ID',
    syncNow: 'Sync with Microsoft',
    syncing: 'Syncing...',
    lastSynced: 'Last synced',
    editProfile: 'Edit & Correct Info',
    editProfileDesc: 'Edit your employment and personal details with optional HR update notification',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    resetDefaults: 'Revert to Entra Defaults',
    jobDetails: 'Job Information',
    contactDetails: 'Contact & Office Location',
    skillsAndBio: 'Skills & Bio',
    entraSecurity: 'Cloud Identity & Security',
    mobilePhone: 'Mobile Phone Number',
    businessPhone: 'Office Phone / Ext.',
    officeRoom: 'Office Location / Room',
    cityCountry: 'City & Country',
    aboutMeLabel: 'About Me / Professional Bio',
    skillsLabel: 'Skills & Competencies',
    addSkillPlaceholder: 'Add new skill and press Enter...',
    managerInfo: 'Direct Manager Info',
    directReports: 'Direct Reports & Team',
    licensesLabel: 'Assigned Licenses (M365)',
    mfaEnforced: 'Multi-Factor Auth (MFA Enforced)',
    overrideBadge: 'Locally Overridden',
    syncedBadge: 'Verified from Entra ID',
    hrCorrectionNote: 'Note: Changes take effect immediately in your app profile, and an optional directory correction request is queued for HR / IT Microsoft 365 admins.',
    profileUpdatedToast: 'Profile information updated successfully!',
    profileSyncedToast: 'Data synchronized with Microsoft Entra ID ✨',

    // Settings Page
    settingsTitle: 'Settings & Appearance',
    settingsDesc: 'Customize your Nexus platform experience according to your preferences',
    appearanceAndNotifications: 'Appearance & Notifications',
    systemNotifications: 'System & Request Notifications',
    systemNotificationsDesc: 'Alerts when your requests are processed or new circulars posted',
    interfaceLanguage: 'Interface Language',
    securityAndPrivacy: 'Security & Privacy',
    changePassword: 'Change Password & 2FA',
    connectedDevices: 'Active Sessions & Devices',
    directoryVisibility: 'Directory Profile Visibility',
    directoryVisibilityDesc: 'Visible to all colleagues',

    // App Quests & Perks Store
    appCoins: 'App Coins',
    appQuestsTab: 'App Quests & Activity',
    deptChallengesTab: 'Official Department Challenges',
    perksStoreTab: 'App Perks Store',
    appQuestsTitle: 'App Activity & Engagement Quests',
    appQuestsSub: 'Complete daily engagement tasks and earn app coins to unlock premium capabilities',
    perksStoreTitle: 'App Perks & Upgrades Store',
    perksStoreSub: 'Redeem your coins to unlock Dark Mode, Direct Chat, Email Dispatch, User Blocking & more',
    unlockFeature: 'Unlock Perk',
    unlockedActive: 'Active & Unlocked',
    insufficientCoins: 'Insufficient Coins',
    questClaimReward: 'Claim Coins',
    questClaimed: 'Claimed',
    lockedFeatureNotice: 'This feature is currently locked. You can unlock it in the App Perks Store using your activity coins!',
    openPerksStore: 'Open Perks Store',
    chatWithColleague: 'Quick Chat',
    sendColleagueEmail: 'Send Email',
    blockColleague: 'Block / Mute Colleague',
    unblockColleague: 'Unblock',
    colleagueBlocked: 'Colleague has been blocked and muted',
    colleagueUnblocked: 'Colleague unblocked successfully',
    perkUnlockedToast: '🎉 Feature unlocked and enabled in your account!',
    coinsEarnedToast: '💰 Coins added to your balance!',
  }
};
