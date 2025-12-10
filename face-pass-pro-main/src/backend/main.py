# ==========================================
# Face Recognition Attendance System - Backend
# ==========================================
# 
# IMPORTANT: This Python backend cannot run in Lovable.
# Deploy this separately on Railway, Render, or your own server.
# 
# Requirements:
# pip install fastapi uvicorn opencv-python-headless numpy pandas scikit-learn joblib python-multipart
#
# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
# ==========================================

import cv2
import os
import base64
import numpy as np
from datetime import date, datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sklearn.neighbors import KNeighborsClassifier
import pandas as pd
import joblib
import threading

app = FastAPI(title="Face Recognition Attendance System")

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Global Variables (exactly as in original)
# ==========================================
nimgs = 10  # number of images to capture
datetoday = date.today().strftime("%m_%d_%y")
datetoday2 = date.today().strftime("%d-%B-%Y")

# Load Haar cascade for face detection
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Recognition state
recognition_running = False
recognition_thread = None
cap = None

# ==========================================
# Directory Setup (exactly as in original)
# ==========================================
if not os.path.isdir('Attendance'):
    os.makedirs('Attendance')
if not os.path.isdir('static'):
    os.makedirs('static')
if not os.path.isdir('static/faces'):
    os.makedirs('static/faces')

if f'Attendance-{datetoday}.csv' not in os.listdir('Attendance'):
    with open(f'Attendance/Attendance-{datetoday}.csv', 'w') as f:
        f.write('Name,Roll,Time')

# ==========================================
# Core Functions (exactly as in original)
# ==========================================

def totalreg():
    """Returns the total number of registered faces."""
    return len(os.listdir('static/faces'))

def extract_faces(img):
    """Detects faces in the given image and returns their coordinates."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_points = face_detector.detectMultiScale(gray, 1.2, 5, minSize=(20, 20))
    return face_points

def identify_face(facearray):
    """Predicts the identity of a given face using a pre-trained model."""
    model = joblib.load('static/face_recognition_model.pkl')
    return model.predict(facearray)

def train_model():
    """Trains a new face recognition model based on the images in 'static/faces'."""
    faces = []
    labels = []
    userlist = os.listdir('static/faces')
    for user in userlist:
        for imgname in os.listdir(f'static/faces/{user}'):
            img = cv2.imread(f'static/faces/{user}/{imgname}')
            resized_face = cv2.resize(img, (50, 50))
            faces.append(resized_face.ravel())
            labels.append(user)
    
    # Convert the faces list to a NumPy array
    faces = np.array(faces)
    
    # Create a KNN classifier with 5 neighbors
    knn = KNeighborsClassifier(n_neighbors=5)
    
    # Train the KNN classifier
    knn.fit(faces, labels)
    
    # Save the trained KNN classifier
    joblib.dump(knn, 'static/face_recognition_model.pkl')

def extract_attendance():
    """Extracts attendance records from today's CSV file and returns them."""
    df = pd.read_csv(f'Attendance/Attendance-{datetoday}.csv')
    names = df['Name'].tolist()
    rolls = df['Roll'].tolist()
    times = df['Time'].tolist()
    l = len(df)
    return names, rolls, times, l

def add_attendance(name):
    """Adds a new attendance record with the provided name."""
    username = name.split('_')[0]
    userid = name.split('_')[1]
    current_time = datetime.now().strftime("%H:%M:%S")
    
    df = pd.read_csv(f'Attendance/Attendance-{datetoday}.csv')
    if int(userid) not in list(df['Roll']):
        with open(f'Attendance/Attendance-{datetoday}.csv', 'a') as f:
            f.write(f'\n{username},{userid},{current_time}')

def getallusers():
    """Returns a list of all users, their names, and roll numbers."""
    userlist = os.listdir('static/faces')
    names = []
    rolls = []
    l = len(userlist)
    
    for i in userlist:
        name, roll = i.split('_')
        names.append(name)
        rolls.append(roll)
    
    return userlist, names, rolls, l

# ==========================================
# Pydantic Models
# ==========================================

class UserCreate(BaseModel):
    name: str
    roll: str

class ImageCapture(BaseModel):
    name: str
    roll: str
    image: str  # Base64 encoded image

class RecognitionResult(BaseModel):
    identified: bool
    name: Optional[str] = None
    roll: Optional[str] = None
    confidence: Optional[float] = None

# ==========================================
# API Endpoints
# ==========================================

@app.get("/")
async def root():
    return {"message": "Face Recognition Attendance System API", "date": datetoday2}

@app.get("/api/stats")
async def get_stats():
    """Get system statistics."""
    total_users = totalreg()
    _, _, _, attendance_count = extract_attendance()
    model_exists = os.path.exists('static/face_recognition_model.pkl')
    
    return {
        "total_users": total_users,
        "today_attendance": attendance_count,
        "model_trained": model_exists,
        "date": datetoday2
    }

