import { z } from "zod";

const seoSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    image: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const themeSchema = z
  .object({
    colors: z.record(z.string(), z.string()),
    fonts: z.record(z.string(), z.string()),
    radius: z.record(z.string(), z.string()),
    shadows: z.record(z.string(), z.string()),
  })
  .passthrough();

export const siteSchema = z
  .object({
    brand: z.object({
      name: z.string().min(1),
      tagline: z.string().min(1),
      establishedDate: z.string().min(1),
      logo: z.string().min(1),
      logoAlt: z.string().min(1),
    }),
    defaultSeo: seoSchema,
    pageSeo: z.record(z.string(), seoSchema),
    businessHours: z.array(z.object({ label: z.string(), value: z.string() })),
    globalCtas: z.object({
      primary: ctaSchema,
      secondary: ctaSchema,
    }),
    socialLinks: z.array(ctaSchema),
    footer: z.object({
      summary: z.string(),
      copyright: z.string(),
      sourceNote: z.string(),
    }),
  })
  .passthrough();

export const navigationSchema = z.object({
  header: z.array(ctaSchema),
  footer: z.array(
    z.object({
      title: z.string().min(1),
      items: z.array(ctaSchema),
    }),
  ),
});

export const homeSchema = z
  .object({
    seo: seoSchema,
    hero: z.object({
      eyebrow: z.string(),
      title: z.string(),
      subtitle: z.string(),
      slides: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          image: z.string(),
          alt: z.string(),
        }),
      ),
      ctas: z.array(ctaSchema),
    }),
    stats: z.array(
      z.object({
        label: z.string(),
        value: z.number(),
        suffix: z.string(),
        description: z.string(),
      }),
    ),
    featuredServiceIds: z.array(z.string()),
    timeline: z.object({
      eyebrow: z.string(),
      title: z.string(),
      items: z.array(
        z.object({
          year: z.string(),
          title: z.string(),
          description: z.string(),
        }),
      ),
    }),
    missionVision: z.object({
      eyebrow: z.string(),
      title: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          icon: z.string(),
          description: z.string(),
        }),
      ),
    }),
    cta: z.object({
      title: z.string(),
      description: z.string(),
      primary: ctaSchema,
      secondary: ctaSchema,
    }),
  })
  .passthrough();

export const servicesSchema = z
  .object({
    seo: seoSchema,
    items: z.array(
      z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        shortDescription: z.string(),
        longDescription: z.array(z.string()),
        icon: z.string(),
        image: z.string(),
        imageAlt: z.string(),
        featureBullets: z.array(z.string()),
        faq: z.array(faqItemSchema),
        seo: seoSchema.optional(),
      }),
    ),
  })
  .passthrough();

export const doctorsSchema = z
  .object({
    seo: seoSchema,
    items: z.array(
      z.object({
        name: z.string(),
        qualifications: z.string(),
        specialty: z.string(),
        photo: z.string(),
        photoAlt: z.string(),
        bio: z.string(),
        branches: z.array(z.string()),
      }),
    ),
  })
  .passthrough();

export const branchesSchema = z
  .object({
    seo: seoSchema,
    items: z.array(
      z.object({
        name: z.string(),
        slug: z.string(),
        isHeadquarters: z.boolean(),
        address: z.string(),
        email: z.string().email(),
        phoneGroups: z.array(
          z.object({
            label: z.string(),
            numbers: z.array(z.string()),
          }),
        ),
        whatsappNumber: z.string(),
        coords: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        mapEmbed: z.string(),
        hoursLabel: z.string(),
      }),
    ),
  })
  .passthrough();

export const testimonialsSchema = z
  .object({
    seo: seoSchema,
    items: z.array(
      z.object({
        quote: z.string(),
        name: z.string(),
        location: z.string(),
        rating: z.number().min(1).max(5),
      }),
    ),
  })
  .passthrough();

export const gallerySchema = z.object({
  seo: seoSchema,
  categories: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  items: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      title: z.string(),
      caption: z.string(),
      image: z.string(),
      alt: z.string(),
    }),
  ),
});

export const appointmentSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  phone: z
    .string()
    .min(7, "Please enter a phone number.")
    .regex(/^[0-9+\-()\s]+$/, "Use a valid phone number."),
  email: z
    .string()
    .email("Use a valid email address.")
    .or(z.literal(""))
    .optional(),
  branch: z.string().min(1, "Choose a branch."),
  service: z.string().min(1, "Choose a service or department."),
  preferredDate: z.string().min(1, "Choose a preferred date."),
  message: z.string().max(1000, "Keep the message under 1000 characters.").optional(),
  botcheck: z.string().optional(),
});
