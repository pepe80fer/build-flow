"""One-off script to generate all app icon/splash assets from the source
logo (f:\\Downloads\\log_build-flow.png) for build-flow / "Casa Huila Ma".
Not part of the app build — run manually, then delete or keep for reference.
"""

from PIL import Image

SOURCE = r"F:\Downloads\log_build-flow.png"
BACKGROUND_COLOR = (230, 244, 254, 255)  # #E6F4FE, matches app.json adaptiveIcon.backgroundColor
OUT_DIR = "assets/images"


def load_trimmed_logo():
    img = Image.open(SOURCE).convert("RGBA")
    bbox = img.getbbox()
    return img.crop(bbox)


def centered_canvas(logo, canvas_size, scale, background=None):
    canvas = Image.new("RGBA", (canvas_size, canvas_size), background or (0, 0, 0, 0))
    target = int(canvas_size * scale)
    ratio = min(target / logo.width, target / logo.height)
    resized = logo.resize((int(logo.width * ratio), int(logo.height * ratio)), Image.LANCZOS)
    x = (canvas_size - resized.width) // 2
    y = (canvas_size - resized.height) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def to_white_silhouette(logo):
    alpha = logo.split()[3]
    white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    return white


def main():
    logo = load_trimmed_logo()

    # icon.png: general/Play Store icon, opaque background, ~72% fill.
    icon = centered_canvas(logo, 1024, 0.72, background=BACKGROUND_COLOR)
    icon.convert("RGB").save(f"{OUT_DIR}/icon.png")

    # Android adaptive icon foreground: transparent bg, ~62% fill (safe zone).
    foreground = centered_canvas(logo, 1024, 0.62)
    foreground.save(f"{OUT_DIR}/android-icon-foreground.png")

    # Android 13+ monochrome/themed icon: white silhouette, same layout as foreground.
    monochrome = to_white_silhouette(centered_canvas(logo, 1024, 0.62))
    monochrome.save(f"{OUT_DIR}/android-icon-monochrome.png")

    # Splash screen icon: transparent bg, generous fill (no mask clipping here).
    splash = centered_canvas(logo, 512, 0.82)
    splash.save(f"{OUT_DIR}/splash-icon.png")

    print("Done: icon.png, android-icon-foreground.png, android-icon-monochrome.png, splash-icon.png")


if __name__ == "__main__":
    main()
