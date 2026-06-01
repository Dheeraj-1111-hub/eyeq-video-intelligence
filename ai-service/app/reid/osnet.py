import torch
import torchvision.transforms as T
import torchreid
from PIL import Image
import numpy as np

# Load OSNet model pretrained on market1501
print("Loading OSNet ReID Model...")
# Use osnet_x1_0 pretrained on market1501. 
# num_classes doesn't matter since we just extract features.
try:
    model = torchreid.models.build_model(
        name='osnet_x1_0',
        num_classes=1000,
        loss='softmax',
        pretrained=True
    )
    # The build_model(pretrained=True) call already automatically downloads and loads weights
    model.eval()
    
    # Check if GPU is available
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    print(f"OSNet loaded successfully on {device}.")
except Exception as e:
    print(f"Error loading OSNet: {e}")
    # Fallback to untrained model if download fails, just so API doesn't crash completely.
    model = None


# Define standard ReID transforms (Resize to 256x128, normalize)
transform = T.Compose([
    T.Resize((256, 128)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def extract_person_embedding(image: Image.Image) -> list[float]:
    """
    Takes a PIL Image (cropped person), passes it through OSNet, 
    and returns a normalized 1D embedding list.
    """
    if model is None:
        return []
        
    try:
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Transform and add batch dimension
        img_t = transform(image).unsqueeze(0)
        img_t = img_t.to(device)
        
        # Extract features
        with torch.no_grad():
            features = model(img_t)
            
        # OSNet returns a 512-dim feature vector. 
        # Normalize it for Cosine Similarity.
        features = torch.nn.functional.normalize(features, p=2, dim=1)
        
        # Convert to python list
        embedding = features.cpu().numpy()[0].tolist()
        return embedding
    except Exception as e:
        print(f"Failed to extract person embedding: {e}")
        return []

