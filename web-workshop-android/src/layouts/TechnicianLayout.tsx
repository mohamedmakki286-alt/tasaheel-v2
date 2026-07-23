import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import UnifiedCallHost from '@shared/call/UnifiedCallHost';

export default function TechnicianLayout() {
  const technician = useAuthStore((s) => s.technician);
  const token = useAuthStore((s) => s.token);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Outlet />
      {technician && token && (
        <UnifiedCallHost
          userId={technician.id}
          userName={technician.name}
          userRole="technician"
          token={token}
        />
      )}
    </div>
  );
}
