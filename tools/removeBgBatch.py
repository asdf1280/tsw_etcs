##############################################
## Batch script of removeSymbolBackground.py
## 2024
##############################################

import os
from PIL import Image

def colorDistance(color1, color2):
    return abs(color1[0] - color2[0]) + abs(color1[1] - color2[1]) + abs(color1[2] - color2[2])

def convert_bmp_to_png(input_folder, output_folder):
    # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Iterate over all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".bmp"):
            # Open the BMP file
            img = Image.open(os.path.join(input_folder, filename))

            # Convert the image to RGBA
            img = img.convert("RGBA")

            # Get the pixel data
            pixels = img.load()

            # Make specified pixels transparent
            for i in range(img.size[0]):
                for j in range(img.size[1]):
                    if colorDistance(pixels[i, j], (0x05, 0x11, 0x21)) < 10:
                        pixels[i, j] = (0, 0, 0, 0)

            # Save the image as PNG in the output folder
            img.save(os.path.join(output_folder, os.path.splitext(filename)[0] + ".png"))

# main
if __name__ == "__main__":
    # Ask for input and output folders
    input_folder = input("Enter the input folder: ")
    output_folder = input("Enter the output folder: ")

    # Convert BMP to PNG
    convert_bmp_to_png(input_folder, output_folder)
