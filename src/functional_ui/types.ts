/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export interface RequestStep {
  id: string;
  label: string;
  labelEn: string;
  status: 'completed' | 'current' | 'upcoming' | 'failed';
  timestamp?: string;
  actor?: string;
  actorEn?: string;
  note?: string;
  noteEn?: string;
  isSubTicketStep?: boolean;
  isReturnToPrimary?: boolean;
  subTicket?: {
    id: number;
    title: string;
    department: string;
    assignedTech?: string | null;
    status: string;
    isClosed: boolean;
  };
}

export interface UserRecentRequest {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  department: string;
  departmentEn: string;
  date: string;
  status: RequestStatus;
  statusLabel: string;
  statusLabelEn: string;
  stage: string;
  stageEn: string;
  steps: RequestStep[];
  rejectionReason?: string;
  rejectionReasonEn?: string;
  rating?: number;
  feedback?: string;
  categoryId: string; // To check blocking for new requests of same category
  primaryAssignee?: string;
  subTickets?: Array<{
    id: number;
    title: string;
    department: string;
    assignedTech?: string | null;
    status: string;
    statusName?: string;
    isClosed: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  hasOpenSubTickets?: boolean;
  isArchived?: boolean;
  statusName?: string;
}

// AppCoinQuest و AppPerk محذوفان — نظام التلعيب ممنوع بالدستور (القسم الخامس)

export interface DirectChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read?: boolean;
  isMe?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  points: number; // Institutional Department Points (نقاط التميز الإدارية)
  appCoins?: number; // App Activity Coins (عملات نشاط وتفاعل التطبيق)
  unlockedPerks?: string[]; // IDs of unlocked app store features
  blockedUsers?: string[]; // IDs of blocked employees
  privacyHideProfile?: boolean; // If user toggled privacy hide profile
  
  // Microsoft Entra ID & Corporate Profile Fields
  email?: string;
  userPrincipalName?: string;
  employeeId?: string;
  company?: string;
  mobilePhone?: string;
  businessPhone?: string;
  officeLocation?: string;
  city?: string;
  country?: string;
  hireDate?: string;
  manager?: {
    name: string;
    role: string;
    email: string;
    avatar: string;
    department?: string;
  };
  directReportsCount?: number;
  skills?: string[];
  aboutMe?: string;
  entraObjectId?: string;
  tenantDomain?: string;
  syncStatus?: 'synced' | 'overridden' | 'syncing';
  lastSyncedAt?: string;
  presence?: 'Available' | 'InAMeeting' | 'Busy' | 'Away' | 'Offline';
  licenses?: string[];
  customOverrides?: Record<string, boolean>;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: 'official' | 'community';
}

export interface RequestType {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  icon: string;
  color?: string;
  targetDepartmentId?: string;
  targetDepartmentName?: string;
  targetDivisionId?: string;
  targetDivisionName?: string;
  targetTeamId?: string;
  targetTeamName?: string;
  formConfig?: any;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'select' | 'file' | 'textarea' | 'date' | 'number' | string;
    options?: string[];
    required?: boolean;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionEn?: string;
  options: string[];
  optionsEn?: string[];
  correctIndex: number;
  explanation: string;
  explanationEn?: string;
}

export interface RealReward {
  title: string;
  titleEn: string;
  type: 'cash' | 'voucher' | 'certificate' | 'trophy' | 'gift' | 'leave_day';
  valueText: string;
  sponsorDept: string;
  sponsorDeptEn?: string;
  claimedStatus?: 'pending_collection' | 'collected';
}

export interface ChallengeParticipant {
  id: string;
  name: string;
  avatar: string;
  department?: string;
  status: 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  submissionImage?: string;
  proofNote?: string;
  likesCount?: number;
  earnedPoints?: number;
  quizScorePercent?: number;
  attemptsCount?: number;
  isEarlyBird?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  categoryEn?: string;
  department: string; // الإدارة المصدرة للتحدي (الأمن السيبراني، الموارد البشرية، إلخ)
  departmentEn: string;
  challengeType: 'quiz_learning' | 'field_proof' | 'speed_first_come' | 'innovation_pitch';
  deadline: string;
  deadlineEn?: string;
  rewardPoints: number;
  firstTryBonus?: number;
  earlyBirdQuota?: number;
  earlyBirdClaimed?: number;
  earlyBirdBonus?: number;
  badge: string;
  iconName?: string;
  progress: number;
  total: number;
  stars: number;
  
  // Real material prize
  realReward?: RealReward;

  // Learning / Verification materials
  materialType?: 'video' | 'report_doc' | 'slides';
  materialTitle?: string;
  materialTitleEn?: string;
  materialSummary?: string;
  materialSummaryEn?: string;
  materialUrl?: string;
  materialVideoPreview?: string;
  
  // Quiz
  quizQuestions?: QuizQuestion[];

  // Field proof
  proofRequiredText?: string;
  proofRequiredTextEn?: string;
  proofGuidelines?: string[];
  
  activeParticipants: ChallengeParticipant[];
  completedBy: ChallengeParticipant[];
  userStatus: 'not_started' | 'in_progress' | 'completed';
  userEarnedReward?: {
    totalPoints: number;
    basePoints: number;
    accuracyBonus: number;
    earlyBirdBonus: number;
    realPrizeTitle?: string;
  };
}
