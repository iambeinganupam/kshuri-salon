import type { Freelancer, Booking } from "./types";

// Extended freelancer profile data
export interface FreelancerProfile extends Freelancer {
  email: string;
  verified: boolean;
  aadhaarVerified: boolean;
  joinedAt: string;
  bio: string;
  serviceHistory: number;
  city: string;
  availability: "available" | "busy" | "offline";
}

export const freelancerProfiles: Record<string, FreelancerProfile> = {
  f1: {
    id: "f1", name: "Anjali Verma", phone: "+91 87654 11111", email: "anjali@kshuri.com",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    categories: ["Hair"], subcategories: ["Styling", "Color"], distance: 2.3, rating: 4.8,
    isOnline: true, commissionRate: 30, totalEarnings: 45000, verified: true, aadhaarVerified: true,
    joinedAt: "2025-03-15", bio: "Expert hair stylist with 6+ years experience in bridal and fashion styling.",
    serviceHistory: 285, city: "Bangalore", availability: "available",
  },
  f2: {
    id: "f2", name: "Pooja Singh", phone: "+91 87654 22222", email: "pooja@kshuri.com",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop",
    categories: ["Mehendi"], subcategories: ["Bridal", "Arabic"], distance: 1.8, rating: 4.9,
    isOnline: true, commissionRate: 30, totalEarnings: 62000, verified: true, aadhaarVerified: true,
    joinedAt: "2024-11-01", bio: "Award-winning mehendi artist specializing in bridal and Arabic designs.",
    serviceHistory: 410, city: "Bangalore", availability: "busy",
  },
  f3: {
    id: "f3", name: "Deepak Rao", phone: "+91 87654 33333", email: "deepak@kshuri.com",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    categories: ["Grooming"], subcategories: ["Beard", "Hair Cut"], distance: 4.5, rating: 4.5,
    isOnline: false, commissionRate: 40, totalEarnings: 28000, verified: false, aadhaarVerified: false,
    joinedAt: "2025-09-20", bio: "Skilled barber with expertise in modern and classic cuts.",
    serviceHistory: 92, city: "Bangalore", availability: "offline",
  },
};

// Performance data
export const freelancerPerformance: Record<string, {
  rating: number; completionRate: number; avgTime: number; repeatCustomers: number;
  monthlyEarnings: number[]; monthlyServices: number[]; monthlyRatings: number[];
  cancelRate: number; responseTime: number;
}> = {
  f1: { rating: 4.8, completionRate: 96, avgTime: 55, repeatCustomers: 62, monthlyEarnings: [10000, 12000, 13500, 15000], monthlyServices: [22, 25, 28, 32], monthlyRatings: [4.6, 4.7, 4.7, 4.8], cancelRate: 3, responseTime: 4 },
  f2: { rating: 4.9, completionRate: 98, avgTime: 80, repeatCustomers: 75, monthlyEarnings: [14000, 15500, 16000, 18000], monthlyServices: [18, 20, 22, 25], monthlyRatings: [4.8, 4.8, 4.9, 4.9], cancelRate: 1, responseTime: 2 },
  f3: { rating: 4.5, completionRate: 89, avgTime: 30, repeatCustomers: 40, monthlyEarnings: [5000, 6500, 7500, 9000], monthlyServices: [15, 18, 22, 25], monthlyRatings: [4.3, 4.4, 4.4, 4.5], cancelRate: 8, responseTime: 12 },
};

// Earnings / commission history
export const freelancerCommissions: Record<string, { month: string; services: number; revenue: number; commission: number; platformFee: number; payout: number }[]> = {
  f1: [
    { month: "Mar 2026", services: 32, revenue: 96000, commission: 28800, platformFee: 9600, payout: 15000 },
    { month: "Feb 2026", services: 28, revenue: 84000, commission: 25200, platformFee: 8400, payout: 13500 },
    { month: "Jan 2026", services: 25, revenue: 75000, commission: 22500, platformFee: 7500, payout: 12000 },
  ],
  f2: [
    { month: "Mar 2026", services: 25, revenue: 125000, commission: 37500, platformFee: 12500, payout: 18000 },
    { month: "Feb 2026", services: 22, revenue: 110000, commission: 33000, platformFee: 11000, payout: 16000 },
    { month: "Jan 2026", services: 20, revenue: 100000, commission: 30000, platformFee: 10000, payout: 15500 },
  ],
  f3: [
    { month: "Mar 2026", services: 25, revenue: 37500, commission: 15000, platformFee: 3750, payout: 9000 },
    { month: "Feb 2026", services: 22, revenue: 33000, commission: 13200, platformFee: 3300, payout: 7500 },
  ],
};

