#!/usr/bin/env python3
"""
Chrome Web Store Asset Generator for Extension Hub
Generates:
- Store Icon (128x128 PNG)
- Small Promo Tile (440x280 PNG)
- Marquee Promo Tile (1400x560 PNG)
- Screenshot 1: Hub & Extension Store (1280x800 PNG)
- Screenshot 2: YouTube to YT Music Switcher (1280x800 PNG)
- Screenshot 3: Developer & Inspection Tools (1280x800 PNG)
"""

import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from generate_icon import render_icon_png, get_petal_polygon


def create_store_icon(output_path: str):
    """Generate 128x128 Store Icon with solid dark background."""
    img = render_icon_png(
        size=128,
        fg_color=(255, 255, 255, 255),
        bg_color=(18, 18, 20, 255),
        gap_ratio=0.0625,
        pad_ratio=0.12,
        supersample=4
    )
    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.size[0]}x{img.size[1]})")


def draw_rounded_card(draw: ImageDraw.Draw, box, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)


def get_font(size: int, weight: str = "Bold"):
    # Try local font in assets or fallback
    font_paths = [
        f"assets/Satoshi-{weight}.woff2",
        f"assets/Satoshi-Bold.woff2",
        "/System/Library/Fonts/SFPro-Bold.otf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


def create_small_promo_tile(output_path: str):
    """440x280 Small Promo Tile for Chrome Web Store featured listings."""
    w, h = 440, 280
    img = Image.new("RGBA", (w, h), (14, 14, 16, 255))
    draw = ImageDraw.Draw(img)

    # Subtle inner border
    draw_rounded_card(draw, (8, 8, w - 8, h - 8), 12, (20, 20, 24, 255), outline=(45, 45, 52, 255), width=1)

    # Icon
    icon = render_icon_png(size=64, fg_color=(255, 255, 255, 255), bg_color=(28, 28, 34, 255), pad_ratio=0.14)
    # Mask icon with rounded corner
    mask = Image.new("L", (64, 64), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([0, 0, 64, 64], radius=14, fill=255)
    img.paste(icon, (36, 40), mask)

    # Text & Titles
    f_badge = get_font(11, "Medium")
    f_title = get_font(20, "Bold")
    f_desc = get_font(12, "Regular")
    f_tag = get_font(10, "Medium")

    # Category badge
    draw_rounded_card(draw, (116, 42, 252, 60), 4, (32, 32, 40, 255), outline=(60, 60, 72, 255), width=1)
    draw.text((124, 45), "MICRO-EXTENSION SUITE", font=f_badge, fill=(180, 180, 195, 255))

    # Main Title
    draw.text((116, 68), "Extension Hub", font=f_title, fill=(255, 255, 255, 255))

    # Feature points
    features = [
        "• YouTube to YT Music Switcher",
        "• Font Finder & CSS Style Inspector",
        "• Precision Color Picker & Dark Mode",
    ]
    y = 126
    for feat in features:
        draw.text((36, y), feat, font=f_desc, fill=(200, 200, 210, 255))
        y += 24

    # Bottom Tags
    tags = ["Manifest V3", "100% Client-Side", "Fast & Modular"]
    x = 36
    for tag in tags:
        tw = int(len(tag) * 6.5) + 16
        draw_rounded_card(draw, (x, 218, x + tw, 240), 6, (26, 26, 32, 255), outline=(50, 50, 60, 255), width=1)
        draw.text((x + 8, 223), tag, font=f_tag, fill=(160, 160, 175, 255))
        x += tw + 8

    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.size[0]}x{img.size[1]})")


