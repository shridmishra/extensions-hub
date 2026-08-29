// Comprehensive named colors dictionary and nearest-color matcher

interface NamedColor {
  name: string
  hex: string
  r: number
  g: number
  b: number
}

function hexToRgbValues(hex: string): [number, number, number] {
  let c = hex.replace("#", "")
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("")
  }
  const num = parseInt(c, 16) || 0
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

const COLOR_DATABASE: Array<[string, string]> = [
  ["#000000", "Black"],
  ["#FFFFFF", "Pure White"],
  ["#F8FAFC", "Ghost White"],
  ["#F1F5F9", "Slate White"],
  ["#E2E8F0", "Light Slate"],
  ["#CBD5E1", "Silver Slate"],
  ["#94A3B8", "Slate Gray"],
  ["#64748B", "Slate"],
  ["#475569", "Cool Slate"],
  ["#334155", "Deep Slate"],
  ["#1E293B", "Dark Slate"],
  ["#0F172A", "Midnight Slate"],
  ["#020617", "Abyss Black"],

  ["#FAFAFA", "Snow White"],
  ["#F4F4F5", "Zinc White"],
  ["#E4E4E7", "Platinum"],
  ["#D4D4D8", "Cool Gray"],
  ["#A1A1AA", "Ash Gray"],
  ["#71717A", "Zinc"],
  ["#52525B", "Charcoal"],
  ["#3F3F46", "Steel"],
  ["#27272A", "Dark Zinc"],
  ["#18181B", "Jet Black"],
  ["#09090B", "Onyx Black"],

  ["#FFF1F2", "Rose Petal"],
  ["#FFE4E6", "Rose White"],
  ["#FECDD3", "Blush Pink"],
  ["#FDA4AF", "Soft Rose"],
  ["#FB7185", "Coral Rose"],
  ["#F43F5E", "Rose"],
  ["#E11D48", "Crimson Rose"],
  ["#BE123C", "Deep Rose"],
  ["#9F1239", "Ruby"],
  ["#881337", "Burgundy"],

  ["#FEF2F2", "Warm White"],
  ["#FEE2E2", "Light Coral"],
  ["#FECACA", "Soft Red"],
  ["#FCA5A5", "Salmon Red"],
  ["#F87171", "Coral Red"],
  ["#EF4444", "Red"],
  ["#DC2626", "Crimson"],
  ["#B91C1C", "Scarlet"],
  ["#991B1B", "Dark Red"],
  ["#7F1D1D", "Maroon"],

  ["#FFF7ED", "Pearl Orange"],
  ["#FFEDD5", "Peach"],
  ["#FED7AA", "Apricot"],
  ["#FDBA74", "Soft Orange"],
  ["#FB923C", "Tangerine"],
  ["#F97316", "Orange"],
  ["#EA580C", "Burnt Orange"],
  ["#C2410C", "Rust"],
  ["#9A3412", "Copper"],
  ["#7C2D12", "Mahogany"],

  ["#FFFBEB", "Ivory"],
  ["#FEF3C7", "Cream"],
  ["#FDE68A", "Banana"],
  ["#FCD34D", "Butter Yellow"],
  ["#FBBF24", "Gold"],
  ["#F59E0B", "Amber"],
  ["#D97706", "Ochre"],
  ["#B45309", "Bronze"],
  ["#92400E", "Caramel"],
  ["#78350F", "Dark Bronze"],

  ["#FEFCE8", "Vanilla"],
  ["#FEF9C3", "Chiffon"],
  ["#FEF08A", "Lemon Chiffon"],
  ["#FDE047", "Lemon"],
  ["#FACC15", "Yellow"],
  ["#EAB308", "Bright Gold"],
  ["#CA8A04", "Mustard"],
  ["#A16207", "Olive Gold"],
  ["#854D0E", "Dark Mustard"],
  ["#713F12", "Olive Brown"],

  ["#F7FEE7", "Lime Pearl"],
  ["#ECFCCB", "Pale Lime"],
  ["#D9F99D", "Light Lime"],
  ["#BEF264", "Chartreuse"],
  ["#A3E635", "Bright Lime"],
  ["#84CC16", "Lime"],
  ["#65A30D", "Apple Green"],
  ["#4D7C0F", "Olive Green"],
  ["#3F6212", "Forest Olive"],
  ["#365314", "Dark Olive"],

  ["#F0FDF4", "Mint White"],
  ["#DCFCE7", "Pale Green"],
  ["#BBF7D0", "Light Mint"],
  ["#86EFAC", "Mint Green"],
  ["#4ADE80", "Spring Green"],
  ["#22C55E", "Emerald Green"],
  ["#16A34A", "Forest Green"],
  ["#15803D", "Jungle Green"],
  ["#166534", "Deep Green"],
  ["#14532D", "Pine Green"],

  ["#ECFDF5", "Seafoam White"],
  ["#D1FAE5", "Pale Seafoam"],
  ["#A7F3D0", "Seafoam"],
  ["#6EE7B7", "Light Teal"],
  ["#34D399", "Teal Mint"],
  ["#10B981", "Emerald"],
  ["#059669", "Dark Emerald"],
  ["#047857", "Jade"],
  ["#065F46", "Deep Jade"],
  ["#064E3B", "Dark Jade"],

  ["#F0FDFA", "Aqua White"],
  ["#CCFBF1", "Pale Turquoise"],
  ["#99F6E4", "Turquoise"],
  ["#5EEAD4", "Aquamarine"],
  ["#2DD4BF", "Aqua"],
  ["#14B8A6", "Teal"],
  ["#0D9488", "Dark Teal"],
  ["#0F766E", "Ocean Teal"],
  ["#115E59", "Deep Teal"],
  ["#134E4A", "Dark Cyan"],

  ["#ECFEFF", "Ice White"],
  ["#CFFAFE", "Pale Cyan"],
  ["#A5F3FC", "Baby Cyan"],
  ["#67E8F9", "Sky Cyan"],
  ["#22D3EE", "Electric Cyan"],
  ["#06B6D4", "Cyan"],
  ["#0891B2", "Cerulean"],
  ["#0E7490", "Dark Cerulean"],
  ["#155E75", "Ocean Blue"],
  ["#164E63", "Midnight Cyan"],

  ["#F0F9FF", "Sky White"],
  ["#E0F2FE", "Pale Sky"],
  ["#BAE6FD", "Light Sky Blue"],
  ["#7DD3FC", "Baby Blue"],
  ["#38BDF8", "Sky Blue"],
  ["#0EA5E9", "Azure"],
  ["#0284C7", "Cobalt"],
  ["#0369A1", "Deep Blue"],
  ["#075985", "Navy Blue"],
  ["#0C4A6E", "Dark Navy"],

  ["#EFF6FF", "Glacier Blue"],
  ["#DBEAFE", "Light Periwinkle"],
  ["#BFDBFE", "Periwinkle"],
  ["#93C5FD", "Cornflower Blue"],
  ["#60A5FA", "Dodger Blue"],
  ["#3B82F6", "Blue"],
  ["#2563EB", "Royal Blue"],
  ["#1D4ED8", "Imperial Blue"],
  ["#1E40AF", "Sapphire"],
  ["#1E3A8A", "Midnight Sapphire"],

  ["#EEF2FF", "Lavender White"],
  ["#E0E7FF", "Pale Indigo"],
  ["#C7D2FE", "Light Indigo"],
  ["#A5B4FC", "Soft Indigo"],
  ["#818CF8", "Indigo Blue"],
  ["#6366F1", "Indigo"],
  ["#4F46E5", "Dark Indigo"],
  ["#4338CA", "Deep Indigo"],
  ["#3730A3", "Navy Indigo"],
  ["#312E81", "Night Indigo"],

  ["#F5F3FF", "Violet Pearl"],
  ["#EDE9FE", "Pale Violet"],
  ["#DDD6FE", "Lavender"],
  ["#C4B5FD", "Light Violet"],
  ["#A78BFA", "Amethyst"],
  ["#8B5CF6", "Violet"],
  ["#7C3AED", "Electric Purple"],
  ["#6D28D9", "Royal Purple"],
  ["#5B21B6", "Deep Violet"],
  ["#4C1D95", "Midnight Violet"],

  ["#FAF5FF", "Purple White"],
  ["#F3E8FF", "Pale Purple"],
  ["#E9D5FF", "Light Purple"],
  ["#D8B4FE", "Orchid"],
  ["#C084FC", "Bright Purple"],
  ["#A855F7", "Purple"],
  ["#9333EA", "Dark Purple"],
  ["#7E22CE", "Plum"],
  ["#6B21A8", "Deep Plum"],
  ["#581C87", "Dark Plum"],

  ["#FDF4FF", "Fuchsia White"],
  ["#FAE8FF", "Pale Fuchsia"],
  ["#F5D0FE", "Light Magenta"],
  ["#F0ABFC", "Lilac"],
  ["#E879F9", "Magenta"],
  ["#D946EF", "Fuchsia"],
  ["#C026D3", "Deep Magenta"],
  ["#A21CAF", "Purple Plum"],
  ["#86198F", "Dark Magenta"],
  ["#701A75", "Wine"],

  ["#FDF2F8", "Pink White"],
  ["#FCE7F3", "Pale Pink"],
  ["#FBCFE8", "Light Pink"],
  ["#F9A8D4", "Cotton Candy"],
  ["#F472B6", "Hot Pink"],
  ["#EC4899", "Pink"],
  ["#DB2777", "Deep Pink"],
  ["#BE185D", "Raspberry"],
  ["#9D174D", "Wine Berry"],
  ["#831843", "Dark Berry"],

  ["#FAFAF9", "Stone White"],
  ["#F5F5F4", "Warm Gray"],
  ["#E7E5E4", "Pebble"],
  ["#D6D3D1", "Sandstone"],
  ["#A8A29E", "Clay"],
  ["#78716C", "Stone"],
  ["#57534E", "Granite"],
  ["#44403C", "Dark Stone"],
  ["#292524", "Espresso"],
  ["#1C1917", "Dark Espresso"]
]

const PARSED_COLORS: NamedColor[] = COLOR_DATABASE.map(([hex, name]) => {
  const [r, g, b] = hexToRgbValues(hex)
  return { hex, name, r, g, b }
})

export function getColorName(hexInput: string): string {
  if (!hexInput) return "Unknown"
  const [r, g, b] = hexToRgbValues(hexInput)

  let bestMatch = "Color"
  let minDistance = Infinity

  for (const item of PARSED_COLORS) {
    // Weighted Euclidean distance in RGB color space (human perception sensitivity)
    const dr = r - item.r
    const dg = g - item.g
    const db = b - item.b
    const distance = 0.3 * (dr * dr) + 0.59 * (dg * dg) + 0.11 * (db * db)

    if (distance < minDistance) {
      minDistance = distance
      bestMatch = item.name
    }
  }

  return bestMatch
}
