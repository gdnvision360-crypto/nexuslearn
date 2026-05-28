import { PrismaClient } from "@prisma/client";

export const DEFAULT_PLANS = [
  {
    name: "Free",
    slug: "free",
    description: "Get started with essential features",
    monthlyPrice: 0,
    yearlyPrice: 0,
    isDefault: true,
    sortOrder: 1,
    features: {
      cloud_recording: false,
      webinars: false,
      live_streaming: false,
      ai_minutes: false,
      pdf_export_minutes: false,
      admin_dashboard: false,
      custom_branding: false,
      white_label: false,
      sso_saml: false,
      api_access: false,
      priority_support: false,
      dedicated_support: false,
      advanced_analytics: false,
      custom_reports: false,
      approval_workflow: false,
      scorm: false,
    },
    limits: {
      max_users: 5,
      max_participants: 10,
      max_meeting_duration_min: 40,
      storage_gb: 1,
      recording_storage_gb: 0,
      max_courses: 3,
      max_social_accounts: 1,
      max_social_posts_monthly: 10,
      max_webinar_attendees: 0,
    },
  },
  {
    name: "Pro",
    slug: "pro",
    description: "For teams that need more power",
    monthlyPrice: 15,
    yearlyPrice: 144,
    isDefault: false,
    sortOrder: 2,
    features: {
      cloud_recording: true,
      webinars: true,
      live_streaming: true,
      ai_minutes: true,
      pdf_export_minutes: true,
      admin_dashboard: true,
      custom_branding: true,
      white_label: false,
      sso_saml: false,
      api_access: false,
      priority_support: true,
      dedicated_support: false,
      advanced_analytics: true,
      custom_reports: false,
      approval_workflow: false,
      scorm: false,
    },
    limits: {
      max_users: 100,
      max_participants: 100,
      max_meeting_duration_min: 1440,
      storage_gb: 100,
      recording_storage_gb: 50,
      max_courses: -1,
      max_social_accounts: 5,
      max_social_posts_monthly: -1,
      max_webinar_attendees: 500,
    },
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "For organizations that need everything",
    monthlyPrice: 0,
    yearlyPrice: 0,
    isDefault: false,
    sortOrder: 3,
    features: {
      cloud_recording: true,
      webinars: true,
      live_streaming: true,
      ai_minutes: true,
      pdf_export_minutes: true,
      admin_dashboard: true,
      custom_branding: true,
      white_label: true,
      sso_saml: true,
      api_access: true,
      priority_support: true,
      dedicated_support: true,
      advanced_analytics: true,
      custom_reports: true,
      approval_workflow: true,
      scorm: true,
    },
    limits: {
      max_users: -1,
      max_participants: -1,
      max_meeting_duration_min: -1,
      storage_gb: -1,
      recording_storage_gb: -1,
      max_courses: -1,
      max_social_accounts: -1,
      max_social_posts_monthly: -1,
      max_webinar_attendees: 10000,
    },
  },
];

export async function seedPlans(prisma: PrismaClient) {
  console.log("[SEED] Seeding plans...");

  for (const planData of DEFAULT_PLANS) {
    const { features, limits, ...planFields } = planData;

    const plan = await prisma.plan.upsert({
      where: { slug: planFields.slug },
      update: {
        name: planFields.name,
        description: planFields.description,
        monthlyPrice: planFields.monthlyPrice,
        yearlyPrice: planFields.yearlyPrice,
        isDefault: planFields.isDefault,
        sortOrder: planFields.sortOrder,
      },
      create: planFields,
    });

    // Upsert features
    for (const [featureKey, enabled] of Object.entries(features)) {
      await prisma.planFeature.upsert({
        where: {
          planId_feature: { planId: plan.id, feature: featureKey },
        },
        update: { enabled },
        create: {
          planId: plan.id,
          feature: featureKey,
          enabled,
        },
      });
    }

    // Upsert limits
    for (const [limitKey, value] of Object.entries(limits)) {
      await prisma.planLimit.upsert({
        where: {
          planId_limitKey: { planId: plan.id, limitKey },
        },
        update: { value },
        create: {
          planId: plan.id,
          limitKey,
          value,
        },
      });
    }

    console.log(`  [OK] ${plan.name} plan seeded`);
  }

  console.log("[OK] Plans seeded successfully!");
}