def create_marquee_promo_tile(output_path: str):
    """1400x560 Marquee Banner for Chrome Web Store hero spots."""
    w, h = 1400, 560
    img = Image.new("RGBA", (w, h), (12, 12, 14, 255))
    draw = ImageDraw.Draw(img)

    # Background gradient / grid styling
    for i in range(0, w, 40):
        draw.line([(i, 0), (i, h)], fill=(20, 20, 24, 255), width=1)
    for j in range(0, h, 40):
        draw.line([(0, j), (w, j)], fill=(20, 20, 24, 255), width=1)

    # Main left container card
    draw_rounded_card(draw, (60, 60, 780, 500), 20, (18, 18, 22, 255), outline=(45, 45, 55, 255), width=2)

    # Large Icon
    icon = render_icon_png(size=120, fg_color=(255, 255, 255, 255), bg_color=(28, 28, 36, 255), pad_ratio=0.12)
    mask = Image.new("L", (120, 120), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([0, 0, 120, 120], radius=24, fill=255)
    img.paste(icon, (100, 100), mask)

    f_badge = get_font(13, "Bold")
    f_title = get_font(38, "Bold")
    f_sub = get_font(17, "Medium")
    f_desc = get_font(15, "Regular")

    # Header
    draw_rounded_card(draw, (244, 104, 460, 132), 6, (32, 32, 42, 255), outline=(65, 65, 80, 255), width=1)
    draw.text((256, 109), "ALL-IN-ONE EXTENSION SUITE", font=f_badge, fill=(220, 220, 235, 255))

    draw.text((244, 142), "Extension Hub", font=f_title, fill=(255, 255, 255, 255))
    draw.text((244, 194), "One high-performance extension. Dozens of micro-tools.", font=f_sub, fill=(170, 170, 185, 255))

    # Feature List
    features = [
        "✓ YouTube to YT Music Switcher — Sync timeline & playlists with 1-click",
        "✓ Font Finder Inspector — Inspect typography & copy CSS / Tailwind snippets",
        "✓ Pixel Color Picker & Palette — Precision EyeDropper with HEX / RGB / HSL",
        "✓ Smart Dark/Light Mode Forcer — High-contrast themes with media protection",
        "✓ HTML to Figma Vector Importer — Direct clipboard paste into Figma",
    ]
    y = 250
    for feat in features:
        draw.text((100, y), feat, font=f_desc, fill=(220, 220, 230, 255))
        y += 34

    draw.text((100, 442), "⚡ Zero bloat • 100% Client-Side Privacy • Manifest V3", font=f_badge, fill=(140, 140, 160, 255))

    # Right side: Visual mock preview cards
    draw_rounded_card(draw, (820, 60, 1340, 500), 20, (16, 16, 20, 255), outline=(45, 45, 55, 255), width=2)
    
    # Mini cards inside right preview
    tools = [
        ("01", "Font Finder Inspector", "Typography & CSS metrics", "Aa"),
        ("02", "Pixel Color Picker", "Screen eyedropper & palette", "HEX"),
        ("03", "CSS & Tailwind Picker", "DOM box-model & styles", "</>"),
        ("04", "Smart Dark Mode", "Intelligent website theme forcer", "☼/☽"),
        ("05", "YT Music Switcher", "Instant timeline audio redirect", "▶||"),
    ]
    cy = 90
    for num, name, sub, symbol in tools:
        draw_rounded_card(draw, (850, cy, 1310, cy + 68), 12, (24, 24, 30, 255), outline=(42, 42, 52, 255), width=1)
        # Symbol icon circle
        draw.ellipse([868, cy + 14, 908, cy + 54], fill=(36, 36, 46, 255), outline=(60, 60, 75, 255))
        draw.text((875, cy + 24), symbol, font=f_badge, fill=(255, 255, 255, 255))
        
        draw.text((924, cy + 14), name, font=get_font(15, "Bold"), fill=(255, 255, 255, 255))
        draw.text((924, cy + 38), sub, font=get_font(12, "Regular"), fill=(150, 150, 165, 255))
        
        # Pinned badge
        draw_rounded_card(draw, (1230, cy + 22, 1290, cy + 46), 6, (36, 36, 46, 255))
        draw.text((1242, cy + 27), "PINNED", font=get_font(9, "Bold"), fill=(200, 200, 220, 255))
        cy += 78

    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.size[0]}x{img.size[1]})")


