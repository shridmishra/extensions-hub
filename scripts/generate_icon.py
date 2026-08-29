#!/usr/bin/env python3
"""
4-Petal Clover / Pinwheel Icon Generator in Python
Generates crisp, high-resolution Black & White (and custom color) icons in PNG, SVG, and ICO formats.
"""

import argparse
import math
import os
from typing import List, Optional, Tuple
from PIL import Image, ImageChops, ImageDraw


def get_petal_polygon(
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    sharp_corner: str = "br",
    inner_radius: float = 0.0,
    n_arc: int = 48,
) -> List[Tuple[float, float]]:
    """
    Computes polygon vertices for a single petal.
    The petal has 3 fully-rounded outer corners (radius = width / 2)
    and 1 sharp/subtly-rounded inner corner.

    sharp_corner: 'br' (Top-Left petal), 'bl' (Top-Right petal),
                  'tr' (Bottom-Left petal), 'tl' (Bottom-Right petal)
    """
    w = x1 - x0
    h = y1 - y0
    r_outer = min(w, h) / 2.0
    r_inner = max(0.0, min(inner_radius, r_outer))

    pts: List[Tuple[float, float]] = []

    # 1. Top-Left corner (180 to 270 degrees)
    if sharp_corner == "tl":
        if r_inner > 0:
            cx, cy = x0 + r_inner, y0 + r_inner
            for i in range(n_arc + 1):
                theta = math.pi + (math.pi / 2.0) * (i / n_arc)
                pts.append((cx + r_inner * math.cos(theta), cy + r_inner * math.sin(theta)))
        else:
            pts.append((x0, y0))
    else:
        cx, cy = x0 + r_outer, y0 + r_outer
        for i in range(n_arc + 1):
            theta = math.pi + (math.pi / 2.0) * (i / n_arc)
            pts.append((cx + r_outer * math.cos(theta), cy + r_outer * math.sin(theta)))

    # 2. Top-Right corner (270 to 360 degrees)
    if sharp_corner == "tr":
        if r_inner > 0:
            cx, cy = x1 - r_inner, y0 + r_inner
            for i in range(n_arc + 1):
                theta = 1.5 * math.pi + (math.pi / 2.0) * (i / n_arc)
                pts.append((cx + r_inner * math.cos(theta), cy + r_inner * math.sin(theta)))
        else:
            pts.append((x1, y0))
    else:
        cx, cy = x1 - r_outer, y0 + r_outer
        for i in range(n_arc + 1):
            theta = 1.5 * math.pi + (math.pi / 2.0) * (i / n_arc)
            pts.append((cx + r_outer * math.cos(theta), cy + r_outer * math.sin(theta)))

    # 3. Bottom-Right corner (0 to 90 degrees)
    if sharp_corner == "br":
        if r_inner > 0:
            cx, cy = x1 - r_inner, y1 - r_inner
            for i in range(n_arc + 1):
                theta = 0.0 + (math.pi / 2.0) * (i / n_arc)
                pts.append((cx + r_inner * math.cos(theta), cy + r_inner * math.sin(theta)))
        else:
            pts.append((x1, y1))
    else:
        cx, cy = x1 - r_outer, y1 - r_outer
        for i in range(n_arc + 1):
            theta = 0.0 + (math.pi / 2.0) * (i / n_arc)
            pts.append((cx + r_outer * math.cos(theta), cy + r_outer * math.sin(theta)))

    # 4. Bottom-Left corner (90 to 180 degrees)
    if sharp_corner == "bl":
        if r_inner > 0:
            cx, cy = x0 + r_inner, y1 - r_inner
            for i in range(n_arc + 1):
                theta = 0.5 * math.pi + (math.pi / 2.0) * (i / n_arc)
                pts.append((cx + r_inner * math.cos(theta), cy + r_inner * math.sin(theta)))
        else:
            pts.append((x0, y1))
    else:
        cx, cy = x0 + r_outer, y1 - r_outer
        for i in range(n_arc + 1):
            theta = 0.5 * math.pi + (math.pi / 2.0) * (i / n_arc)
            pts.append((cx + r_outer * math.cos(theta), cy + r_outer * math.sin(theta)))

    return pts


