import React from "react"

interface YtMusicIconProps {
  size?: number | string
  className?: string
  style?: React.CSSProperties
}

/**
 * Authentic YouTube Music Logo Component
 */
export const YtMusicIcon: React.FC<YtMusicIconProps> = ({
  size = 16,
  className = "",
  style
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* YouTube Music Signature Red Disc */}
      <circle cx="12" cy="12" r="11" fill="#FF0000" />
      {/* Concentric White Ring */}
      <circle
        cx="12"
        cy="12"
        r="6.8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.35"
      />
      {/* Centered White Play Triangle */}
      <polygon points="10,8.2 15.8,12 10,15.8" fill="#FFFFFF" />
    </svg>
  )
}

export default YtMusicIcon
