/**
 * Intermediate Representation (IR) Schema
 * Framework-independent DOM-to-Figma layer representation
 */

export type IRNodeType =
  | "FRAME"
  | "TEXT"
  | "VECTOR"
  | "IMAGE"
  | "SVG"
  | "GROUP"
  | "RECTANGLE";

export interface IRBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IRColor {
  r: number; // 0 to 1
  g: number; // 0 to 1
  b: number; // 0 to 1
  a: number; // 0 to 1
}

export interface IRGradientStop {
  position: number; // 0 to 1
  color: IRColor;
}

export interface IRSolidFill {
  type: "SOLID";
  color: IRColor;
  opacity?: number;
  visible?: boolean;
}

export interface IRGradientLinearFill {
  type: "GRADIENT_LINEAR";
  gradientStops: IRGradientStop[];
  /** 2D transform matrix [a, b, c, d, tx, ty] mapping (0,0)-(1,1) gradient space */
  gradientTransform: [number, number, number, number, number, number];
  opacity?: number;
  visible?: boolean;
}

export interface IRGradientRadialFill {
  type: "GRADIENT_RADIAL";
  gradientStops: IRGradientStop[];
  gradientTransform: [number, number, number, number, number, number];
  opacity?: number;
  visible?: boolean;
}

export interface IRImageFill {
  type: "IMAGE";
  scaleMode: "FILL" | "FIT" | "CROP" | "TILE";
  objectPosition?: string;
  imageHash?: string;
  dataUrl?: string;
  url?: string;
  opacity?: number;
  visible?: boolean;
}

export type IRFill =
  | IRSolidFill
  | IRGradientLinearFill
  | IRGradientRadialFill
  | IRImageFill;

export interface IRStroke {
  color: IRColor;
  width: number;
  align?: "INSIDE" | "OUTSIDE" | "CENTER";
  dashes?: number[];
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  visible?: boolean;
}

export interface IREffect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  color?: IRColor;
  offset?: { x: number; y: number };
  radius: number; // blur
  spread?: number;
  visible?: boolean;
}

export interface IRLayout {
  mode: "NONE" | "HORIZONTAL" | "VERTICAL";
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  gap: number;
  primaryAxisAlign?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlign?: "MIN" | "CENTER" | "MAX" | "BASELINE";
  layoutWrap?: boolean;
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
}

export interface IRTextStyle {
  characters: string;
  fontSize: number;
  fontFamily: string;
  fontFallbacks?: string[];
  fontWeight: number; // 100 to 900
  fontStyle?: "normal" | "italic";
  lineHeightPx?: number;
  letterSpacingPx?: number;
  textAlign?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  fontVariantNumeric?: string;
  hasLeadingSpace?: boolean;
  hasTrailingSpace?: boolean;
  fills?: IRFill[];
}

export interface IRVectorData {
  /** SVG Path definition string, e.g. "M 0 0 L 100 0 L 80 100 Z" */
  svgPath: string;
  viewBox?: { width: number; height: number };
  isCutoutBackground?: boolean;
  cutoutType?: "polygon" | "inset" | "circle" | "ellipse" | "path";
  originalClipRule?: string;
}

export interface IRMetadata {
  tagName: string;
  className?: string;
  id?: string;
  isClipped?: boolean;
  isTextClipped?: boolean;
  originalClipPath?: string;
  isPseudoElement?: "before" | "after";
  zIndex?: number;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  objectPosition?: string;
  warnings?: string[];
  computedStyles?: Record<string, string>;
}

export interface IRNode {
  id: string;
  name: string;
  type: IRNodeType;
  box: IRBox;
  absoluteBox: IRBox;
  opacity: number;
  transform?: [number, number, number, number, number, number];
  rotation?: number; // degrees
  cornerRadius?: number | [number, number, number, number]; // [TL, TR, BR, BL]
  clipsContent?: boolean;
  fills: IRFill[];
  strokes: IRStroke[];
  effects: IREffect[];
  layout?: IRLayout;
  textData?: IRTextStyle;
  vectorData?: IRVectorData;
  svgContent?: string;
  children: IRNode[];
  metadata: IRMetadata;
}

export interface IRFontInfo {
  family: string;
  weight?: string | number;
  style?: string;
  src?: string;
  fontUrl?: string;
  sourceType?: "google-fonts" | "font-face" | "system" | "custom";
}

export interface IRDocument {
  version: "1.0.0";
  generator: "html2figma-extension";
  timestamp: number;
  title: string;
  url: string;
  viewport: { width: number; height: number; scrollX: number; scrollY: number };
  captureMode: "element" | "fullPage";
  rootNode: IRNode;
  fonts?: IRFontInfo[];
  fontFaceCss?: string[];
  stats: {
    totalNodes: number;
    textNodes: number;
    vectorNodes: number;
    cutoutNodes: number;
    imageNodes: number;
    warnings: string[];
  };
}
