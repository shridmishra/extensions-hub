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
  ["#FFFFFF", "White"],

  // Slate
  ["#F8FAFC", "Slate 50"],
  ["#F1F5F9", "Slate 100"],
  ["#E2E8F0", "Slate 200"],
  ["#CBD5E1", "Slate 300"],
  ["#94A3B8", "Slate 400"],
  ["#64748B", "Slate 500"],
  ["#475569", "Slate 600"],
  ["#334155", "Slate 700"],
  ["#1E293B", "Slate 800"],
  ["#0F172A", "Slate 900"],
  ["#020617", "Slate 950"],

  // Gray
  ["#F9FAFB", "Gray 50"],
  ["#F3F4F6", "Gray 100"],
  ["#E5E7EB", "Gray 200"],
  ["#D1D5DB", "Gray 300"],
  ["#9CA3AF", "Gray 400"],
  ["#6B7280", "Gray 500"],
  ["#4B5563", "Gray 600"],
  ["#374151", "Gray 700"],
  ["#1F2937", "Gray 800"],
  ["#111827", "Gray 900"],
  ["#030712", "Gray 950"],

  // Zinc
  ["#FAFAFA", "Zinc 50"],
  ["#F4F4F5", "Zinc 100"],
  ["#E4E4E7", "Zinc 200"],
  ["#D4D4D8", "Zinc 300"],
  ["#A1A1AA", "Zinc 400"],
  ["#71717A", "Zinc 500"],
  ["#52525B", "Zinc 600"],
  ["#3F3F46", "Zinc 700"],
  ["#27272A", "Zinc 800"],
  ["#18181B", "Zinc 900"],
  ["#09090B", "Zinc 950"],

  // Neutral
  ["#F5F5F5", "Neutral 100"],
  ["#E5E5E5", "Neutral 200"],
  ["#D4D4D4", "Neutral 300"],
  ["#A3A3A3", "Neutral 400"],
  ["#737373", "Neutral 500"],
  ["#525252", "Neutral 600"],
  ["#404040", "Neutral 700"],
  ["#262626", "Neutral 800"],
  ["#171717", "Neutral 900"],
  ["#0A0A0A", "Neutral 950"],

  // Stone
  ["#FAFAF9", "Stone 50"],
  ["#F5F5F4", "Stone 100"],
  ["#E7E5E4", "Stone 200"],
  ["#D6D3D1", "Stone 300"],
  ["#A8A29E", "Stone 400"],
  ["#78716C", "Stone 500"],
  ["#57534E", "Stone 600"],
  ["#44403C", "Stone 700"],
  ["#292524", "Stone 800"],
  ["#1C1917", "Stone 900"],
  ["#0C0A09", "Stone 950"],

  // Red
  ["#FEF2F2", "Red 50"],
  ["#FEE2E2", "Red 100"],
  ["#FECACA", "Red 200"],
  ["#FCA5A5", "Red 300"],
  ["#F87171", "Red 400"],
  ["#EF4444", "Red 500"],
  ["#DC2626", "Red 600"],
  ["#B91C1C", "Red 700"],
  ["#991B1B", "Red 800"],
  ["#7F1D1D", "Red 900"],
  ["#450A0A", "Red 950"],

  // Orange
  ["#FFF7ED", "Orange 50"],
  ["#FFEDD5", "Orange 100"],
  ["#FED7AA", "Orange 200"],
  ["#FDBA74", "Orange 300"],
  ["#FB923C", "Orange 400"],
  ["#F97316", "Orange 500"],
  ["#EA580C", "Orange 600"],
  ["#C2410C", "Orange 700"],
  ["#9A3412", "Orange 800"],
  ["#7C2D12", "Orange 900"],
  ["#431407", "Orange 950"],

  // Amber
  ["#FFFBEB", "Amber 50"],
  ["#FEF3C7", "Amber 100"],
  ["#FDE68A", "Amber 200"],
  ["#FCD34D", "Amber 300"],
  ["#FBBF24", "Amber 400"],
  ["#F59E0B", "Amber 500"],
  ["#D97706", "Amber 600"],
  ["#B45309", "Amber 700"],
  ["#92400E", "Amber 800"],
  ["#78350F", "Amber 900"],
  ["#451A03", "Amber 950"],

  // Yellow
  ["#FEFCE8", "Yellow 50"],
  ["#FEF9C3", "Yellow 100"],
  ["#FEF08A", "Yellow 200"],
  ["#FDE047", "Yellow 300"],
  ["#FACC15", "Yellow 400"],
  ["#EAB308", "Yellow 500"],
  ["#CA8A04", "Yellow 600"],
  ["#A16207", "Yellow 700"],
  ["#854D0E", "Yellow 800"],
  ["#713F12", "Yellow 900"],
  ["#422006", "Yellow 950"],

  // Lime
  ["#F7FEE7", "Lime 50"],
  ["#ECFCCB", "Lime 100"],
  ["#D9F99D", "Lime 200"],
  ["#BEF264", "Lime 300"],
  ["#A3E635", "Lime 400"],
  ["#84CC16", "Lime 500"],
  ["#65A30D", "Lime 600"],
  ["#4D7C0F", "Lime 700"],
  ["#3F6212", "Lime 800"],
  ["#365314", "Lime 900"],
  ["#1A2E05", "Lime 950"],

  // Green
  ["#F0FDF4", "Green 50"],
  ["#DCFCE7", "Green 100"],
  ["#BBF7D0", "Green 200"],
  ["#86EFAC", "Green 300"],
  ["#4ADE80", "Green 400"],
  ["#22C55E", "Green 500"],
  ["#16A34A", "Green 600"],
  ["#15803D", "Green 700"],
  ["#166534", "Green 800"],
  ["#14532D", "Green 900"],
  ["#052E16", "Green 950"],

  // Emerald
  ["#ECFDF5", "Emerald 50"],
  ["#D1FAE5", "Emerald 100"],
  ["#A7F3D0", "Emerald 200"],
  ["#6EE7B7", "Emerald 300"],
  ["#34D399", "Emerald 400"],
  ["#10B981", "Emerald 500"],
  ["#059669", "Emerald 600"],
  ["#047857", "Emerald 700"],
  ["#065F46", "Emerald 800"],
  ["#064E3B", "Emerald 900"],
  ["#022C22", "Emerald 950"],

  // Teal
  ["#F0FDFA", "Teal 50"],
  ["#CCFBF1", "Teal 100"],
  ["#99F6E4", "Teal 200"],
  ["#5EEAD4", "Teal 300"],
  ["#2DD4BF", "Teal 400"],
  ["#14B8A6", "Teal 500"],
  ["#0D9488", "Teal 600"],
  ["#0F766E", "Teal 700"],
  ["#115E59", "Teal 800"],
  ["#134E4A", "Teal 900"],
  ["#042F2E", "Teal 950"],

  // Cyan
  ["#ECFEFF", "Cyan 50"],
  ["#CFFAFE", "Cyan 100"],
  ["#A5F3FC", "Cyan 200"],
  ["#67E8F9", "Cyan 300"],
  ["#22D3EE", "Cyan 400"],
  ["#06B6D4", "Cyan 500"],
  ["#0891B2", "Cyan 600"],
  ["#0E7490", "Cyan 700"],
  ["#155E75", "Cyan 800"],
  ["#164E63", "Cyan 900"],
  ["#083344", "Cyan 950"],

  // Sky
  ["#F0F9FF", "Sky 50"],
  ["#E0F2FE", "Sky 100"],
  ["#BAE6FD", "Sky 200"],
  ["#7DD3FC", "Sky 300"],
  ["#38BDF8", "Sky 400"],
  ["#0EA5E9", "Sky 500"],
  ["#0284C7", "Sky 600"],
  ["#0369A1", "Sky 700"],
  ["#075985", "Sky 800"],
  ["#0C4A6E", "Sky 900"],
  ["#082F49", "Sky 950"],

  // Blue
  ["#EFF6FF", "Blue 50"],
  ["#DBEAFE", "Blue 100"],
  ["#BFDBFE", "Blue 200"],
  ["#93C5FD", "Blue 300"],
  ["#60A5FA", "Blue 400"],
  ["#3B82F6", "Blue 500"],
  ["#2563EB", "Blue 600"],
  ["#1D4ED8", "Blue 700"],
  ["#1E40AF", "Blue 800"],
  ["#1E3A8A", "Blue 900"],
  ["#172554", "Blue 950"],

  // Indigo
  ["#EEF2FF", "Indigo 50"],
  ["#E0E7FF", "Indigo 100"],
  ["#C7D2FE", "Indigo 200"],
  ["#A5B4FC", "Indigo 300"],
  ["#818CF8", "Indigo 400"],
  ["#6366F1", "Indigo 500"],
  ["#4F46E5", "Indigo 600"],
  ["#4338CA", "Indigo 700"],
  ["#3730A3", "Indigo 800"],
  ["#312E81", "Indigo 900"],
  ["#1E1B4B", "Indigo 950"],

  // Violet
  ["#F5F3FF", "Violet 50"],
  ["#EDE9FE", "Violet 100"],
  ["#DDD6FE", "Violet 200"],
  ["#C4B5FD", "Violet 300"],
  ["#A78BFA", "Violet 400"],
  ["#8B5CF6", "Violet 500"],
  ["#7C3AED", "Violet 600"],
  ["#6D28D9", "Violet 700"],
  ["#5B21B6", "Violet 800"],
  ["#4C1D95", "Violet 900"],
  ["#2E1065", "Violet 950"],

  // Purple
  ["#FAF5FF", "Purple 50"],
  ["#F3E8FF", "Purple 100"],
  ["#E9D5FF", "Purple 200"],
  ["#D8B4FE", "Purple 300"],
  ["#C084FC", "Purple 400"],
  ["#A855F7", "Purple 500"],
  ["#9333EA", "Purple 600"],
  ["#7E22CE", "Purple 700"],
  ["#6B21A8", "Purple 800"],
  ["#581C87", "Purple 900"],
  ["#3B0764", "Purple 950"],

  // Fuchsia
  ["#FDF4FF", "Fuchsia 50"],
  ["#FAE8FF", "Fuchsia 100"],
  ["#F5D0FE", "Fuchsia 200"],
  ["#F0ABFC", "Fuchsia 300"],
  ["#E879F9", "Fuchsia 400"],
  ["#D946EF", "Fuchsia 500"],
  ["#C026D3", "Fuchsia 600"],
  ["#A21CAF", "Fuchsia 700"],
  ["#86198F", "Fuchsia 800"],
  ["#701A75", "Fuchsia 900"],
  ["#4A044E", "Fuchsia 950"],

  // Pink
  ["#FDF2F8", "Pink 50"],
  ["#FCE7F3", "Pink 100"],
  ["#FBCFE8", "Pink 200"],
  ["#F9A8D4", "Pink 300"],
  ["#F472B6", "Pink 400"],
  ["#EC4899", "Pink 500"],
  ["#DB2777", "Pink 600"],
  ["#BE185D", "Pink 700"],
  ["#9D174D", "Pink 800"],
  ["#831843", "Pink 900"],
  ["#500724", "Pink 950"],

  // Rose
  ["#FFF1F2", "Rose 50"],
  ["#FFE4E6", "Rose 100"],
  ["#FECDD3", "Rose 200"],
  ["#FDA4AF", "Rose 300"],
  ["#FB7185", "Rose 400"],
  ["#F43F5E", "Rose 500"],
  ["#E11D48", "Rose 600"],
  ["#BE123C", "Rose 700"],
  ["#9F1239", "Rose 800"],
  ["#881337", "Rose 900"],
  ["#4C0519", "Rose 950"]
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
