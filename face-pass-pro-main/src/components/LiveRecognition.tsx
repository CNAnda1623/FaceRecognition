import { useState, useRef, useCallback, useEffect } from "react";
import { ScanFace, Play, Square, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface RecognizedPerson {
  name: string;
  roll: string;
  time: string;
}

interface LiveRecognitionProps {
  isBackendConnected: boolean;
  onAttendanceMarked: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function LiveRecognition({ isBackendConnected, onAttendanceMarked }: LiveRecognitionProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<RecognizedPerson | null>(null);
  const [recentRecognitions, setRecentRecognitions] = useState<RecognizedPerson[]>([]);
  const [showMarkedEffect, setShowMarkedEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

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
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const captureFrameBase64 = useCallback((): string | null => {
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

  const handleStart = async () => {
    if (!isBackendConnected) {
      toast({
        title: "Backend Offline",
        description: "Cannot start recognition because the backend API is not reachable.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    await startCamera();

    // give camera some time to start
    setTimeout(() => {
      intervalRef.current = window.setInterval(async () => {
        const frame = captureFrameBase64();
        if (!frame) return;

        try {
          const res = await fetch(`${API_BASE_URL}/api/recognize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "", roll: "", image: frame }),
          });

          if (!res.ok) return;
          const data = await res.json();

          if (data.identified) {
            const time = new Date().toLocaleTimeString();

            const person: RecognizedPerson = {
              name: data.name,
              roll: data.roll,
              time,
            };

            setCurrentPerson(person);
            setRecentRecognitions((prev) => [person, ...prev].slice(0, 10));

            setShowMarkedEffect(true);
            setTimeout(() => setShowMarkedEffect(false), 1500);

            // tell parent to refresh stats + attendance table
            onAttendanceMarked();
          }
        } catch (err) {
          console.error("Recognition error:", err);
        }
      }, 800); // every 0.8 sec
    }, 1000);

    toast({
      title: "Recognition Started",
      description: "The system is now detecting and recognizing faces.",
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentPerson(null);
    stopCamera();

    toast({
      title: "Recognition Stopped",
      description: "Face recognition has been stopped.",
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <ScanFace className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Live Recognition</h2>
          <p className="text-sm text-muted-foreground">
            Real-time face detection & attendance
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video bg-muted/50 rounded-xl overflow-hidden video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Recognition overlay */}
          <div className="recognition-overlay" />

          {!isRunning && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <ScanFace className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">Recognition Inactive</p>
                <p className="text-sm text-muted-foreground/70">Click Start to begin</p>
              </div>
            </div>
          )}

          {/* Current person overlay */}
          {isRunning && currentPerson && (
            <div className="absolute top-4 left-4 right-4">
              <div
                className={`glass-card p-4 transition-all duration-300 ${
                  showMarkedEffect ? "ring-2 ring-success animate-pulse-glow" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{currentPerson.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Roll: {currentPerson.roll}
                      </p>
                    </div>
                  </div>
                  {showMarkedEffect && (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Marked!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scanning indicator */}
          {isRunning && (
            <div className="absolute bottom-4 right-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/90 rounded-full">
                <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                <span className="text-xs text-primary-foreground font-medium">Scanning</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isRunning ? (
            <Button variant="success" size="lg" className="flex-1" onClick={handleStart}>
              <Play className="w-4 h-4 mr-2" />
              Start Recognition
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              className="flex-1"
              onClick={handleStop}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recognition
            </Button>
          )}
        </div>

        {/* Recent Recognitions */}
        {recentRecognitions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Recent Recognitions
            </h3>
            <div className="space-y-2">
              {recentRecognitions.map((person, index) => (
                <div
                  key={`${person.roll}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Roll: {person.roll}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {person.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