def render_icon_png(
    size: int = 512,
    gap_ratio: float = 0.0625,
    pad_ratio: float = 0.08,
    fg_color: Tuple[int, int, int, int] = (0, 0, 0, 255),
    bg_color: Tuple[int, int, int, int] = (0, 0, 0, 0),
    inner_radius_ratio: float = 0.0,
    outline: bool = False,
    stroke_width_ratio: float = 0.08,
    supersample: int = 4,
) -> Image.Image:
    """
    Renders an antialiased icon with supersampling and crisp alpha transparency.
    """
    ss = size * supersample
    img = Image.new("RGBA", (ss, ss), bg_color)

    pad = ss * pad_ratio
    gap = ss * gap_ratio
    avail = ss - 2 * pad - gap
    petal_size = avail / 2.0
    r_inner = petal_size * inner_radius_ratio

    petals = [
        (pad, pad, pad + petal_size, pad + petal_size, "br"),
        (pad + petal_size + gap, pad, pad + 2 * petal_size + gap, pad + petal_size, "bl"),
        (pad, pad + petal_size + gap, pad + petal_size, pad + 2 * petal_size + gap, "tr"),
        (pad + petal_size + gap, pad + petal_size + gap, pad + 2 * petal_size + gap, pad + 2 * petal_size + gap, "tl"),
    ]

    if outline:
        sw = max(1.0, petal_size * stroke_width_ratio)
        mask_outer = Image.new("L", (ss, ss), 0)
        d_out = ImageDraw.Draw(mask_outer)
        mask_inner = Image.new("L", (ss, ss), 0)
        d_in = ImageDraw.Draw(mask_inner)

        for x0, y0, x1, y1, sharp in petals:
            pts_out = get_petal_polygon(x0, y0, x1, y1, sharp_corner=sharp, inner_radius=r_inner, n_arc=64)
            d_out.polygon(pts_out, fill=255)

            pts_in = get_petal_polygon(
                x0 + sw,
                y0 + sw,
                x1 - sw,
                y1 - sw,
                sharp_corner=sharp,
                inner_radius=max(0.0, r_inner - sw),
                n_arc=64,
            )
            d_in.polygon(pts_in, fill=255)

        mask_stroke = ImageChops.subtract(mask_outer, mask_inner)
        solid_fg = Image.new("RGBA", (ss, ss), fg_color)
        img.paste(solid_fg, (0, 0), mask_stroke)
    else:
        draw = ImageDraw.Draw(img)
        for x0, y0, x1, y1, sharp in petals:
            pts = get_petal_polygon(x0, y0, x1, y1, sharp_corner=sharp, inner_radius=r_inner, n_arc=64)
            draw.polygon(pts, fill=fg_color)

    if supersample > 1:
        img = img.resize((size, size), Image.Resampling.LANCZOS)

    return img


