export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  services: BookingService[];
  date: string;
  timeSlot: string;
  status: "pending" | "accepted" | "in-progress" | "completed" | "rejected";
  assignedStaff?: string;
  assignedFreelancer?: string;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "cod";
  customerType: "subscription" | "kshuri" | "walkin";
  otp?: string;
  createdAt: string;
}

export interface BookingService {
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  staffId?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  duration: number;
  description: string;
  status: "active" | "pending-review";
  gender: "male" | "female" | "unisex";
  trending?: boolean;
  featured?: boolean;
  bookingCount?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  role: string;
  verified: boolean;
  aadhaarVerified: boolean;
  govtIds: { type: string; number: string }[];
  serviceHistory: number;
  salonsWorkedIn: string[];
  joinedAt: string;
}

export interface Freelancer {
  id: string;
  name: string;
  phone: string;
  photo: string;
  categories: string[];
  subcategories: string[];
  distance: number;
  rating: number;
  isOnline: boolean;
  commissionRate: number;
  totalEarnings: number;
}

export interface SalonProfile {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  bannerImage: string;
  logo: string;
  gallery: string[];
  gstNumber?: string;
  tradeLicense?: string;
  rating: number;
  reviewCount: number;
  isKshuriAssured: boolean;
  description?: string;
  tagline?: string;
  categories?: string[];
  websiteUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  totalBookings?: number;
  isOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  priceMin?: number;
  priceMax?: number;
  businessType?: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  services: string[];
  helpfulCount?: number;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
}

export interface Settlement {
  id: string;
  amount: number;
  date: string;
  status: "pending" | "processing" | "completed";
  reference: string;
}
