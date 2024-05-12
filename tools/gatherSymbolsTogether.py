##############################################
## This is a script to convert all ETCS symbols to PNG format and put them in a single folder.
## 2024
##############################################

import os
import removeBgBatch

input_folder = input("Enter the symbols folder of ETCS specs (/symbols/): ")
output_folder = input("Enter the output folder: ")

# mkdir output folder
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# iterate over all folders in the input folder
for folder in os.listdir(input_folder):
    if not os.path.isdir(os.path.join(input_folder, folder)):
        continue
    removeBgBatch.convert_bmp_to_png(os.path.join(input_folder, folder), output_folder)