def generate_svg(
    gap_ratio: float = 0.0625,
    pad_ratio: float = 0.08,
    fg_color: str = "#000000",
    bg_color: Optional[str] = None,
    viewbox: int = 512,
    outline: bool = False,
    stroke_width_ratio: float = 0.08,
) -> str:
    """
    Generates a clean, resolution-independent SVG string.
    """
    pad = viewbox * pad_ratio
    gap = viewbox * gap_ratio
    avail = viewbox - 2 * pad - gap
    s = avail / 2.0
    r = s / 2.0
    stroke_w = s * stroke_width_ratio

    def petal_path(x0: float, y0: float, sharp: str) -> str:
        x1, y1 = x0 + s, y0 + s
        if sharp == "br":
            return (
                f"M {x1:.2f} {y1:.2f} "
                f"L {x0+r:.2f} {y1:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x0:.2f} {y1-r:.2f} "
                f"L {x0:.2f} {y0+r:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x0+r:.2f} {y0:.2f} "
                f"L {x1-r:.2f} {y0:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y0+r:.2f} "
                f"Z"
            )
        elif sharp == "bl":
            return (
                f"M {x0:.2f} {y1:.2f} "
                f"L {x0:.2f} {y0+r:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x0:.2f} {y0:.2f} "
                f"L {x1-r:.2f} {y0:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y0+r:.2f} "
                f"L {x1:.2f} {y1-r:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y1:.2f} "
                f"Z"
            )
        elif sharp == "tr":
            return (
                f"M {x1:.2f} {y0:.2f} "
                f"L {x1:.2f} {y1-r:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y1:.2f} "
                f"L {x0+r:.2f} {y1:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x0:.2f} {y1-r:.2f} "
                f"L {x0:.2f} {y0+r:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x0+r:.2f} {y0:.2f} "
                f"Z"
            )
        elif sharp == "tl":
            return (
                f"M {x0:.2f} {y0:.2f} "
                f"L {x1-r:.2f} {y0:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y0+r:.2f} "
                f"L {x1:.2f} {y1-r:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y1-r:.2f} "
                f"L {x0+r:.2f} {y1:.2f} "
                f"A {r:.2f} {r:.2f} 0 0 1 {x0:.2f} {y1-r:.2f} "
                f"Z"
            )
        return ""

    bg_element = f'  <rect width="{viewbox}" height="{viewbox}" fill="{bg_color}"/>\n' if bg_color else ""
    
    style_attr = f'fill="none" stroke="{fg_color}" stroke-width="{stroke_w:.2f}" stroke-linejoin="round"' if outline else f'fill="{fg_color}"'

    tl = petal_path(pad, pad, "br")
    tr = petal_path(pad + s + gap, pad, "bl")
    bl = petal_path(pad, pad + s + gap, "tr")
    br = petal_path(pad + s + gap, pad + s + gap, "tl")

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {viewbox} {viewbox}" width="100%" height="100%">
{bg_element}  <path d="{tl}" {style_attr}/>
  <path d="{tr}" {style_attr}/>
  <path d="{bl}" {style_attr}/>
  <path d="{br}" {style_attr}/>
