// API Configuration
// Change this to your deployed Python backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Stats {
  total_users: number;
  today_attendance: number;
  model_trained: boolean;
  date: string;
}

export interface User {
  id: string;
  name: string;
  roll: string;
}

export interface AttendanceRecord {
  name: string;
  roll: string;
  time: string;
}

export interface CaptureResult {
  success: boolean;
  message: string;
  captured: number;
  total_required?: number;
  face_coords?: { x: number; y: number; w: number; h: number };
}

export interface RecognitionResult {
  identified: boolean;
  name?: string;
  roll?: string;
  full_id?: string;
  message?: string;
  face_coords?: { x: number; y: number; w: number; h: number };
}

// API Functions
export const api = {
  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getUsers(): Promise<{ users: User[]; count: number }> {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async createUser(name: string, roll: string): Promise<{ message: string; folder: string }> {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, roll }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create user');
    }
    return response.json();
  },

  async captureImage(name: string, roll: string, imageBase64: string): Promise<CaptureResult> {
    const response = await fetch(`${API_BASE_URL}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, roll, image: imageBase64 }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to capture image');
    }
    return response.json();
  },

  async trainModel(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/train`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to train model');
    }
    return response.json();
  },

  async recognizeFace(name: string, roll: string, imageBase64: string): Promise<RecognitionResult> {
    const response = await fetch(`${API_BASE_URL}/api/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, roll, image: imageBase64 }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to recognize face');
    }
    return response.json();
  },

  async getTodayAttendance(): Promise<{ records: AttendanceRecord[]; count: number; date: string }> {
    const response = await fetch(`${API_BASE_URL}/api/attendance/today`);
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return response.json();
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete user');
    }
    return response.json();
  },

  async getModelStatus(): Promise<{ trained: boolean; total_users: number }> {
    const response = await fetch(`${API_BASE_URL}/api/model/status`);
    if (!response.ok) throw new Error('Failed to fetch model status');
    return response.json();
  },
};
