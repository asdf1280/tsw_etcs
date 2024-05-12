##############################################
## This script is used to remove the dark blue background from the symbol images in ETCS specification and convert them to PNG format.
## 2024
##############################################

from PIL import Image

filename = input("Enter the filename: ")

# Open the BMP file
img = Image.open(f"{filename}.bmp")

# Convert the image to RGBA
img = img.convert("RGBA")

# Get the pixel data
pixels = img.load()

def colorDistance(color1, color2):
    return abs(color1[0] - color2[0]) + abs(color1[1] - color2[1]) + abs(color1[2] - color2[2])

# Make specified pixels transparent
for i in range(img.size[0]):
    for j in range(img.size[1]):
        if colorDistance(pixels[i, j], (0x05, 0x11, 0x21)) < 10:
            pixels[i, j] = (0, 0, 0, 0)

# Save the image as PNG
img.save(f"{filename}.png")