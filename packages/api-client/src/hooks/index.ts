// ─────────────────────────────────────────────────────────────────────────────
// Hooks Barrel Export — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Usage: import { useProfile, useServices, useAppointments } from '@kshuri/api-client/hooks';
// ─────────────────────────────────────────────────────────────────────────────

// Auth
export {
  authKeys,
  useProfile,
  useLogin,
  useRegister,
  useRequestOtp,
  useVerifyOtp,
  useUpdateProfile,
  useLogout,
  useGoogleOAuth,
  useVerifyFirebaseToken,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
} from './useAuth';

// Cross-cutting session helpers (canonical names, thin aliases over useProfile)
export {
  useCurrentUser,
  useCurrentTenantId,
  useCurrentRole,
  useIsAuthenticated,
} from './useCurrentUser';

// Catalog
export {
  catalogKeys,
  useServices,
  useCategories,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useSetStaffOverride,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useVendorCategories,
  useVendorCategoryTree,
  useCreateVendorCategory,
  // R1 public reads
  usePublicService,
  usePublicProduct,
} from './useCatalog';

// Admin Categories (super_admin taxonomy governance — new module).
// `useAdminCategories` (the legacy single-list stub) is still exported from
// `./useAdmin` for the existing admin dashboard. The new comprehensive list
// hook is exposed here as `useAdminCategoryList` to avoid the name collision.
// Phase 4 migrates the dashboard to the new module and the legacy can drop.
export {
  adminCategoriesKeys,
  useAdminCategories as useAdminCategoryList,
  useAdminCategoryTree,
  useAdminCategory,
  useCreateAdminCategory,
  useUpdateAdminCategory,
  useDeleteAdminCategory,
  usePromoteAdminCategory,
  useReorderAdminCategories,
} from './useAdminCategories';

// Booking
export {
  bookingKeys,
  useAppointments,
  useAppointment,
  useCreateIntent,
  useLockIntent,
  useConfirmBooking,
  useBookingIntent,
  useReleaseIntent,
  useAppointmentAction,
  useRescheduleAppointment,
  useCreateWalkIn,
} from './useBooking';

// Discovery
export {
  discoveryKeys,
  useVendorSearch,
  useVendorDetail,
  useVendorReviews,
  useServiceCategories,
  useCategoryBySlug,
  useTrackVendorView,
  useFeaturedVendors,
  useTrendingVendors,
  useVendorBySlug,
  // v2 (R1)
  useVendorSearchV2,
  useVendorProfile,
  useAutocomplete,
  useCityLanding,
  useNearYou,
} from './useDiscovery';

// Business
export {
  businessKeys,
  useBusinessProfile,
  useBusinessLocations,
  useLocation,
  useStaffList,
  useStaffMember,
  useStaffSchedule,
  useStaffAttendance,
  useStaffAppointments,
  useStaffSalary,
  useSubscription,
  useEngagementMetrics,
  useUpdateBusinessProfile,
  useInviteStaff,
  useUpdateStaff,
  useUpdateBillingMethod,
} from './useBusiness';

// Finance
export {
  financeKeys,
  useTransactions,
  useTransaction,
  useBill,
  usePendingPayouts,
  useSettlements,
  useBankAccount,
  useRevenueSummary,
  useGenerateBill,
  useProcessPayouts,
  useUpdateBankAccount,
  useGenerateUpiQr,
  useVendorDues,
  useRecordSettlement,
} from './useFinance';

// Plans & subscriptions
export {
  planKeys,
  usePlans,
  useMyPlan,
  useSubscribeToPlan,
} from './usePlans';

// Availability
export {
  availabilityKeys,
  useAvailableSlots,
  useWorkingHours,
  useCalendar,
  useUpdateWorkingHours,
  useCreateTimeBlock,
  useDeleteTimeBlock,
  useBatchAssignShifts,
  useUpdateShift,
} from './useAvailability';

// Engagement
export {
  engagementKeys,
  useFavorites,
  useNotifications,
  useOwnVendorReviews,
  useSubmitReview,
  useAddFavorite,
  useRemoveFavorite,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useSkillEndorsementStatus,
  useEndorseSkill,
  useUnendorseSkill,
  // R1 polymorphic reviews
  r1EngagementKeys,
  useReviewList,
  useReviewAggregates,
  useCreateReview,
  useToggleReviewHelpful,
  useReportReview,
} from './useEngagement';

// Media
export {
  mediaKeys,
  usePortfolio,
  useUploadMedia,
  useUpdateMedia,
  useDeleteMedia,
} from './useMedia';

// Analytics
export {
  analyticsKeys,
  useDashboardKPIs,
  useRevenueSeries,
  useBookingTrends,
  useStaffPerformance,
  useCustomerInsights,
  useTopServices,
} from './useAnalytics';

