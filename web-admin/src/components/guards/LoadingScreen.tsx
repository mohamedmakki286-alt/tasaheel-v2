export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1724] to-[#1a2744] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-500/20 mb-4">
          <span className="text-2xl font-bold text-black">ص</span>
        </div>
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}
