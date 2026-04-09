export default function TopBar({ processingCount }: { processingCount: number }) {
  return (
    <header className="h-[57px] bg-[#120811] border-b border-[#dc136c]/20 flex items-center justify-between px-6 shadow-[0_0_20px_rgba(220,19,108,0.08)]">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {/* Zipa Logo Box */}
        <div className="w-8 h-8 rounded-lg bg-[#dc136c] flex items-center justify-center shadow-[0_8px_20px_rgba(220,19,108,0.4)]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M8 12l3 3 5-5" />
          </svg>
        </div>

        {/* Brand Name */}
        <span className="font-bold text-[15px] tracking-tight bg-gradient-to-r from-[#ff4d9d] to-[#dc136c] bg-clip-text text-transparent">
          Zipa Studio
        </span>
      </div>
      

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2">
        {/* Queue Info */}
        <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-[#1a0d17] text-white/50 border border-[#dc136c]/15">
          Queue: batch · 3 workers
        </span>

        {/* Active Processing */}
        {processingCount > 0 && (
          <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-[#dc136c]/10 text-[#ff8bc0] border border-[#dc136c]/30 animate-pulse">
            ● {processingCount} active
          </span>
        )}
      </div>
    </header>
  );
}