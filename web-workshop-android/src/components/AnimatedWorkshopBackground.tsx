import { Wrench, Settings, Car, Gauge, Shield, Cog, Fuel, Truck, AlertTriangle, RotateCw } from 'lucide-react';

const icons = [
  { Icon: Wrench, size: 28, x: 5, y: 10, duration: 20, delay: 0, rotate: true },
  { Icon: Settings, size: 36, x: 15, y: 30, duration: 25, delay: 2, rotate: true },
  { Icon: Car, size: 32, x: 85, y: 5, duration: 22, delay: 1, rotate: false },
  { Icon: Gauge, size: 24, x: 75, y: 40, duration: 18, delay: 3, rotate: false },
  { Icon: Shield, size: 30, x: 50, y: 85, duration: 26, delay: 0, rotate: false },
  { Icon: Cog, size: 40, x: 90, y: 70, duration: 30, delay: 4, rotate: true },
  { Icon: Fuel, size: 22, x: 30, y: 70, duration: 19, delay: 1, rotate: false },
  { Icon: Truck, size: 34, x: 8, y: 75, duration: 24, delay: 2, rotate: false },
  { Icon: AlertTriangle, size: 20, x: 60, y: 15, duration: 17, delay: 5, rotate: false },
  { Icon: RotateCw, size: 18, x: 40, y: 50, duration: 15, delay: 3, rotate: true },
  { Icon: Wrench, size: 20, x: 70, y: 90, duration: 21, delay: 0, rotate: true },
  { Icon: Settings, size: 26, x: 20, y: 55, duration: 23, delay: 5, rotate: true },
  { Icon: Car, size: 22, x: 55, y: 60, duration: 20, delay: 2, rotate: false },
  { Icon: Gauge, size: 16, x: 80, y: 25, duration: 16, delay: 4, rotate: false },
  { Icon: Shield, size: 24, x: 10, y: 50, duration: 27, delay: 1, rotate: false },
  { Icon: Cog, size: 14, x: 45, y: 20, duration: 14, delay: 6, rotate: true },
  { Icon: Wrench, size: 16, x: 65, y: 50, duration: 18, delay: 3, rotate: true },
  { Icon: Fuel, size: 18, x: 35, y: 80, duration: 22, delay: 0, rotate: false },
];

export default function AnimatedWorkshopBackground() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(4deg); }
        }
        @keyframes float-rotate {
          0% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(90deg); }
          50% { transform: translateY(-8px) rotate(180deg); }
          75% { transform: translateY(-20px) rotate(270deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        @keyframes car-drive {
          0% { transform: translateX(-30px) translateY(0); }
          50% { transform: translateX(10px) translateY(-5px); }
          100% { transform: translateX(-30px) translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.15; }
        }
        .float-icon {
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(215,25,32,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(215,25,32,0.03),transparent_70%)]" />

        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent-400/5 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-500/3 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-accent-500/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }} />

        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid2" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" />
        </svg>

        {icons.map((icon, idx) => {
          const IconComp = icon.Icon;
          const animationName = icon.rotate ? 'float-rotate' : 'float';
          const isCar = icon.Icon === Car || icon.Icon === Truck;
          const actualAnim = isCar ? 'car-drive' : animationName;
          return (
            <div
              key={idx}
              className="float-icon"
              style={{
                left: `${icon.x}%`,
                top: `${icon.y}%`,
                animation: `${actualAnim} ${icon.duration}s ease-in-out ${icon.delay}s infinite`,
              }}
            >
              <IconComp size={icon.size} className="text-accent-400" style={{ opacity: 0.15 }} />
            </div>
          );
        })}

        <div className="absolute top-[15%] right-[10%] w-2 h-2 rounded-full bg-accent-400/20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[60%] w-3 h-3 rounded-full bg-accent-400/15 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[70%] right-[30%] w-1.5 h-1.5 rounded-full bg-accent-400/25 animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[25%] right-[80%] w-2.5 h-2.5 rounded bg-accent-400/10 rotate-45 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[80%] right-[70%] w-2 h-2 rounded bg-accent-400/10 rotate-45 animate-pulse" style={{ animationDelay: '2.5s' }} />

        <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.03]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C300,120 700,0 1200,60 L1200,120 L0,120 Z" fill="white" />
        </svg>
      </div>
    </>
  );
}