// Documents
export const freelancerDocuments: Record<string, { name: string; type: string; status: "verified" | "pending" | "expired"; uploadedDate: string }[]> = {
  f1: [
    { name: "Aadhaar Card", type: "Identity", status: "verified", uploadedDate: "2025-03-15" },
    { name: "PAN Card", type: "Tax", status: "verified", uploadedDate: "2025-03-15" },
    { name: "Hair Styling Certificate", type: "Certification", status: "verified", uploadedDate: "2025-04-01" },
    { name: "Police Verification", type: "Background", status: "verified", uploadedDate: "2025-04-10" },
  ],
  f2: [
    { name: "Aadhaar Card", type: "Identity", status: "verified", uploadedDate: "2024-11-01" },
    { name: "Mehendi Art Certificate", type: "Certification", status: "verified", uploadedDate: "2024-11-15" },
    { name: "PAN Card", type: "Tax", status: "verified", uploadedDate: "2024-11-01" },
  ],
  f3: [
    { name: "Aadhaar Card", type: "Identity", status: "pending", uploadedDate: "2025-09-20" },
  ],
};

// Feedback/Reviews
export const freelancerFeedback: Record<string, { customerName: string; rating: number; comment: string; date: string; service: string; salonName: string }[]> = {
  f1: [
    { customerName: "Priya Sharma", rating: 5, comment: "Anjali did an incredible job with my hair color. Exactly what I wanted!", date: "2026-03-06", service: "Hair Color", salonName: "Estylr Royal Salon" },
    { customerName: "Deepa Menon", rating: 5, comment: "Best bridal styling I've ever had. Anjali is very professional.", date: "2026-03-04", service: "Bridal Hair Styling", salonName: "Glamour Studio" },
    { customerName: "Sneha Gupta", rating: 4, comment: "Good work on the hair spa. Very thorough and gentle.", date: "2026-02-28", service: "Hair Spa", salonName: "Estylr Royal Salon" },
    { customerName: "Anita Reddy", rating: 5, comment: "Anjali always knows exactly what style suits me. Love her work!", date: "2026-02-20", service: "Hair Styling", salonName: "Beauty Bliss" },
  ],
  f2: [
    { customerName: "Kavitha Nair", rating: 5, comment: "Pooja's bridal mehendi was absolutely stunning! Everyone at the wedding loved it.", date: "2026-03-05", service: "Bridal Mehendi", salonName: "Estylr Royal Salon" },
    { customerName: "Priya Sharma", rating: 5, comment: "The Arabic mehendi design was so intricate and beautiful.", date: "2026-03-01", service: "Arabic Mehendi", salonName: "Glamour Studio" },
    { customerName: "Deepa Menon", rating: 4, comment: "Beautiful design but took a bit longer than estimated.", date: "2026-02-18", service: "Mehendi", salonName: "Estylr Royal Salon" },
  ],
  f3: [
    { customerName: "Anonymous", rating: 4, comment: "Quick and clean haircut. Good value for money.", date: "2026-03-03", service: "Men's Haircut", salonName: "Quick Cuts" },
    { customerName: "Anonymous", rating: 4, comment: "Decent beard trim. Slightly rushed but overall fine.", date: "2026-02-20", service: "Beard Trim", salonName: "Estylr Royal Salon" },
  ],
};

