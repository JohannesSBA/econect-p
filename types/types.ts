// ============================================
// ENUMS
// ============================================

export enum UserRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  EMPLOYER = "EMPLOYER",
  JOB_SEEKER = "JOB_SEEKER",
  RECRUITER = "RECRUITER",
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERN = "INTERN",
  FREELANCE = "FREELANCE",
}

export enum JobStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PAUSED = "PAUSED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum DegreeType {
  BACHELOR = "BACHELOR",
  MASTER = "MASTER",
  PHD = "PHD",
  DIPLOMA = "DIPLOMA",
  CERTIFICATE = "CERTIFICATE",
}

export enum ConversationPreview {
  id = "id",
  name = "name",
  lastMessage = "lastMessage",
  timestamp = "timestamp",
  unreadCount = "unreadCount",
  isOnline = "isOnline",
  avatar = "avatar",
  company = "company",
  chatId = "chatId",
}

export enum ConnectionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum NotificationType {
  CONNECTION_REQUEST = "CONNECTION_REQUEST",
  MESSAGE = "MESSAGE",
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  JOB_INVITATION = "JOB_INVITATION",
  APPLICATION_UPDATE = "APPLICATION_UPDATE",
}

export enum AdRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum PostType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  LINK = "LINK",
  ARTICLE = "ARTICLE",
}

export enum PostVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  UNLISTED = "UNLISTED",
}

export enum MessageRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  BLOCKED = "BLOCKED",
}

// ============================================
// MODEL TYPES
// ============================================

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  language: string;
  password: string | null;
  role: UserRole;
  image: string | null;
  headline: string | null;
  location: string | null;
  website: string | null;
  notificationSettings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  otp: string;
  createdAt: Date;
}

export interface Connection {
  id: string;
  senderId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string | null;
  content: string;
  type: PostType;
  visibility: PostVisibility;
  imageUrl: string | null;
  linkUrl: string | null;
  videoUrl: string | null;
  images: string[];
  eventDate: Date | null;
  eventTime: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostBookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface PostReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  createdAt: Date;
}

export interface CompanyFollow {
  id: string;
  followerId: string;
  companyId: string;
  createdAt: Date;
}

export interface MessageRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: MessageRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: Date;
}

export interface JobBookmark {
  id: string;
  userId: string;
  jobId: string;
  createdAt: Date;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  tags: string[];
  salary: string | null;
  jobType: JobType;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  publishedAt: Date | null;
  employerId: string;
}

export interface JobSeekerProfile {
  id: string;
  bio: string | null;
  education: Education[];
  resumeUrl: string | null;
  jobSeekerId: string;
}

