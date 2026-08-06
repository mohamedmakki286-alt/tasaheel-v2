import { Outlet } from 'react-router-dom';

export default function TechnicianLayout() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Outlet />
    </div>
  );
}
