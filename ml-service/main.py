import io
import os
from functools import lru_cache

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from transformers import AutoImageProcessor, AutoModelForImageClassification

MODEL_ID = "mesabo/agri-plant-disease-resnet50"
MAX_IMAGE_BYTES = 10 * 1024 * 1024

app = FastAPI(title="AgriShield Leaf Disease Classifier")
allowed_origins = os.getenv(
    "LEAF_MODEL_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@lru_cache(maxsize=1)
def load_model():
    processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
    model.eval()
    return processor, model


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a supported image file.")

    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller.")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=400, detail="Could not read this image file.") from error

    processor, model = load_model()
    inputs = processor(images=image, return_tensors="pt")
    with torch.inference_mode():
        probabilities = torch.softmax(model(**inputs).logits[0], dim=-1)
    scores, indices = torch.topk(probabilities, k=min(5, probabilities.numel()))
    predictions = [
        {
            "label": model.config.id2label[int(index)],
            "score": round(float(score), 6),
        }
        for score, index in zip(scores, indices)
    ]
    return {
        "model": MODEL_ID,
        "predictedLabel": predictions[0]["label"],
        "confidence": predictions[0]["score"],
        "predictions": predictions,
    }
