import { Scan } from "lucide-react";

export function Header() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-secondary opacity-90" />
      
      {/* Animated glow effects */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-background/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20">
              <Scan className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight">
                Face Recognition Attendance
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                AI-Powered Attendance Management System
              </p>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
            <p className="text-primary-foreground/90 font-medium">{today}</p>
            <p className="text-primary-foreground/60 text-sm">System Active</p>
          </div>
        </div>
      </div>
    </header>
  );
}