// Schedule / Availability
export const freelancerSchedule: Record<string, { day: string; available: boolean; start: string; end: string; bookedSlots: number }[]> = {
  f1: [
    { day: "Mon", available: true, start: "09:00", end: "18:00", bookedSlots: 4 },
    { day: "Tue", available: true, start: "09:00", end: "18:00", bookedSlots: 3 },
    { day: "Wed", available: true, start: "10:00", end: "17:00", bookedSlots: 5 },
    { day: "Thu", available: true, start: "09:00", end: "18:00", bookedSlots: 2 },
    { day: "Fri", available: true, start: "09:00", end: "18:00", bookedSlots: 6 },
    { day: "Sat", available: true, start: "10:00", end: "16:00", bookedSlots: 4 },
    { day: "Sun", available: false, start: "", end: "", bookedSlots: 0 },
  ],
  f2: [
    { day: "Mon", available: true, start: "10:00", end: "19:00", bookedSlots: 3 },
    { day: "Tue", available: true, start: "10:00", end: "19:00", bookedSlots: 4 },
    { day: "Wed", available: false, start: "", end: "", bookedSlots: 0 },
    { day: "Thu", available: true, start: "10:00", end: "19:00", bookedSlots: 5 },
    { day: "Fri", available: true, start: "10:00", end: "19:00", bookedSlots: 3 },
    { day: "Sat", available: true, start: "09:00", end: "17:00", bookedSlots: 6 },
    { day: "Sun", available: false, start: "", end: "", bookedSlots: 0 },
  ],
  f3: [
    { day: "Mon", available: true, start: "09:00", end: "17:00", bookedSlots: 5 },
    { day: "Tue", available: true, start: "09:00", end: "17:00", bookedSlots: 4 },
    { day: "Wed", available: true, start: "09:00", end: "17:00", bookedSlots: 6 },
    { day: "Thu", available: true, start: "09:00", end: "17:00", bookedSlots: 3 },
    { day: "Fri", available: true, start: "09:00", end: "17:00", bookedSlots: 5 },
    { day: "Sat", available: false, start: "", end: "", bookedSlots: 0 },
    { day: "Sun", available: false, start: "", end: "", bookedSlots: 0 },
  ],
};

// Salon assignment history
export const freelancerSalonHistory: Record<string, { salonName: string; assignmentsCompleted: number; totalRevenue: number; lastAssignment: string; rating: number }[]> = {
  f1: [
    { salonName: "Estylr Royal Salon & Spa", assignmentsCompleted: 142, totalRevenue: 426000, lastAssignment: "2026-03-08", rating: 4.8 },
    { salonName: "Glamour Studio", assignmentsCompleted: 89, totalRevenue: 267000, lastAssignment: "2026-03-05", rating: 4.7 },
    { salonName: "Beauty Bliss", assignmentsCompleted: 54, totalRevenue: 162000, lastAssignment: "2026-02-28", rating: 4.9 },
  ],
  f2: [
    { salonName: "Estylr Royal Salon & Spa", assignmentsCompleted: 210, totalRevenue: 1050000, lastAssignment: "2026-03-07", rating: 4.9 },
    { salonName: "Glamour Studio", assignmentsCompleted: 120, totalRevenue: 600000, lastAssignment: "2026-03-04", rating: 5.0 },
    { salonName: "Beauty Plus", assignmentsCompleted: 80, totalRevenue: 400000, lastAssignment: "2026-02-20", rating: 4.8 },
  ],
  f3: [
    { salonName: "Estylr Royal Salon & Spa", assignmentsCompleted: 52, totalRevenue: 78000, lastAssignment: "2026-03-03", rating: 4.5 },
    { salonName: "Quick Cuts", assignmentsCompleted: 40, totalRevenue: 60000, lastAssignment: "2026-02-25", rating: 4.4 },
  ],
};

