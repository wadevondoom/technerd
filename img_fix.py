from PIL import Image
import os

# Set the path to the folder containing the JPEG images
folder_path = r"D:\code\auth0-example\static\media\upload"

# Loop through all the files in the folder
for filename in os.listdir(folder_path):
    # Check if the file is a JPEG image
    if filename.endswith(".jpg") or filename.endswith(".jpeg"):
        # Open the image file using Pillow
        image = Image.open(os.path.join(folder_path, filename))
        
        # Convert the image to 50% quality
        image.save(os.path.join(folder_path, filename), quality=50)