@app.get("/api/users")
async def get_users():
    """Get all registered users."""
    try:
        userlist, names, rolls, count = getallusers()
        users = [{"id": userlist[i], "name": names[i], "roll": rolls[i]} for i in range(count)]
        return {"users": users, "count": count}
    except Exception as e:
        return {"users": [], "count": 0}

@app.post("/api/user")
async def create_user(user: UserCreate):
    """Register a new user (creates folder for images)."""
    username = user.name.strip()
    userid = user.roll.strip()
    
    if not username or not userid:
        raise HTTPException(status_code=400, detail="Name and roll number are required")
    
    userimagefolder = f'static/faces/{username}_{userid}'
    if os.path.isdir(userimagefolder):
        raise HTTPException(status_code=400, detail="User already exists")
    
    os.makedirs(userimagefolder)
    return {"message": "User folder created", "folder": userimagefolder}

@app.post("/api/capture")
async def capture_image(data: ImageCapture):
    """Capture and save a face image for training."""
    username = data.name.strip()
    userid = data.roll.strip()
    
    userimagefolder = f'static/faces/{username}_{userid}'
    if not os.path.isdir(userimagefolder):
        os.makedirs(userimagefolder)
    
    # Decode base64 image
    try:
        image_data = base64.b64decode(data.image.split(',')[1] if ',' in data.image else data.image)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    
    # Detect faces
    faces = extract_faces(frame)
    if len(faces) == 0:
        return {"success": False, "message": "No face detected", "captured": 0}
    
    # Save the face image
    (x, y, w, h) = faces[0]
    face_img = frame[y:y+h, x:x+w]
    
    # Count existing images
    existing_images = len(os.listdir(userimagefolder))
    if existing_images >= nimgs:
        return {"success": True, "message": "Already captured enough images", "captured": existing_images}
    
    # Save image
    img_name = f'{username}_{existing_images}.jpg'
    cv2.imwrite(f'{userimagefolder}/{img_name}', face_img)
    
    return {
        "success": True,
        "message": f"Image {existing_images + 1}/{nimgs} captured",
        "captured": existing_images + 1,
        "total_required": nimgs,
        "face_coords": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    }

@app.post("/api/train")
async def train():
    """Train the face recognition model."""
    if totalreg() == 0:
        raise HTTPException(status_code=400, detail="No registered users to train")
    
    try:
        train_model()
        return {"success": True, "message": "Model trained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/api/recognize")
async def recognize_face(data: ImageCapture):
    """Recognize a face from an image."""
    if not os.path.exists('static/face_recognition_model.pkl'):
        raise HTTPException(status_code=400, detail="No trained model found")
    
    # Decode base64 image
    try:
        image_data = base64.b64decode(data.image.split(',')[1] if ',' in data.image else data.image)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    
    # Detect faces
    faces = extract_faces(frame)
    if len(faces) == 0:
        return {"identified": False, "message": "No face detected"}
    
    # Process first face (same as original)
    (x, y, w, h) = faces[0]
    face = cv2.resize(frame[y:y+h, x:x+w], (50, 50))
    
    try:
        identified_person = identify_face(face.reshape(1, -1))[0]
        add_attendance(identified_person)
        
        name, roll = identified_person.split('_')
        return {
            "identified": True,
            "name": name,
            "roll": roll,
            "full_id": identified_person,
            "face_coords": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        }
    except Exception as e:
        return {"identified": False, "message": f"Recognition failed: {str(e)}"}

@app.get("/api/attendance/today")
async def get_today_attendance():
    """Get today's attendance records."""
    try:
        names, rolls, times, count = extract_attendance()
        records = [{"name": names[i], "roll": rolls[i], "time": times[i]} for i in range(count)]
        return {"records": records, "count": count, "date": datetoday2}
    except Exception as e:
        return {"records": [], "count": 0, "date": datetoday2}

@app.delete("/api/user/{user_id}")
async def delete_user(user_id: str):
    """Delete a registered user."""
    import shutil
    user_folder = f'static/faces/{user_id}'
    if not os.path.isdir(user_folder):
        raise HTTPException(status_code=404, detail="User not found")
    
    shutil.rmtree(user_folder)
    
    # Retrain model if users remain
    if totalreg() > 0:
        train_model()
    else:
        # Remove model if no users left
        if os.path.exists('static/face_recognition_model.pkl'):
            os.remove('static/face_recognition_model.pkl')
    
    return {"success": True, "message": "User deleted"}

@app.get("/api/model/status")
async def model_status():
    """Check if a trained model exists."""
    return {
        "trained": os.path.exists('static/face_recognition_model.pkl'),
        "total_users": totalreg()
    }

# ==========================================
# Run Server
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
