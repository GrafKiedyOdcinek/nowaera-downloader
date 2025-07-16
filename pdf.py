import os
from PIL import Image
import img2pdf

input_folder = r'C:\Users'
output_folder = r'C:\Users'
output_pdf = os.path.join(input_folder, 'podrecznik.pdf')

os.makedirs(output_folder, exist_ok=True)

max_width = 1500
max_height = 2100
jpeg_quality = 75
valid_extensions = '.png'


def resize_and_compress_image(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGB")

    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

    img.save(output_path, format='JPEG', quality=jpeg_quality, optimize=True)


compressed_images = []
for filename in sorted(os.listdir(input_folder)):
    if filename.lower().endswith(valid_extensions):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, os.path.splitext(filename)[0] + '.jpg')
        resize_and_compress_image(input_path, output_path)
        compressed_images.append(output_path)

with open(output_pdf, "wb") as f:
    f.write(img2pdf.convert(compressed_images))

print(f"✅ PDF created: {output_pdf}")