// Bookings assigned to freelancers
export const freelancerBookings: Record<string, { id: string; customerName: string; service: string; date: string; timeSlot: string; status: "pending" | "accepted" | "in-progress" | "completed"; amount: number; salonName: string; paymentStatus: "pending" | "paid" }[]> = {
  f1: [
    { id: "FB-001", customerName: "Priya Sharma", service: "Hair Color - Global", date: "2026-03-08", timeSlot: "10:00 AM", status: "in-progress", amount: 3000, salonName: "Estylr Royal Salon", paymentStatus: "pending" },
    { id: "FB-002", customerName: "Sneha Gupta", service: "Hair Spa", date: "2026-03-08", timeSlot: "02:00 PM", status: "accepted", amount: 1200, salonName: "Glamour Studio", paymentStatus: "pending" },
    { id: "FB-003", customerName: "Deepa Menon", service: "Hair Straightening", date: "2026-03-07", timeSlot: "11:00 AM", status: "completed", amount: 2500, salonName: "Estylr Royal Salon", paymentStatus: "paid" },
    { id: "FB-004", customerName: "Anita Reddy", service: "Bridal Hair Styling", date: "2026-03-06", timeSlot: "09:00 AM", status: "completed", amount: 5000, salonName: "Beauty Bliss", paymentStatus: "paid" },
  ],
  f2: [
    { id: "FB-005", customerName: "Kavitha Nair", service: "Bridal Mehendi", date: "2026-03-08", timeSlot: "09:00 AM", status: "in-progress", amount: 5000, salonName: "Estylr Royal Salon", paymentStatus: "pending" },
    { id: "FB-006", customerName: "Deepa Menon", service: "Arabic Mehendi", date: "2026-03-09", timeSlot: "10:00 AM", status: "pending", amount: 2500, salonName: "Glamour Studio", paymentStatus: "pending" },
    { id: "FB-007", customerName: "Priya Sharma", service: "Mehendi - Full Hands", date: "2026-03-05", timeSlot: "11:00 AM", status: "completed", amount: 3500, salonName: "Estylr Royal Salon", paymentStatus: "paid" },
  ],
  f3: [
    { id: "FB-008", customerName: "Anonymous", service: "Men's Haircut", date: "2026-03-07", timeSlot: "03:00 PM", status: "completed", amount: 400, salonName: "Quick Cuts", paymentStatus: "paid" },
    { id: "FB-009", customerName: "Anonymous", service: "Beard Trim", date: "2026-03-06", timeSlot: "04:00 PM", status: "completed", amount: 200, salonName: "Estylr Royal Salon", paymentStatus: "paid" },
  ],
};

// Notifications
export const freelancerNotifications: Record<string, { id: string; message: string; type: "booking" | "payment" | "alert" | "announcement"; sentAt: string; read: boolean }[]> = {
  f1: [
    { id: "fn1", message: "New booking request: Priya Sharma — Hair Color at Estylr Royal Salon", type: "booking", sentAt: "2026-03-08T08:30:00Z", read: true },
    { id: "fn2", message: "Payment of ₹13,500 credited to your account for February", type: "payment", sentAt: "2026-03-01T10:00:00Z", read: true },
    { id: "fn3", message: "Your profile verification is complete! You're now Estylr Verified.", type: "alert", sentAt: "2026-02-28T12:00:00Z", read: true },
    { id: "fn4", message: "New salon partner: Beauty Bliss is now accepting freelancer requests", type: "announcement", sentAt: "2026-02-25T09:00:00Z", read: false },
  ],
  f2: [
    { id: "fn5", message: "Upcoming booking: Kavitha Nair — Bridal Mehendi tomorrow at 9 AM", type: "booking", sentAt: "2026-03-07T18:00:00Z", read: true },
    { id: "fn6", message: "You received a 5-star review from Kavitha Nair!", type: "alert", sentAt: "2026-03-06T14:00:00Z", read: true },
    { id: "fn7", message: "Payment of ₹16,000 credited for February services", type: "payment", sentAt: "2026-03-01T10:00:00Z", read: false },
  ],
  f3: [
    { id: "fn8", message: "Please complete your profile verification — upload Aadhaar card", type: "alert", sentAt: "2026-03-07T09:00:00Z", read: false },
    { id: "fn9", message: "Your commission rate has been updated to 40%", type: "alert", sentAt: "2026-03-05T11:00:00Z", read: false },
  ],
};
