import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

def init_firebase():
    if not firebase_admin._apps:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not cred_path:
            raise RuntimeError("Set GOOGLE_APPLICATION_CREDENTIALS in .env")

        bucket = os.environ.get("FIREBASE_STORAGE_BUCKET")

        cred = credentials.Certificate(cred_path)
        if bucket:
            firebase_admin.initialize_app(cred, {"storageBucket": bucket})
        else:
            firebase_admin.initialize_app(cred)

def get_firestore():
    init_firebase()
    return firestore.client()
