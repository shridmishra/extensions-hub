import React from "react"

interface HubLogoProps {
  size?: number | string
  className?: string
  color?: string
  style?: React.CSSProperties
}

/**
 * 4-Petal Clover / Pinwheel Brand Logo for Extension Hub
 */
export const HubLogo: React.FC<HubLogoProps> = ({
  size = 20,
  className = "",
  color = "currentColor",
  style
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Top-Left Petal */}
      <path
        d="M 240.00 240.00 L 140.48 240.00 A 99.52 99.52 0 0 1 40.96 140.48 L 40.96 140.48 A 99.52 99.52 0 0 1 140.48 40.96 L 140.48 40.96 A 99.52 99.52 0 0 1 240.00 140.48 Z"
        fill={color}
      />
      {/* Top-Right Petal */}
      <path
        d="M 272.00 240.00 L 272.00 140.48 A 99.52 99.52 0 0 1 371.52 40.96 L 371.52 40.96 A 99.52 99.52 0 0 1 471.04 140.48 L 471.04 140.48 A 99.52 99.52 0 0 1 371.52 240.00 Z"
        fill={color}
      />
      {/* Bottom-Left Petal */}
      <path
        d="M 240.00 272.00 L 240.00 371.52 A 99.52 99.52 0 0 1 140.48 471.04 L 140.48 471.04 A 99.52 99.52 0 0 1 40.96 371.52 L 40.96 371.52 A 99.52 99.52 0 0 1 140.48 272.00 Z"
        fill={color}
      />
      {/* Bottom-Right Petal */}
      <path
        d="M 272.00 272.00 L 371.52 272.00 A 99.52 99.52 0 0 1 471.04 371.52 L 471.04 371.52 A 99.52 99.52 0 0 1 371.52 471.04 L 371.52 471.04 A 99.52 99.52 0 0 1 272.00 371.52 Z"
        fill={color}
      />
    </svg>
  )
}

export default HubLogo
