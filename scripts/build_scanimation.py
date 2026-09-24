from pathlib import Path
from math import pi, sin

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/concept/iiiex2026-logo.png"
OUTPUT = ROOT / "public/assets/concept"
SIZE = 1600
FRAME_COUNT = 8
STRIPE = 5
PAPER = (239, 242, 236, 255)
GREEN = (82, 196, 72, 255)


def contain(image: Image.Image, scale: float) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    cropped = alpha.crop(bbox)
    target = int(SIZE * scale)
    cropped.thumbnail((target, target), Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    colored = Image.new("RGBA", cropped.size, GREEN)
    colored.putalpha(cropped)
    layer.alpha_composite(colored, ((SIZE - cropped.width) // 2, (SIZE - cropped.height) // 2))
    return layer


def wave(layer: Image.Image, phase: float, amplitude: float = 42) -> Image.Image:
    warped = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    band = 4
    for y in range(0, SIZE, band):
        shift = int(amplitude * sin((y / SIZE) * pi * 4 + phase))
        strip = layer.crop((0, y, SIZE, min(SIZE, y + band)))
        warped.alpha_composite(strip, (shift, y))
    return warped


source = Image.open(SOURCE).convert("RGBA")
shape_frame = Image.new("RGBA", (SIZE, SIZE), PAPER)
shape_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(shape_layer)
draw.ellipse((332, 668, 640, 976), fill=GREEN)
draw.ellipse((980, 654, 1134, 808), fill=GREEN)
draw.ellipse((1194, 420, 1348, 574), fill=GREEN)
draw.polygon(((1244, 922), (1392, 1070), (1244, 1218), (1096, 1070)), fill=GREEN)
shape_frame.alpha_composite(shape_layer)

frames = []
for index in range(FRAME_COUNT):
    phase = index / FRAME_COUNT * pi * 2
    progress = index / (FRAME_COUNT - 1)
    eased = progress * progress * (3 - 2 * progress)
    pulse = 0.77 - 0.05 * eased + 0.018 * sin(phase)
    logo = contain(source, pulse)
    logo = wave(logo, phase)
    angle = 2.4 * sin(phase)
    logo = logo.rotate(angle, Image.Resampling.BICUBIC, center=(SIZE // 2, SIZE // 2))
    offset_y = int(18 * sin(phase + pi / 2))
    logo_frame = Image.new("RGBA", (SIZE, SIZE), PAPER)
    logo_frame.alpha_composite(logo, (0, offset_y))
    frame = Image.blend(logo_frame, shape_frame, eased)
    frames.append(frame)

composite = Image.new("RGBA", (SIZE, SIZE), PAPER)
for y in range(0, SIZE, STRIPE):
    frame_index = (y // STRIPE) % FRAME_COUNT
    strip = frames[frame_index].crop((0, y, SIZE, min(SIZE, y + STRIPE)))
    composite.alpha_composite(strip, (0, y))

cycle = FRAME_COUNT * STRIPE
mask = Image.new("RGBA", (SIZE, SIZE + cycle * 2), PAPER)
pixels = mask.load()
for y in range(mask.height):
    if y % cycle < STRIPE:
        for x in range(SIZE):
            pixels[x, y] = (239, 242, 236, 0)

composite.save(OUTPUT / "logo-scanimation-composite.png", optimize=True)
mask.save(OUTPUT / "logo-scanimation-mask.png", optimize=True)
frames[0].save(OUTPUT / "logo-scanimation-readable.png", optimize=True)

print(OUTPUT / "logo-scanimation-composite.png")
print(OUTPUT / "logo-scanimation-mask.png")
