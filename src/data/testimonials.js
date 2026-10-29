/**
 * Single source of truth for Student & Parent Testimonials
 * Shape: { id, quote, name, meta, role: "student" | "parent", rating }
 * Synced with data/testimonials.json
 */
export const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "Ronak Sir breaks down complex partnership problems so easily that you never need to memorise anything. The weekly tests gave me the exact confidence I needed in the CBSE board examination.",
    name: "Dikshita Malhotra",
    meta: "DPS Faridabad · CBSE 2025",
    role: "student",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "Vardaan secured 98 in Accountancy. The individual checking at RD Classes is unmatched. The notes and practice questions are extremely helpful and easy to follow.",
    name: "Vardaan Agarwal",
    meta: "MVN Faridabad · CBSE 2025",
    role: "student",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "We are truly thankful to Ronak Sir for his continuous guidance, personal attention, and rigorous test checking. Vardaan secured 98 in Accountancy. The individual checking at RD Classes is unmatched.",
    name: "Mr. Agarwal (Father)",
    meta: "MVN Faridabad · CBSE 2025",
    role: "parent",
    rating: 5,
  },
  {
    id: 4,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Student Name",
    meta: "School · CBSE Year",
    role: "student",
    rating: 5,
  },
  {
    id: 5,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Student Name",
    meta: "School · CBSE Year",
    role: "student",
    rating: 5,
  },
  {
    id: 6,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Parent Name",
    meta: "Parent of Class 12 Student",
    role: "parent",
    rating: 5,
  },
  {
    id: 7,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Student Name",
    meta: "School · CBSE Year",
    role: "student",
    rating: 5,
  },
  {
    id: 8,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Student Name",
    meta: "School · CBSE Year",
    role: "student",
    rating: 5,
  },
  {
    id: 9,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Parent Name",
    meta: "Parent of Class 11 Student",
    role: "parent",
    rating: 5,
  },
  {
    id: 10,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Student Name",
    meta: "School · CBSE Year",
    role: "student",
    rating: 5,
  },
  {
    id: 11,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Student Name",
    meta: "School · CBSE Year",
    role: "student",
    rating: 5,
  },
  {
    id: 12,
    quote: "PASTE REAL GOOGLE REVIEW HERE",
    name: "Parent Name",
    meta: "Parent of Class 12 Student",
    role: "parent",
    rating: 5,
  },
];

/**
 * Filter function to skip entries whose quote is still a placeholder.
 * Allows seamless rendering of any number of reviews from 3 to 15.
 */
export function getActiveTestimonials(items = TESTIMONIALS) {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) =>
      item &&
      item.quote &&
      !item.quote.includes("PASTE REAL GOOGLE REVIEW HERE") &&
      item.quote.trim().length > 0
  );
}

export default TESTIMONIALS;