export interface Experience {
  id: string;
  jobSeekerProfileId: string;
  jobTitle: string;
  company: string;
  companyUserId: string | null;
  location: string | null;
  employmentType: string | null;
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Education {
  id: string;
  jobSeekerProfileId: string;
  school: string;
  degreeType: DegreeType;
  fieldOfStudy: string | null;
  grade: number;
  StartYear: number;
  EndYear: number;
  activites: string | null;
}

export interface Skill {
  id: string;
  name: string;
}

export interface SkillOnProfile {
  id: string;
  skillId: string;
  profileId: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  appliedAt: Date;
  status: string;
  coverLetter: string | null;
  resumeUrl: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface VerificationToken {
  id: number;
  identifier: string;
  token: string;
  expires: Date;
}

export interface Message {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  senderId: string;
  recipientId: string;
  deliveredAt: Date | null;
  readAt: Date | null;
  replyTo: string | null;
  editedAt: Date | null;
  isEdited: boolean;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  uploadedById: string;
  type: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail: string | null;
  duration: number | null;
  createdAt: Date;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface UserOnlineStatus {
  id: string;
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  id: string;
  userId: string;
  chatId: string;
  isTyping: boolean;
  updatedAt: Date;
}

export interface AdvertisementRequest {
  id: string;
  requesterId: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  status: AdRequestStatus;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdPlacement {
  id: string;
  advertisementId: string;
  shownCount: number;
  lastShownAt: Date | null;
  createdAt: Date;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  companyLogo: string | null;
  website: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  employerId: string;
  jobId: string | null;
}

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface UserWithRelations extends User {
  jobListings?: JobListing[];
  profile?: JobSeekerProfile;
  applications?: JobApplication[];
  posts?: Post[];
  sentConnections?: Connection[];
  receivedConnections?: Connection[];
  likes?: Like[];
  comments?: Comment[];
  notifications?: Notification[];
  bookmarkedJobs?: JobBookmark[];
  postBookmarks?: PostBookmark[];
  followingCompanies?: CompanyFollow[];
  companyFollowers?: CompanyFollow[];
  sentBlocks?: UserBlock[];
  receivedBlocks?: UserBlock[];
  messagesSent?: Message[];
  messagesReceived?: Message[];
  messagesRead?: Message[];
  sessions?: Session[];
  uploadedAttachments?: MessageAttachment[];
  messageReactions?: MessageReaction[];
  onlineStatus?: UserOnlineStatus;
  typingIndicators?: TypingIndicator[];
  companyExperiences?: Experience[];
  employerProfile?: EmployerProfile;
  payments?: Payment[];
  advertisementRequests?: AdvertisementRequest[];
  postReports?: PostReport[];
  messageRequestsSent?: MessageRequest[];
  messageRequestsReceived?: MessageRequest[];
}

export interface ReceivedRequest {
  sender: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
    location: string | null;
  };
}

export interface SentRequest {
  id: string;
  createdAt: string | Date;
  sender: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
    location: string | null;
  };
}

export interface PostWithRelations extends Post {
  author?: User;
  likes?: Like[];
  comments?: Comment[];
  bookmarks?: PostBookmark[];
  reports?: PostReport[];
}

export interface JobListingWithRelations extends JobListing {
  employer?: User;
  applications?: JobApplication[];
  bookmarks?: JobBookmark[];
  payments?: Payment[];
}

export interface MessageWithRelations extends Message {
  sender?: User;
  recipient?: User;
  readBy?: User[];
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

// ============================================
// UTILITY TYPES
// ============================================

export type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserInput = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt">
>;

export type CreatePostInput = Omit<Post, "id" | "createdAt" | "updatedAt">;
export type UpdatePostInput = Partial<
  Omit<Post, "id" | "authorId" | "createdAt" | "updatedAt">
>;

export type CreateJobListingInput = Omit<
  JobListing,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateJobListingInput = Partial<
  Omit<JobListing, "id" | "employerId" | "createdAt" | "updatedAt">
>;

export type CreateMessageInput = Omit<
  Message,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deliveredAt"
  | "readAt"
  | "isEdited"
  | "editedAt"
>;
export type UpdateMessageInput = Partial<
  Pick<Message, "text" | "isEdited" | "editedAt">
>;

// ============================================
// FILTER AND QUERY TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface PostFilter {
  authorId?: string;
  type?: PostType;
  visibility?: PostVisibility;
  startDate?: Date;
  endDate?: Date;
}

export interface JobListingFilter {
  employerId?: string;
  jobType?: JobType;
  status?: JobStatus;
  location?: string;
  tags?: string[];
  minSalary?: number;
  maxSalary?: number;
}

export interface UserFilter {
  role?: UserRole;
  location?: string;
  skills?: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar: string;
  company: string;
  chatId: string | undefined;
}

// Type '{ id: string; name: string; lastMessage: string; timestamp: string; unreadCount: number; isOnline: false; avatar: string; company: string; chatId: string | undefined; }[]' .
//   Type '{ id: string; name: string; lastMessage: string; timestamp: string; unreadCount: number; isOnline: false; avatar: string; company: string; chatId: string | undefined; }'
//     Types of property 'chatId' are incompatible.
//       Type 'string | undefined' is not assignable to type 'string'.
//         Type 'undefined' is not assignable to type 'string'.ts(232
