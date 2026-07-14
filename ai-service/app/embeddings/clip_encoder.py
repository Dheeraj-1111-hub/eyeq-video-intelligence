import os
import torch
from PIL import Image
import clip

class CLIPEncoder:
    """Singleton wrapper for the CLIP model using OpenAI's native library."""
    _instance = None
    _model = None
    _preprocess = None
    _device = "cpu"

    def __new__(cls):
        if cls._instance is None:
            print("[AI] Initializing CLIPEncoder via OpenAI CLIP...")
            cls._instance = super(CLIPEncoder, cls).__new__(cls)
            cls._device = "cuda" if torch.cuda.is_available() else "cpu"
            cls._model, cls._preprocess = clip.load("ViT-B/32", device=cls._device)
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
        
        image_input = self._preprocess(pil_image).unsqueeze(0).to(self._device)
        with torch.no_grad():
            image_features = self._model.encode_image(image_input)
            # Normalize to match SentenceTransformer behavior if needed, but original code just tolist()
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
        return image_features.cpu().numpy()[0].tolist()

    def encode_text(self, text: str):
        """
        Encode text query to a 512D vector.
        """
        text_input = clip.tokenize([text]).to(self._device)
        with torch.no_grad():
            text_features = self._model.encode_text(text_input)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
        return text_features.cpu().numpy()[0].tolist()