// Staff
export {
  staffKeys,
  // Profile
  useStaffProfile,
  useUpdateStaffProfile,
  // Documents
  useStaffDocuments,
  useUploadStaffDocument,
  // Bank Details
  useStaffBankDetails,
  useUpdateStaffBankDetails,
  // Clock-in / out
  useClockStatus,
  useClockIn,
  useClockOut,
  // Attendance & Schedule
  useAttendanceHistory,
  useMySchedule,
  // Earnings & Targets
  useStaffEarnings,
  useStaffTargets,
  useCommissionHistory,
  useWeeklyChart,
  // Reviews
  useStaffReviews,
  useStaffReviewSummary,
} from './useStaff';

// CMS
export {
  cmsKeys,
  useCmsPosts,
  useCmsPost,
  useContactLeads,
  useCreatePost,
  useUpdatePost,
  useSubmitContactLead,
  useCmsPages,
  useCreateCmsPage,
  useCallouts,
  useCreateCallout,
  useUpdateCallout,
  useDeleteCallout,
  useTestimonials,
} from './useCms';

// Admin
export {
  adminKeys,
  usePlatformKPIs,
  useKycApplications,
  usePlatformUsers,
  useAdminCategories,
  useApproveKyc,
  useRejectKyc,
  useToggleUserStatus,
  useCreateCategory,
  usePlatformSettings,
  useSubscriptionPlans,
} from './useAdmin';

// Events
export {
  eventsKeys,
  useEventList,
  useEvent,
  useEventAttendees,
  useEventBudget,
  useEventTemplates,
  useCreateEvent,
  useAssignVendors,
  useUpdateEventStatus,
} from './useEvents';

// Event Manager
export {
  eventManagerKeys,
  useManagedEventList,
  useManagedEvent,
  useCreateManagedEvent,
  useUpdateManagedEvent,
  useDeleteManagedEvent,
  useMarketplaceVendors,
  useEventVendors,
  useCreateEventVendor,
  useUpdateEventVendor,
  useDeleteEventVendor,
  useEventGuests,
  useCreateEventGuest,
  useUpdateEventGuest,
  useDeleteEventGuest,
  useBudgetItems,
  useCreateBudgetItem,
  useUpdateBudgetItem,
  useDeleteBudgetItem,
  useEventTasks,
  useCreateEventTask,
  useUpdateEventTask,
  useDeleteEventTask,
  useEventPayments,
  useCreateEventPayment,
  useUpdateEventPayment,
  useDeleteEventPayment,
  useEventTransactions,
  useCreateEventTransaction,
  useEventManagerPortfolio,
  useUpsertEventManagerPortfolio,
  useEventManagerTemplates,
  useCreateEventManagerTemplate,
  useUpdateEventManagerTemplate,
  useDeleteEventManagerTemplate,
  useEventCommunications,
  usePostEventCommunication,
  useEventManagerAnalytics,
} from './useEventManager';

// Freelancer
export {
  freelancerKeys,
  useFreelancerProfile,
  useUpdateFreelancerProfile,
  useSetFreelancerPresence,
  useFreelancerExperience,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
  useFreelancerSkills,
  useAddSkill,
  useDeleteSkill,
  useFreelancerCertifications,
  useAddCertification,
  useDeleteCertification,
  useFreelancerLanguages,
  useAddLanguage,
  useDeleteLanguage,
  useFreelancerSalonHistory,
  useAddSalonAssociation,
  useUpdateSalonAssociation,
  useDeleteSalonAssociation,
  useFreelancerPerformance,
  useFreelancerPreferences,
  useUpdatePreferences,
} from './useFreelancer';

// Assignments (salon→freelancer gigs)
export {
  assignmentsKeys,
  useAssignments,
  useAssignment,
  useCreateAssignment,
  useAssignmentAction,
} from './useAssignments';

// Addresses
export {
  addressKeys,
  useAddresses,
  useAddress,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useForwardGeocode,
  useReverseGeocode,
} from './useAddresses';

// Notifications
export {
  notificationKeys,
  useNotificationList,
  useUnreadCount,
  useNotificationPreferences,
  useMarkRead,
  useUpdateNotificationPreferences,
} from './useNotifications';

// KYC
export {
  kycKeys,
  useKycStatus,
  usePendingKyc,
  useSubmitKyc,
  useDecideKyc,
} from './useKyc';

// Entitlements
export {
  entitlementKeys,
  useFeatures,
  useFeature,
  usePlanEntitlements,
  useFeatureOverrides,
  useCreateFeature,
  useUpdateFeature,
  useSetPlanEntitlement,
  useDeletePlanEntitlement,
  useCreateOverride,
  useDeleteOverride,
} from './useEntitlements';

// Messaging
export {
  messagingKeys,
  useThreads,
  useThread,
  useUnreadMessagesCount,
  useOpenThread,
  useSendMessage,
  useMarkThreadRead,
  useThreadLongPoll,
} from './useMessaging';

// Meta (enum catalogue)
export {
  metaKeys,
  useEnums,
  useEnum,
} from './useMeta';

// Public stats (homepage hero)
export {
  publicStatsKeys,
  usePublicStats,
} from './usePublicStats';

// Customer-finance (customer-side /me/transactions + /me/refunds)
export {
  customerFinanceKeys,
  useCustomerTransactions,
  useCustomerTransaction,
  useCustomerRefunds,
} from './useCustomerFinance';