def create_screenshot_card(output_path: str, title: str, subtitle: str, badge: str, bullet_items: list, preview_type: str):
    """1280x800 Store Screenshot Showcase Card."""
    w, h = 1280, 800
    img = Image.new("RGBA", (w, h), (10, 10, 12, 255))
    draw = ImageDraw.Draw(img)

    # Grid background
    for i in range(0, w, 50):
        draw.line([(i, 0), (i, h)], fill=(18, 18, 22, 255), width=1)
    for j in range(0, h, 50):
        draw.line([(0, j), (w, j)], fill=(18, 18, 22, 255), width=1)

    # Header banner
    f_badge = get_font(12, "Bold")
    f_title = get_font(34, "Bold")
    f_sub = get_font(16, "Regular")

    # Header card
    draw_rounded_card(draw, (60, 40, w - 60, 160), 16, (18, 18, 22, 255), outline=(42, 42, 50, 255), width=2)
    
    # Badge
    draw_rounded_card(draw, (90, 60, 280, 86), 6, (32, 32, 42, 255), outline=(65, 65, 80, 255), width=1)
    draw.text((102, 65), badge.upper(), font=f_badge, fill=(220, 220, 240, 255))

    draw.text((90, 96), title, font=f_title, fill=(255, 255, 255, 255))
    draw.text((580, 104), subtitle, font=f_sub, fill=(160, 160, 175, 255))

    # Left features panel
    draw_rounded_card(draw, (60, 180, 480, 740), 16, (18, 18, 22, 255), outline=(42, 42, 50, 255), width=2)
    draw.text((90, 210), "KEY CAPABILITIES", font=f_badge, fill=(180, 180, 200, 255))

    y = 260
    for bullet in bullet_items:
        draw_rounded_card(draw, (85, y, 455, y + 64), 10, (24, 24, 30, 255), outline=(38, 38, 48, 255), width=1)
        draw.text((100, y + 14), bullet[0], font=get_font(14, "Bold"), fill=(255, 255, 255, 255))
        draw.text((100, y + 36), bullet[1], font=get_font(12, "Regular"), fill=(150, 150, 165, 255))
        y += 76

    # Bottom summary tag
    draw_rounded_card(draw, (85, 660, 455, 710), 10, (28, 28, 36, 255), outline=(50, 50, 65, 255), width=1)
    draw.text((100, 676), "⚡ 100% Client-Side • Instant Response", font=f_badge, fill=(220, 220, 240, 255))

    # Right preview mockup card
    draw_rounded_card(draw, (510, 180, w - 60, 740), 16, (15, 15, 18, 255), outline=(42, 42, 50, 255), width=2)

    # Render mockup contents based on preview_type
    if preview_type == "hub":
        # Render Extension Hub popup interface preview
        draw_rounded_card(draw, (550, 210, 1180, 710), 14, (20, 20, 25, 255), outline=(50, 50, 62, 255), width=1)
        # Hub header
        draw.text((580, 235), "Extension Hub", font=get_font(20, "Bold"), fill=(255, 255, 255, 255))
        draw.text((580, 265), "Modular Micro-Extension Launcher", font=get_font(12, "Regular"), fill=(150, 150, 165, 255))

        # Search bar
        draw_rounded_card(draw, (580, 300, 1150, 340), 8, (28, 28, 35, 255), outline=(55, 55, 68, 255), width=1)
        draw.text((600, 312), "🔍  Search micro-extensions...", font=get_font(12, "Regular"), fill=(120, 120, 135, 255))

        # Grid of cards
        cards = [
            ("Font Finder", "Typography Inspector", "Active"),
            ("Pixel Color Picker", "EyeDropper & Palette", "Active"),
            ("CSS & Tailwind Picker", "Box Model Inspector", "Active"),
            ("YouTube Music Switcher", "Timeline Audio Redirect", "Running"),
            ("Force Dark Mode", "Universal Contrast Theme", "Enabled"),
            ("HTML to Figma Importer", "Vector Canvas Importer", "Active"),
        ]
        gx, gy = 580, 360
        for i, (cn, cd, cs) in enumerate(cards):
            col = i % 2
            row = i // 2
            bx = gx + col * 290
            by = gy + row * 105
            draw_rounded_card(draw, (bx, by, bx + 275, by + 90), 10, (26, 26, 32, 255), outline=(45, 45, 56, 255), width=1)
            draw.text((bx + 16, by + 14), cn, font=get_font(13, "Bold"), fill=(255, 255, 255, 255))
            draw.text((bx + 16, by + 36), cd, font=get_font(11, "Regular"), fill=(150, 150, 165, 255))
            draw_rounded_card(draw, (bx + 16, by + 60, bx + 70, by + 78), 4, (35, 35, 45, 255))
            draw.text((bx + 24, by + 64), cs, font=get_font(9, "Bold"), fill=(200, 200, 220, 255))

    elif preview_type == "ytmusic":
        # YouTube player timeline switch mockup
        draw_rounded_card(draw, (550, 210, 1180, 710), 14, (18, 18, 22, 255), outline=(50, 50, 62, 255), width=1)
        # Mock YouTube Player Screen
        draw_rounded_card(draw, (580, 240, 1150, 560), 10, (12, 12, 14, 255), outline=(35, 35, 42, 255), width=1)
        draw.text((610, 270), "YouTube Video Player", font=get_font(16, "Bold"), fill=(200, 200, 210, 255))
        draw.text((610, 300), "Now Playing: lofi hip hop radio - beats to relax/study to", font=get_font(13, "Regular"), fill=(140, 140, 155, 255))

        # Big timeline bar
        draw.line([(610, 510), (1120, 510)], fill=(60, 60, 70, 255), width=4)
        draw.line([(610, 510), (840, 510)], fill=(255, 0, 0, 255), width=4)
        draw.ellipse([836, 506, 846, 516], fill=(255, 255, 255, 255))

        # Controls bar with YouTube Music Switch button highlighted
        draw_rounded_card(draw, (610, 524, 1120, 550), 4, (22, 22, 26, 255))
        draw.text((620, 530), "▶  ||  🔊  04:12 / 12:45", font=get_font(11, "Regular"), fill=(180, 180, 190, 255))

        # Injected YT Music button callout
        draw_rounded_card(draw, (980, 526, 1110, 548), 4, (255, 0, 0, 255))
        draw.text((990, 531), "♫ Switch to YT Music", font=get_font(10, "Bold"), fill=(255, 255, 255, 255))

        # Feature highlight box below player
        draw_rounded_card(draw, (580, 580, 1150, 680), 10, (26, 26, 34, 255), outline=(60, 60, 75, 255), width=1)
        draw.text((600, 595), "✓ Preserved Timestamp (&t=252s)", font=get_font(13, "Bold"), fill=(255, 255, 255, 255))
        draw.text((600, 620), "✓ Playlist Queue & Shorts Support", font=get_font(13, "Bold"), fill=(255, 255, 255, 255))
        draw.text((600, 645), "✓ Keyboard Shortcut: Shift + M", font=get_font(13, "Bold"), fill=(220, 220, 240, 255))

    elif preview_type == "devtools":
        # DevTools inspection preview
        draw_rounded_card(draw, (550, 210, 1180, 710), 14, (18, 18, 22, 255), outline=(50, 50, 62, 255), width=1)
        
        # Font Finder Card
        draw_rounded_card(draw, (580, 240, 850, 450), 10, (24, 24, 30, 255), outline=(48, 48, 60, 255), width=1)
        draw.text((600, 260), "Font Finder Inspector", font=get_font(14, "Bold"), fill=(255, 255, 255, 255))
        draw.text((600, 290), "Font: Inter, sans-serif", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw.text((600, 315), "Weight: 700 (Bold)", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw.text((600, 340), "Size: 32px | Line-Height: 40px", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw.text((600, 365), "Color: #FFFFFF", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw_rounded_card(draw, (600, 400, 740, 430), 6, (36, 36, 48, 255))
        draw.text((615, 408), "Copy CSS Snippet", font=get_font(10, "Bold"), fill=(220, 220, 240, 255))

        # Color Picker Card
        draw_rounded_card(draw, (870, 240, 1150, 450), 10, (24, 24, 30, 255), outline=(48, 48, 60, 255), width=1)
        draw.text((890, 260), "Pixel Color Picker", font=get_font(14, "Bold"), fill=(255, 255, 255, 255))
        # Color swatch
        draw_rounded_card(draw, (890, 290, 950, 350), 8, (66, 133, 244, 255))
        draw.text((970, 295), "HEX: #4285F4", font=get_font(12, "Bold"), fill=(255, 255, 255, 255))
        draw.text((970, 320), "RGB: 66, 133, 244", font=get_font(11, "Regular"), fill=(170, 170, 185, 255))
        draw.text((970, 340), "HSL: 217°, 89%, 61%", font=get_font(11, "Regular"), fill=(170, 170, 185, 255))
        draw_rounded_card(draw, (890, 380, 1040, 420), 6, (36, 36, 48, 255))
        draw.text((905, 392), "Add to Saved Palette", font=get_font(10, "Bold"), fill=(220, 220, 240, 255))

        # Smart Dark Mode Card
        draw_rounded_card(draw, (580, 480, 1150, 680), 10, (24, 24, 30, 255), outline=(48, 48, 60, 255), width=1)
        draw.text((600, 505), "Smart Dark & Light Mode Forcer", font=get_font(14, "Bold"), fill=(255, 255, 255, 255))
        draw.text((600, 535), "• High-contrast intelligent inversion on any web page", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw.text((600, 560), "• Media protection preserving photos, videos, and graphics", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw.text((600, 585), "• Presets: High Contrast Dark, Soft Charcoal, Light Invert, Night Warm", font=get_font(12, "Regular"), fill=(170, 170, 185, 255))
        draw_rounded_card(draw, (600, 620, 780, 655), 6, (36, 36, 48, 255))
        draw.text((620, 630), "Apply Globally / Per-Site", font=get_font(11, "Bold"), fill=(220, 220, 240, 255))

    img.save(output_path, "PNG")
    print(f"Created: {output_path} ({img.size[0]}x{img.size[1]})")


def main():
    out_dir = "store-assets"
    os.makedirs(out_dir, exist_ok=True)
    print(f"Generating Chrome Web Store Graphic Assets in '{out_dir}/'...")

    # 1. Store Icon (128x128 PNG)
    create_store_icon(os.path.join(out_dir, "icon-128x128.png"))

    # 2. Small Promo Tile (440x280 PNG)
    create_small_promo_tile(os.path.join(out_dir, "small-promo-tile-440x280.png"))

    # 3. Marquee Promo Tile (1400x560 PNG)
    create_marquee_promo_tile(os.path.join(out_dir, "marquee-promo-tile-1400x560.png"))

    # 4. Screenshot 1: Hub Catalog & Launcher (1280x800 PNG)
    create_screenshot_card(
        output_path=os.path.join(out_dir, "screenshot-1-hub-1280x800.png"),
        title="Modular Extension Hub",
        subtitle="Curated suite of high-performance micro-extensions in one unified popup",
        badge="Unified Launcher",
        bullet_items=[
            ("Pin Your Favorite Tools", "Pin top 2, 5, 10+ extensions for 1-click access"),
            ("Filter & Search Catalog", "Instant lookup by category, name, or keywords"),
            ("Lightweight & Fast", "Zero background lag, pure Manifest V3"),
            ("Customizable Sorting", "Sort by stars, likes, or alphabetical index"),
        ],
        preview_type="hub"
    )

    # 5. Screenshot 2: YouTube to YT Music Switcher (1280x800 PNG)
    create_screenshot_card(
        output_path=os.path.join(out_dir, "screenshot-2-ytmusic-1280x800.png"),
        title="YouTube to YT Music Switcher",
        subtitle="Switch from YouTube video to YouTube Music with preserved playback timestamps",
        badge="YouTube Switcher",
        bullet_items=[
            ("Native Player Timeline Button", "Injects cleanly into video player controls"),
            ("Timestamp & Playlist Sync", "Carries current song second (&t=...s) and playlist ID"),
            ("YouTube Shorts Support", "Works across regular videos and Shorts players"),
            ("Hotkey Quick-Switch", "Press Shift+M to jump straight to YouTube Music"),
        ],
        preview_type="ytmusic"
    )

    # 6. Screenshot 3: Developer & Inspection Tools (1280x800 PNG)
    create_screenshot_card(
        output_path=os.path.join(out_dir, "screenshot-3-devtools-1280x800.png"),
        title="Interactive Inspection Suite",
        subtitle="Typography inspector, precision color picker, and dark mode forcer",
        badge="Developer Tools",
        bullet_items=[
            ("Font Finder Inspector", "Hover any text to reveal font family, size & CSS snippets"),
            ("Pixel Color EyeDropper", "Sample screen pixels & save palettes in HEX/RGB/HSL"),
            ("Universal Dark Mode", "Smart inversion with photo and video protection"),
            ("HTML to Figma Importer", "Copy vector elements directly to clipboard"),
        ],
        preview_type="devtools"
    )

    print("\nAll Chrome Web Store assets generated successfully!")


if __name__ == "__main__":
    main()
