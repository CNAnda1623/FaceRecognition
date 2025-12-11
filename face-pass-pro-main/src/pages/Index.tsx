import { useState, useEffect, useCallback } from "react";
import { Users, CalendarCheck, Brain, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { RegisterUser } from "@/components/RegisterUser";
import { LiveRecognition } from "@/components/LiveRecognition";
import { AttendanceTable } from "@/components/AttendanceTable";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


// Demo data for when backend is not connected
const demoAttendance = [];

const Index = () => {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 4,
    todayAttendance: 4,
    modelTrained: true,
  });
  const [attendanceRecords, setAttendanceRecords] = useState(demoAttendance);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check backend connection on mount
  // Check backend connection on mount
  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats`, { cache: "no-store" });
        if (!res.ok) { setIsBackendConnected(false); return; }
        const data = await res.json();
        // If your backend returns minimal object, still treat it as OK:
        setIsBackendConnected(true);
        setStats({
          totalUsers: data.total_users ?? 0,
          todayAttendance: data.today_attendance ?? 0,
          modelTrained: !!data.model_trained,
        });
      } catch (e) {
        setIsBackendConnected(false);
      }
    };
    checkBackend();
  }, []);
 // you can add [API_BASE_URL] if you want, but not required



  const handleRefreshAttendance = useCallback(async () => {
    if (isBackendConnected) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/attendance/today`);
        const data = await response.json();
        setAttendanceRecords(data.records);
      } catch {
        console.error('Failed to refresh attendance');
      }
    }
  }, [isBackendConnected]);



  const handleUserRegistered = useCallback(() => {
    setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
  }, []);

  const handleAttendanceMarked = useCallback(() => {
    setStats(prev => ({ ...prev, todayAttendance: prev.todayAttendance + 1 }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {/* Backend Connection Warning */}
          {!isBackendConnected && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-warning/10 border border-warning/20 rounded-xl animate-fade-in">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-warning">Demo Mode</p>
                <p className="text-sm text-muted-foreground">
                  Python backend not connected. Running with simulated data. 
                  Deploy the FastAPI backend and set VITE_API_URL to connect.
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              description="Registered in system"
              variant="primary"
              delay={0}
            />
            <StatsCard
              title="Today's Attendance"
              value={stats.todayAttendance}
              icon={CalendarCheck}
              description="Marked present today"
              variant="success"
              delay={100}
            />
            <StatsCard
              title="Model Status"
              value={stats.modelTrained ? "Trained" : "Not Trained"}
              icon={Brain}
              description={stats.modelTrained ? "Ready for recognition" : "Train with user data"}
              variant={stats.modelTrained ? "success" : "warning"}
              delay={200}
            />
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RegisterUser 
              onUserRegistered={handleUserRegistered}
              isBackendConnected={isBackendConnected}
            />
            <LiveRecognition 
              isBackendConnected={isBackendConnected}
              onAttendanceMarked={handleAttendanceMarked}
            />
          </div>

          {/* Attendance Table */}
          <AttendanceTable 
            records={attendanceRecords}
            date={today}
            onRefresh={handleRefreshAttendance}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Face Recognition Attendance System • Built with OpenCV + KNN Classifier</p>
            <p className="mt-1">© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
