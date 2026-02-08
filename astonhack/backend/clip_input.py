import os
import torch
import matplotlib.pyplot as plt
from PIL import Image
from pathlib import Path
import numpy as np
import clip
from io import BytesIO
import requests
from database import get_firestore
#import db

def debug_collection_fields(collection_name: str, required_fields: list[str], limit: int | None = None):
    print(f"\n=== DEBUG {collection_name} required={required_fields} ===")
    docs = db.collection(collection_name).stream()
    total = 0
    bad = 0

    for d in docs:
        total += 1
        data = d.to_dict() or {}

        missing = [k for k in required_fields if not data.get(k)]
        if missing:
            bad += 1
            print(f"\n[Missing] {collection_name}/{d.id}")
            print("  missing:", missing)
            print("  keys:", sorted(list(data.keys())))
            # show a few suspect values
            for k in required_fields:
                print(f"  {k} =", repr(data.get(k))[:200])

        if limit and total >= limit:
            break

    print(f"\n=== SUMMARY {collection_name}: total={total}, bad={bad} ===")


db = get_firestore()

def pil_from_url(url: str) -> Image.Image:
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return Image.open(BytesIO(r.content)).convert("RGB")

def fetch_lost_items():
    print('fetching items')
    docs = db.collection("lostItems").stream()
    items = []
    for d in docs:
        data = d.to_dict()
        items.append({"id": d.id, **data})
    return items

def fetch_found_items():
    docs = db.collection("foundItems").stream()
    items = []
    for d in docs:
        data = d.to_dict()
        items.append({"id": d.id, **data})
    return items


def match_img(image_url):
    print('Torch version', torch.__version__)
    print(clip.available_models())

    model, preprocess = clip.load('ViT-B/32')
    input_resolution = model.visual.input_resolution
    context_length = model.context_length
    vocab_size = model.vocab_size
    
    print('Model parameters;', f'{np.sum([int(np.prod(p.shape)) for p in model.parameters()]):,}')
    print('Input resolution', input_resolution)
    print('Context_length', context_length)
    print('Vocab_size', vocab_size)

    descriptions = []
    ids = []
    lost_items = fetch_lost_items()
    for item in lost_items:
        print(item["id"], item.get("description"))
        ids.append(item["id"])
        descriptions.append(item.get("description"))

    image = pil_from_url(image_url)
    img_tensor = preprocess(image).unsqueeze(0)
    text_tokens = clip.tokenize(descriptions)

    with torch.no_grad():
        image_features = model.encode_image(img_tensor).float()
        text_features = model.encode_text(text_tokens).float()
    
    #now normalise the vectors
    image_features /=  image_features.norm(dim = -1, keepdim=True)
    text_features /=  text_features.norm(dim = -1, keepdim=True)

    similarity = text_features.cpu().numpy() @ image_features.cpu().numpy().T


    similarities = []

    for x in range(similarity.shape[0]):
        similarities.append({
        "candidate_id": ids[x],          
        "text": descriptions[x],              
        "clip_score": float(similarity[x, 0]),
    })

    print(similarities)
    sorted_sim = sorted(similarities, key=lambda d: d["clip_score"], reverse=True)[:3]
    print(sorted_sim)
    return sorted_sim


def match_text(description):
    print('Torch version', torch.__version__)
    print(clip.available_models())

    model, preprocess = clip.load('ViT-B/32')
    input_resolution = model.visual.input_resolution
    context_length = model.context_length
    vocab_size = model.vocab_size
    
    print('Model parameters;', f'{np.sum([int(np.prod(p.shape)) for p in model.parameters()]):,}')
    print('Input resolution', input_resolution)
    print('Context_length', context_length)
    print('Vocab_size', vocab_size)

    images = []
    image_names = []
    ids = []

    images_original = []

    debug_collection_fields("foundItems", ["imageUrl", "name", "userId"])
    debug_collection_fields("lostItems", ["description", "name", "color", "time", "userId"])

    found_items = fetch_found_items()
    for item in found_items:
        print(item["id"], item.get("name"))
        images.append(preprocess(pil_from_url(item.get('imageUrl'))))
        ids.append(item["id"])
        image_names.append(item.get('name'))
        images_original.append(pil_from_url(item.get('imageUrl')))

    image_input = torch.tensor(np.stack(images))
    text_tokens = clip.tokenize([description])

    print(image_input.shape)
    print(text_tokens.shape) 

    with torch.no_grad():
        image_features = model.encode_image(image_input).float()
        text_features = model.encode_text(text_tokens).float()

    #the shapes must match
    print(image_features.shape)
    print(text_features.shape)
    
    #now normalise the vectors
    image_features /=  image_features.norm(dim = -1, keepdim=True)
    text_features /=  text_features.norm(dim = -1, keepdim=True)

    similarity = text_features.cpu().numpy() @ image_features.cpu().numpy().T

    #(4,4)
    print(similarity.shape)

    similarities = []

    for x in range(similarity.shape[1]):
        similarities.append({
        "candidate_id": ids[x],          
        "image_names": image_names[x],              
        "clip_score": float(similarity[0, x]),
    })

    print(similarities)
    sorted_sim = sorted(similarities, key=lambda d: d["clip_score"], reverse=True)[:3]
    print(sorted_sim)
    return sorted_sim

    

    




