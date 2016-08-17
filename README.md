# photobooth
Simple Photo Booth application to take a picture with DSLR on Mac.

Front end will attempt to take a picture when any key is pressed and currently calls a custom applescript app to take a picture using a connected DSLR camera and respond via url hash the photo path of the image that was saved.

Setting parameters for url:
zoom  (zoom=1) - values 1-5 available. Zoom in our out to align video preview with camera zoom.
timing (timing=300) - milisecond value to delay the camera taking a picture. Useful for aligning the screen flash with camera shutter.
