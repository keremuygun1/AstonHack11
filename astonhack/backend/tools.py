import base64
import numpy as np
import tempfile
import os
import cv2
from pathlib import Path

import mimetypes
import traceback

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

vision_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",          # or "gemini-2.5-pro" for higher accuracy
    temperature=0,
    max_output_tokens=1200,
    api_key=os.getenv("GEMINI_API_KEY"),
)

@tool
def extract_text(img_path: str) -> str:

    "Extracts text from an image specified by its file path. This funciton reads the" \
    "image file, encodes the image data as base64, sends image content to a " \
    "vision-capable language model to extract text, and returns the resulting text" \
    "content." \
    "" \
    ":param img_path: The file path of the image from which text is to be extracted" \
    ":type img_path: str" \
    ":return: Extracted text from the image, or an empty string if an error occurs during the process" \
    ":rtype: str" \
    ":raises Exception: If any error occur during image reading, encoding, or processing the response from the model" \
    
    print("[TOOL] extract_text img_path =", repr(img_path))
    try:
        p = Path(img_path).expanduser()
        if not p.is_file():
            raise ValueError(f"Image not found: {p}")

        # read and base64-encode image
        image_bytes = p.read_bytes()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        # guess MIME for the data URI
        mime, _ = mimetypes.guess_type(p.name)
        mime = mime or "image/png"

        # IMPORTANT: 'text' must be a single string; 'image_url' must be a string (not a dict)
        messages = [
            HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": "Extract all the text from the image. Return ONLY the text, no explanations.",
                    },
                    {
                        "type": "image_url",
                        "image_url": f"data:{mime};base64,{image_b64}",
                    },
                ]
            )
        ]

        resp = vision_llm.invoke(messages)
        return (resp.content or "").strip()

    except Exception as e:
        print("[TOOL] extract_text error:", e)
        traceback.print_exc()
        return ""

#Well documented program is required so that the llm can know how to use it
@tool
def preprocess_image(
    
        img_path: str,
        op: str = "threshold",
        target_width: int = 1600) -> str:
    
    """
        Preprocesses an image for OCR by applying scaling, thresholding, or skew correction.
        Parameters:
            img_path (str): The file path to the image to be processed.
            op (str): The operation to perform on the image. Options are "threshold" for binarization 
                      or "skew" for correcting skewed text. Default is "threshold".
            target_width (int): The target width to which the image will be scaled if it is smaller 
                                than this value. Default is 1600.
        Returns:
            str: The file path to the preprocessed image saved as a PNG.
        Raises:
            ValueError: If the image cannot be found at the specified img_path.
        """
    print("[TOOL] preprocess_image img_path =", repr(img_path))
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError(f"Could not find image at {img_path}")
    
    #Upscale small images to help ocr
    #since our target width is 1600, we upscale any image smaller than 1600px
    if target_width is not None and img.shape[1] < target_width:
        scale = target_width / img.shape[1] #find the scale factor
        img = cv2.resize(img, (int(img.shape[1] * scale), int(img.shape[0] * scale)), interpolation=cv2.INTER_CUBIC) #using cv2's resize feauture, rescale

    #we can improve ocr by converting our images into black and white and high-contrast
    if op == "threshold":
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        #gentle denoise and local binarisation to sharpen text
        gray = cv2.bilateralFilter(gray, 7, 50, 50)
        out = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            10
        )
    
    #Correct skewed text by straightening the image
    elif op == "skew" :
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray =  cv2.bitwise_not(gray)
        #Otsu to find text pixels
        _, bw = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY | cv2.THRESH_OTSU
        )
        #coordinates of text pixels
        coords = np.column_stack(np.where(bw > 0))
        angle = 0.0
        if coords.size > 0:
            rect = cv2.minAreaRect(coords)
            angle = rect[-1]
            #Convert OpenCV's angle convention to proper rotation
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
        #rotate around the centre
        (h, w) = img.shape[:2]
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        out = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    #Ensure 3-channel PNG for the vision model (it accepts grayscale too ,but PNG-3 is universal)
    if out.ndim == 2:
        out = cv2.cvtColor(out, cv2.COLOR_GRAY2BGR)
    
    #Write to a temporary PNG and return the path
    tmpdir = tempfile.gettempdir()
    base = os.path.splitext(os.path.basename(img_path))[0]
    out_path = os.path.join(tmpdir, f"{base}_preprocessed.png")
    cv2.imwrite(out_path, out)
    return out_path


    

    
