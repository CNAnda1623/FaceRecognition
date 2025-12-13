import { useState, useRef, useCallback, useEffect } from "react";
import { UserPlus, Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface RegisterUserProps {
  onUserRegistered: () => void;
  isBackendConnected: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://facerecognition-i3a2.onrender.com";

export function RegisterUser({ onUserRegistered, isBackendConnected }: RegisterUserProps) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const totalRequired = 10;

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please allow camera permissions.",
        variant: "destructive",
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const handleStartCapture = async () => {
    if (!name.trim() || !roll.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and roll number.",
        variant: "destructive",
      });
      return;
    }

    if (!isBackendConnected) {
      toast({
        title: "Backend Offline",
        description: "Cannot register user because the backend API is not reachable.",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    setCapturedCount(0);
    await startCamera();

    // allow camera to start
    setTimeout(() => {
      captureImages();
    }, 1000);
  };

  const captureImages = async () => {
    try {
      // 1. Create user folder
      await fetch(`${API_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roll }),
      });

      // 2. Capture 10 images and send to backend
      for (let i = 1; i <= totalRequired; i++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const frame = captureFrame();
        if (!frame) continue;

        await fetch(`${API_BASE_URL}/api/capture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, roll, image: frame }),
        });

        setCapturedCount(i);
      }

      setIsCapturing(false);
      setIsTraining(true);

      // 3. Train model
      await fetch(`${API_BASE_URL}/api/train`, {
        method: "POST",
      });

      setIsTraining(false);
      stopCamera();

      toast({
        title: "Success!",
        description: `User ${name} registered successfully with ${totalRequired} images.`,
      });

      setName("");
      setRoll("");
      setCapturedCount(0);
      onUserRegistered();
    } catch (error) {
      console.error("Error during registration:", error);
      toast({
        title: "Error",
        description: "Failed to register user. Please try again.",
        variant: "destructive",
      });
      setIsCapturing(false);
      setIsTraining(false);
      stopCamera();
    }
  };

  const handleCancel = () => {
    setIsCapturing(false);
    setIsTraining(false);
    setCapturedCount(0);
    stopCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const progressPercent = (capturedCount / totalRequired) * 100;

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Register New User</h2>
          <p className="text-sm text-muted-foreground">Capture face images for recognition</p>
        </div>
      </div>

      {!isBackendConnected && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-warning/10 border border-warning/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-warning" />
          <p className="text-sm text-warning">Demo mode - Backend not connected</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCapturing || isTraining}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roll">Roll Number</Label>
            <Input
              id="roll"
              placeholder="12345"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              disabled={isCapturing || isTraining}
            />
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-muted/50 rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {!isCapturing && !isTraining && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Camera preview will appear here</p>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="glass-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Capturing...</span>
                  <span className="text-sm text-muted-foreground">
                    {capturedCount}/{totalRequired}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          )}

          {isTraining && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="font-medium">Training Model...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isCapturing && !isTraining ? (
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              onClick={handleStartCapture}
              disabled={!name.trim() || !roll.trim()}
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Capture
            </Button>
          ) : (
            <>
              {isCapturing && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
              {isTraining && (
                <Button variant="outline" size="lg" className="flex-1" disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Training...
                </Button>
              )}
            </>
          )}
        </div>

        {capturedCount === totalRequired && !isTraining && (
          <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-sm text-success">All images captured successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}
