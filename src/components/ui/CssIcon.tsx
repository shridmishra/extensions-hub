import React from "react"

interface CssIconProps {
  size?: number | string
  className?: string
  style?: React.CSSProperties
}

/**
 * Authentic CSS Shield Badge Component with "CSS" Typography
 */
export const CssIcon: React.FC<CssIconProps> = ({
  size = 16,
  className = "",
  style
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Left Shield Half (Classic CSS Blue) */}
      <path
        d="M 4.5 3.5 L 16 3.5 L 16 28.5 L 6.6 25.4 L 4.5 3.5 Z"
        fill="#264DE4"
      />
      {/* Right Shield Half (Lighter Blue Facet) */}
      <path
        d="M 16 3.5 L 27.5 3.5 L 25.4 25.4 L 16 28.5 L 16 3.5 Z"
        fill="#2965F1"
      />
      {/* Inner subtle shield inset */}
      <path
        d="M 6.5 5.5 L 25.5 5.5 L 23.8 23.8 L 16 26.5 L 8.2 23.8 Z"
        fill="#1572B6"
        opacity="0.35"
      />
      {/* Prominent CSS lettering centered */}
      <text
        x="16"
        y="16.5"
        fill="#FFFFFF"
        fontSize="9.5"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="-0.02em"
        style={{
          userSelect: "none",
          WebkitFontSmoothing: "antialiased"
        }}
      >
        CSS
      </text>
    </svg>
  )
}

export default CssIcon
