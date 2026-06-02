/**
 * @typedef {Object} SeoMeta
 * @property {string} title
 * @property {string} description
 * @property {string=} image
 * @property {string=} url
 */

/**
 * @typedef {Object} CtaLink
 * @property {string} label
 * @property {string} href
 */

/**
 * @typedef {Object} HeroSlide
 * @property {string} title
 * @property {string} description
 * @property {string} image
 * @property {string} alt
 */

/**
 * @typedef {Object} StatItem
 * @property {string} label
 * @property {number} value
 * @property {string} suffix
 * @property {string} description
 */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} shortDescription
 * @property {string[]} longDescription
 * @property {string} icon
 * @property {string} image
 * @property {string} imageAlt
 * @property {string[]} featureBullets
 * @property {{question: string, answer: string}[]} faq
 * @property {SeoMeta=} seo
 */

/**
 * @typedef {Object} Doctor
 * @property {string} name
 * @property {string} qualifications
 * @property {string} specialty
 * @property {string} photo
 * @property {string} photoAlt
 * @property {string} bio
 * @property {string[]} branches
 */

/**
 * @typedef {Object} Branch
 * @property {string} name
 * @property {string} slug
 * @property {boolean} isHeadquarters
 * @property {string} address
 * @property {string} email
 * @property {{label: string, numbers: string[]}[]} phoneGroups
 * @property {string} whatsappNumber
 * @property {{lat: number, lng: number}} coords
 * @property {string} mapEmbed
 * @property {string} hoursLabel
 */

/**
 * @typedef {Object} Testimonial
 * @property {string} quote
 * @property {string} name
 * @property {string} location
 * @property {number} rating
 */

/**
 * @typedef {Object} GalleryItem
 * @property {string} id
 * @property {string} category
 * @property {string} title
 * @property {string} caption
 * @property {string} image
 * @property {string} alt
 */

export {};