</svg>
"""
    return svg


def export_icon_suite(output_dir: str = "generated_icons"):
    """
    Exports a comprehensive package of Black & White icons:
    - PNGs (Transparent & solid backgrounds, light/dark modes, outline & filled)
    - Multi-size Favicons & App Icons (16, 32, 48, 64, 128, 256, 512, 1024)
    - SVGs (Scalable vectors)
    - ICO multi-resolution file
    """
    os.makedirs(output_dir, exist_ok=True)

    themes = [
        ("black_transparent", (0, 0, 0, 255), (0, 0, 0, 0), "#000000", None, False),
        ("white_transparent", (255, 255, 255, 255), (0, 0, 0, 0), "#FFFFFF", None, False),
        ("black_on_white", (0, 0, 0, 255), (255, 255, 255, 255), "#000000", "#FFFFFF", False),
        ("white_on_black", (255, 255, 255, 255), (18, 18, 18, 255), "#FFFFFF", "#121212", False),
        ("outline_black", (0, 0, 0, 255), (0, 0, 0, 0), "#000000", None, True),
        ("outline_white", (255, 255, 255, 255), (0, 0, 0, 0), "#FFFFFF", None, True),
        ("outline_black_on_white", (0, 0, 0, 255), (255, 255, 255, 255), "#000000", "#FFFFFF", True),
        ("outline_white_on_black", (255, 255, 255, 255), (18, 18, 18, 255), "#FFFFFF", "#121212", True),
    ]

    sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
    
    print(f"Generating icon suite in '{output_dir}'...")

    for name, fg, bg, fg_svg, bg_svg, is_outline in themes:
        # Generate 512px primary PNG
        img_512 = render_icon_png(size=512, fg_color=fg, bg_color=bg, outline=is_outline)
        img_512.save(os.path.join(output_dir, f"icon_{name}_512.png"))

        # Generate SVG
        svg_str = generate_svg(fg_color=fg_svg, bg_color=bg_svg, outline=is_outline)
        with open(os.path.join(output_dir, f"icon_{name}.svg"), "w", encoding="utf-8") as f:
            f.write(svg_str)

    # Generate multi-size set for the primary black_transparent & white_on_black
    for size in sizes:
        img_bt = render_icon_png(size=size, fg_color=(0, 0, 0, 255), bg_color=(0, 0, 0, 0))
        img_bt.save(os.path.join(output_dir, f"icon_black_{size}x{size}.png"))

        img_wb = render_icon_png(size=size, fg_color=(255, 255, 255, 255), bg_color=(18, 18, 18, 255))
        img_wb.save(os.path.join(output_dir, f"icon_white_dark_{size}x{size}.png"))

    # Generate Windows .ico file with multiple embedded resolutions
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_imgs = [render_icon_png(size=s[0], fg_color=(0, 0, 0, 255), bg_color=(0, 0, 0, 0)) for s in ico_sizes]
    ico_imgs[0].save(
        os.path.join(output_dir, "favicon.ico"),
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_imgs[1:],
    )

    print("Done! Icon suite generated successfully.")


def main():
    parser = argparse.ArgumentParser(description="Generate 4-Petal B&W icon in PNG, SVG, or ICO formats.")
    parser.add_argument("--size", type=int, default=512, help="Icon width/height in pixels (default: 512)")
    parser.add_argument(
        "--theme",
        choices=[
            "black_transparent",
            "white_transparent",
            "black_on_white",
            "white_on_black",
            "outline_black",
            "outline_white",
            "outline_black_on_white",
            "outline_white_on_black",
            "all",
        ],
        default="all",
        help="Color theme",
    )
    parser.add_argument("--gap", type=float, default=0.0625, help="Gap ratio between petals (default: 0.0625)")
    parser.add_argument("--padding", type=float, default=0.08, help="Outer padding ratio (default: 0.08)")
    parser.add_argument("--output", type=str, default="generated_icons", help="Output directory or file path")
    
    args = parser.parse_args()

    if args.theme == "all":
        export_icon_suite(args.output)
    else:
        out_dir = args.output if not args.output.endswith((".png", ".svg", ".ico")) else os.path.dirname(args.output) or "."
        os.makedirs(out_dir, exist_ok=True)
        theme_map = {
            "black_transparent": ((0, 0, 0, 255), (0, 0, 0, 0), "#000000", None, False),
            "white_transparent": ((255, 255, 255, 255), (0, 0, 0, 0), "#FFFFFF", None, False),
            "black_on_white": ((0, 0, 0, 255), (255, 255, 255, 255), "#000000", "#FFFFFF", False),
            "white_on_black": ((255, 255, 255, 255), (18, 18, 18, 255), "#FFFFFF", "#121212", False),
            "outline_black": ((0, 0, 0, 255), (0, 0, 0, 0), "#000000", None, True),
            "outline_white": ((255, 255, 255, 255), (0, 0, 0, 0), "#FFFFFF", None, True),
            "outline_black_on_white": ((0, 0, 0, 255), (255, 255, 255, 255), "#000000", "#FFFFFF", True),
            "outline_white_on_black": ((255, 255, 255, 255), (18, 18, 18, 255), "#FFFFFF", "#121212", True),
        }
        fg, bg, fg_svg, bg_svg, is_outline = theme_map[args.theme]
        
        img = render_icon_png(size=args.size, gap_ratio=args.gap, pad_ratio=args.padding, fg_color=fg, bg_color=bg, outline=is_outline)
        out_png = os.path.join(args.output, f"icon_{args.theme}_{args.size}.png") if not args.output.endswith(".png") else args.output
        img.save(out_png)
        print(f"Saved PNG to {out_png}")

        svg_str = generate_svg(gap_ratio=args.gap, pad_ratio=args.padding, fg_color=fg_svg, bg_color=bg_svg, outline=is_outline)
        out_svg = os.path.splitext(out_png)[0] + ".svg"
        with open(out_svg, "w", encoding="utf-8") as f:
            f.write(svg_str)
        print(f"Saved SVG to {out_svg}")


if __name__ == "__main__":
    main()
