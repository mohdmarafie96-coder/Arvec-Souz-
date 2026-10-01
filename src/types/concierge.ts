export type Language = 'en' | 'ar';

export type UserRole = 'admin' | 'shopper';

export type ShopperStatus = 'pending_approval' | 'approved' | 'rejected';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: ShopperStatus;
  hubCity?: string;
  phone?: string;
  specialization?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type PipelineStage =
  | 'Request Logged'
  | 'Boutique Sourced'
  | 'Deposit Received'
  | 'Acquired & Packed'
  | 'International Courier'
  | 'Cleared Customs'
  | 'Delivered & Settled';

export interface SourcingOrder {
  id: string;
  shopperId: string;
  shopperName: string;
  clientId: string;
  clientName: string;
  brand: string;
  title: string;
  size: string;
  image: string;
  sourcingCity: string;
  destinationCity: string;
  stage: PipelineStage;
  retailTagPrice: number;
  sourceCurrency: string;
  exchangeRate: number;
  convertedRetail: number;
  customsDuty: number;
  shipping: number;
  commission: number;
  totalLandedQuote: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  awb?: string;
  verifiedSource?: boolean;
  boutiqueReceiptVerified?: boolean;
  createdAt: string;
}

export interface VipClient {
  id: string;
  createdBy: string;
  name: string;
  phone: string;
  city: string;
  shoeSize: string;
  ringSize: string;
  rtwSize: string;
  currency: string;
  totalOrders?: number;
  lifetimeSpend?: string;
  createdAt: string;
}
