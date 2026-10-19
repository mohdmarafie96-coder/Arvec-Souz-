export type ProjectStatus = 'Awaiting Client' | 'Revisions Requested' | 'Approved';
export type DeliverableType = 'image' | 'video' | 'render3d';
export type MilestoneStatus = 'completed' | 'current' | 'upcoming';
export type AuthorRole = 'client' | 'agency';

export interface Comment {
  id: string;
  author: string;
  authorRole: AuthorRole;
  content: string;
  timestamp: string;
  timecode?: string; // e.g. "00:14" for video
  pinLocation?: { x: number; y: number }; // Percentage coordinate on asset (e.g. 45%, 60%)
  isScopeAdjustment?: boolean;
}

export interface Deliverable {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  version: string;
  type: DeliverableType;
  status: ProjectStatus;
  notesFromAgency: string;
  revisionLimit: number;
  revisionsUsed: number;
  deadline: string;
  imageDimensions?: string;
  videoMeta?: {
    duration: number; // in seconds
    formattedDuration: string;
    resolution: string;
    markers: { time: number; label: string }[];
  };
  approvedAt?: string;
  approvedBy?: {
    name: string;
    role: string;
    signatureHash: string;
  };
  comments: Comment[];
}

export interface Milestone {
  id: string;
  stepNumber: number;
  title: string;
  status: MilestoneStatus;
  completedAt?: string;
  signedBy?: string;
}

export interface Project {
  id: string;
  token: string; // Magic client link token e.g. "solstice-brand-v2"
  clientName: string;
  clientContact: {
    name: string;
    role: string;
    email: string;
    phone: string;
    avatarInitials: string;
  };
  agencyName: string;
  title: string;
  category: 'Branding & Packaging' | 'Commercial Film' | '3D Architectural Visualization';
  status: ProjectStatus;
  currentMilestoneIndex: number;
  milestones: Milestone[];
  deliverables: Deliverable[];
  activeDeliverableId: string;
  turnaroundHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface NudgeLogEntry {
  id: string;
  channel: 'whatsapp' | 'email';
  clientName: string;
  projectTitle: string;
  deliverableTitle: string;
  timeAgo: string;
  status: 'Delivered & Read' | 'Sent' | 'Scheduled (+48h)';
  recipient: string;
  messageSnippet: string;
}

export type ActiveView = 'agency' | 'client';
