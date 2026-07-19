import { Wrench, Settings, Car, Gauge, Shield, Cog, ClipboardList, Users } from 'lucide-react';

const icons = [
  { Icon: Wrench, size: 28, x: 5, y: 10, duration: 20, delay: 0, rotate: true },
  { Icon: Settings, size: 36, x: 15, y: 30, duration: 25, delay: 2, rotate: true },
  { Icon: Car, size: 32, x: 85, y: 5, duration: 22, delay: 1, rotate: false },
  { Icon: Gauge, size: 24, x: 75, y: 40, duration: 18, delay: 3, rotate: false },
  { Icon: Shield, size: 30, x: 50, y: 85, duration: 26, delay: 0, rotate: false },
  { Icon: Cog, size: 40, x: 90, y: 70, duration: 30, delay: 4, rotate: true },
  { Icon: ClipboardList, size: 22, x: 30, y: 70, duration: 19, delay: 1, rotate: false },
  { Icon: Users, size: 34, x: 8, y: 75, duration: 24, delay: 2, rotate: false },
  { Icon: Cog, size: 14, x: 45, y: 20, duration: 14, delay: 6, rotate: true },
  { Icon: Wrench, size: 16, x: 65, y: 50, duration: 18, delay: 3, rotate: true },
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
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_70%)]" />

        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-500/3 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid3" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid3)" />
        </svg>

        {icons.map((icon, idx) => {
          const IconComp = icon.Icon;
          const animationName = icon.rotate ? 'float-rotate' : 'float';
          const isCar = icon.Icon === Car;
          const actualAnim = isCar ? 'car-drive' : animationName;
          return (
            <div
              key={idx}
              className="absolute pointer-events-none"
              style={{
                left: `${icon.x}%`,
                top: `${icon.y}%`,
                animation: `${actualAnim} ${icon.duration}s ease-in-out ${icon.delay}s infinite`,
              }}
            >
              <IconComp size={icon.size} className="text-amber-400" style={{ opacity: 0.12 }} />
            </div>
          );
        })}
      </div>
    </>
  );
}
