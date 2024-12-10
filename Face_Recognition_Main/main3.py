import threading
import cv2
import os
from tkinter import *
from tkinter import messagebox
from datetime import date, datetime
# for numerical computations
import numpy as np
# fro machine learning tasks
from sklearn.neighbors import KNeighborsClassifier
# for data analysis
import pandas as pd
# saving and loading machine learning models
import joblib

# Initialize global variables
nimgs = 10# number of images
imgBackground = cv2.imread("AI_Microsoft_Research_Header_1920x720.png")
datetoday = date.today().strftime("%m_%d_%y")
datetoday2 = date.today().strftime("%d-%B-%Y")

# Load Haar cascade for face detection
face_detector = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

# Ensure directories for storing attendance records and face images exist
if not os.path.isdir('Attendance'):
    os.makedirs('Attendance')
if not os.path.isdir('static'):
    os.makedirs('static')
if not os.path.isdir('static/faces'):
    os.makedirs('static/faces')

if f'Attendance-{datetoday}.csv' not in os.listdir('Attendance'):
    with open(f'Attendance/Attendance-{datetoday}.csv', 'w') as f:
        f.write('Name,Roll,Time')

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
    # faces = np.array(faces)
    # knn = KNeighborsClassifier(n_neighbors=5)
    # knn.fit(faces, labels)
    # joblib.dump(knn, 'static/face_recognition_model.pkl')

    # Convert the faces list to a NumPy array
    # This is necessary because the KNeighborsClassifier expects the input data to be a NumPy array
    faces = np.array(faces)

    # Create a KNN classifier with 5 neighbors
    # The n_neighbors parameter determines how many nearest neighbors to consider when making a prediction
    knn = KNeighborsClassifier(n_neighbors=5)

    # Train the KNN classifier
    # The fit method takes the input data and the target labels as arguments
    knn.fit(faces, labels)

    # Save the trained KNN classifier
    # The joblib.dump function is used to serialize the classifier and save it to a file
    joblib.dump(knn, 'static/face_recognition_model.pkl')

def extract_attendance():
    """Extracts attendance records from today's CSV file and returns them."""
    df = pd.read_csv(f'Attendance/Attendance-{datetoday}.csv')
    names = df['Name']
    rolls = df['Roll']
    times = df['Time']
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

class FaceRecognitionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Face Recognition Attendance System")
        self.root.geometry("600x400")

        #     changes

        self.recognition_running = False
        self.recognition_thread = None
        self.cap = None
        # Create UI elements
        self.create_widgets()

    def create_widgets(self):
        self.lbl_name = Label(self.root, text="Name:")
        self.lbl_name.pack()
        self.ent_name = Entry(self.root)
        self.ent_name.pack()

        self.lbl_roll = Label(self.root, text="Roll Number:")
        self.lbl_roll.pack()
        self.ent_roll = Entry(self.root)
        self.ent_roll.pack()

        self.btn_add = Button(self.root, text="Add User", command=self.add_user)
        self.btn_add.pack()

        self.btn_start = Button(self.root, text="Start Recognition", command=self.start_recognition)
        self.btn_start.pack()

        # changes

        self.btn_stop = Button(self.root, text="Stop Recognition", command=self.stop_recognition)
        self.btn_stop.pack()

        # original

        self.btn_show_attendance = Button(self.root, text="Show Attendance", command=self.show_attendance)
        self.btn_show_attendance.pack()

    def add_user(self):
        username = self.ent_name.get()
        userid = self.ent_roll.get()
        if username and userid:
            userimagefolder = f'static/faces/{username}_{userid}'
            if not os.path.isdir(userimagefolder):
                os.makedirs(userimagefolder)
            i, j = 0, 0
            cap = cv2.VideoCapture(0)
            while True:
                # ret returns the (true/false) if the frames are captured succesfully or not
                ret, frame = cap.read()
                faces = extract_faces(frame)
                for (x, y, w, h) in faces:
                    # (255,0,20) blue color rgb , 2 width of color
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 20), 2)
                    cv2.putText(frame, f'Images Captured: {i}/{nimgs}', (30, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 20), 2, cv2.LINE_AA)
                    if j % 5 == 0:
                        name = f'{username}_{i}.jpg'
                        cv2.imwrite(f'{userimagefolder}/{name}', frame[y:y+h, x:x+w])
                        i += 1
                    j += 1
                if j == nimgs * 5:
                    break
                cv2.imshow('Adding new User', frame)
                if cv2.waitKey(1) == 27:  # Press 'Esc' to exit
                    break
            cap.release()
            cv2.destroyAllWindows()
            print('Training Model')
            train_model()
            messagebox.showinfo("Info", "User added and model trained.")
        else:
            messagebox.showwarning("Input Error", "Please provide both name and roll number.")

    def start_recognition(self):
        if 'face_recognition_model.pkl' not in os.listdir('static'):
            messagebox.showwarning("Model Error", "No trained model found. Please add a user first.")
            return

        # changes

        if self.recognition_running:
            messagebox.showwarning("Recognition Error", "Recognition is already running.")
            return

        self.recognition_running = True
        self.cap = cv2.VideoCapture(0)
        self.recognition_thread = threading.Thread(target=self.recognize_faces)
        self.recognition_thread.start()

    def recognize_faces(self):
        global imgBackground
        while self.recognition_running:
        # original
        # cap = cv2.VideoCapture(0)
        # while True:
            ret, frame = self.cap.read()
            faces = extract_faces(frame)
            if len(faces) > 0:
                (x, y, w, h) = faces[0]
                cv2.rectangle(frame, (x, y), (x+w, y+h), (86, 32, 251), 1)
                cv2.rectangle(frame, (x, y), (x+w, y-40), (86, 32, 251), -1)
                face = cv2.resize(frame[y:y+h, x:x+w], (50, 50))
                identified_person = identify_face(face.reshape(1, -1))[0]
                add_attendance(identified_person)
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 1)
                cv2.rectangle(frame, (x, y), (x+w, y+h), (50, 50, 255), 2)
                cv2.rectangle(frame, (x, y-40), (x+w, y), (50, 50, 255), -1)
                cv2.putText(frame, f'{identified_person}', (x, y-15), cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 1)
                cv2.rectangle(frame, (x, y), (x+w, y+h), (50, 50, 255), 1)
            imgBackground[162:162 + 480, 55:55 + 640] = frame
            cv2.imshow('Attendance', imgBackground)
            if cv2.waitKey(1) == 27:  # Press 'Esc' to exit
                break
        self.cap.release()
        cv2.destroyAllWindows()
        self.recognition_running = False
        # cap.release()
        # cv2.destroyAllWindows()
        # messagebox.showinfo("Info", "Recognition stopped and attendance updated.")

    def stop_recognition(self):
        if not self.recognition_running:
            messagebox.showwarning("Recognition Error", "Recognition is not running.")
            return

        self.recognition_running = False
        if self.cap is not None:
            self.cap.release()
        cv2.destroyAllWindows()
        messagebox.showinfo("Info", "Recognition stopped and camera closed.")

    def show_attendance(self):
        names, rolls, times, l = extract_attendance()
        attendance = "\n".join(f"{name}, {roll}, {time}" for name, roll, time in zip(names, rolls, times))
        messagebox.showinfo("Attendance", f"Total records: {l}\n{attendance}")

if __name__ == "__main__":
    root = Tk()
    app = FaceRecognitionApp(root)
    root.mainloop()
