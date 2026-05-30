import os
from sentence_transformers import SentenceTransformer
from PIL import Image

class CLIPEncoder:
    """Singleton wrapper for the CLIP model."""
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            print("[AI] Initializing CLIPEncoder...")
            cls._instance = super(CLIPEncoder, cls).__new__(cls)
            # Use sentence-transformers' clip-ViT-B-32 wrapper
            cls._model = SentenceTransformer('clip-ViT-B-32')
            print("[AI] CLIPEncoder ready.")
        return cls._instance

    def encode_image(self, image_array):
        """
        Encode a numpy image array (from OpenCV) to a 512D vector.
        Expects BGR or RGB array, converts to PIL Image.
        """
        import cv2
        # Convert BGR to RGB for PIL
        rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        # return list of floats
        return self._model.encode(pil_image).tolist()

    def encode_text(self, text: str):
        """
        Encode text query to a 512D vector.
        """
        return self._model.encode([text])[0].tolist()
