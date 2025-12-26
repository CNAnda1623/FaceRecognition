# 👤 Face Recognition Attendance System

A full-stack face recognition–based attendance system that uses **real-time facial detection** to automatically mark attendance. The project combines a **Python backend** for face recognition and attendance processing with a **modern React + TypeScript frontend** for live monitoring and visualization.

This project is built as a **practical, learning-oriented system** that demonstrates how computer vision can be integrated into a real-world web application.

---

## 🌟 Project Overview

The Face Recognition Attendance System eliminates manual attendance marking by identifying registered users through a camera feed and logging their presence automatically. Captured attendance records are stored locally and displayed in a clean, responsive dashboard.

The focus of this project is on:

* Real-time face recognition
* End-to-end data flow (camera → backend → frontend)
* Clear project structure and modular design

There are **no role-based users, admin panels, or security layers** implemented.

---

## ✨ Key Features

### 🎥 Live Face Recognition

* Real-time webcam-based face detection
* Matches faces against registered datasets
* Recognizes users instantly during live feed

### 🧾 Automatic Attendance Logging

* Attendance is marked automatically upon recognition
* Daily attendance stored as CSV / text-based logs
* Prevents duplicate entries for the same session

### 👥 User Registration

* Register new users with face image samples
* Stores multiple face images per user
* Creates structured face datasets for recognition

### 📊 Attendance Dashboard

* View attendance records in tabular format
* Clean, responsive UI built with React
* Quick overview of recognized users and timestamps

### 🧠 Modular Architecture

* Clear separation between backend (CV logic) and frontend (UI)
* Reusable UI components
* Easy to extend with future features

---

## 🛠️ Tech Stack

### Backend

* **Python**
* **OpenCV** – face detection & recognition
* **NumPy**
* **File-based storage** (CSV / text logs)

### Frontend

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **Shadcn/UI components**

### Tooling

* Git & GitHub
* Vite build system

---

## 🏗️ Project Structure (High-Level)

```
face-pass-pro-main/
├── src/
│   ├── backend/
│   │   ├── Attendance/          # Attendance records
│   │   ├── static/
│   │   │   └── faces/            # Registered face images
│   │   ├── main.py               # Face recognition logic
│   │   └── requirements.txt
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── AttendanceTable.tsx
│   │   ├── LiveRecognition.tsx
│   │   ├── RegisterUser.tsx
│   │   └── Header.tsx
│   │
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔁 Application Flow (Simplified)

1. User opens the web interface
2. Webcam starts live recognition
3. Face is matched with stored datasets
4. Attendance is automatically marked
5. Attendance data is displayed on the dashboard

---

## ▶️ Running the Project Locally

### Prerequisites

* Python 3.9+
* Node.js 18+
* Webcam access

### Backend Setup

```bash
cd src/backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
npm install
npm run dev
```

* Frontend: `http://localhost:5173`
* Backend runs locally and handles camera & recognition

---

## ⚠️ Known Limitations

* Local file-based attendance storage
* No authentication or access control
* Recognition accuracy depends on lighting and camera quality
* Not optimized for large-scale datasets

---

## 🧪 Troubleshooting (Optional)

* **Camera not opening**

  * Ensure no other app is using the webcam
  * Grant camera permissions to Python

* **Face not recognized**

  * Add more face samples per user
  * Ensure consistent lighting

* **Attendance not updating**

  * Check Attendance folder write permissions

---

## 🎯 Learning Outcomes

* Practical implementation of face recognition
* Integrating Python CV logic with a modern frontend
* Managing real-time data flows
* Structuring full-stack projects cleanly

---

**Face Recognition Attendance System – Smart Attendance with Computer Vision**
