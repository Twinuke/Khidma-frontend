export interface ClientShort {
  userId: number;
  fullName: string;
  rating?: number;
}

export interface Job {
  jobId: number;
  title: string;
  description: string;
  category?: string;
  budget: number;
  createdAt: string;
  deadline?: string;
  isRemote?: boolean;
  experienceLevel?: string;
  client?: ClientShort;
  bidsCount?: number;
  // ✅ NEW FIELD
  hasPlacedBid?: boolean;
}