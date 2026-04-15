type ImageFile = {
  id: string;
  name: string;
  size: string;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  step: number;
  originalUrl: string;
  processedUrl?: string;
  file: File;
};
const STEP_LABELS = ["Processing", "White Background", "Done"];

const STATUS_STYLES: Record<ImageFile["status"], string> = {
  pending: "bg-white/10 text-white/45 border border-white/10",
  processing: "bg-[#dc136c]/15 text-[#ff8bc0] border border-[#dc136c]/25",
  done: "bg-green-500/15 text-green-400 border border-green-500/25",
  error: "bg-red-500/15 text-red-400 border border-red-500/25",
};

export default function ImageCard({ image }: { image: ImageFile }) {
  return (
    <div
      className={`
        bg-[#180c15] border rounded-2xl overflow-hidden transition-all duration-300
        shadow-[0_0_20px_rgba(220,19,108,0.04)]
        ${image.status === "done" ? "border-green-500/25" : ""}
        ${image.status === "processing" ? "border-[#dc136c]/30" : ""}
        ${image.status === "error" ? "border-red-500/30" : ""}
        ${image.status === "pending" ? "border-[#dc136c]/12" : ""}
      `}
    >
      <div className="aspect-square relative overflow-hidden bg-[#24131d]">
        {(image.processedUrl || image.originalUrl) ? (
          <img
            src={image.processedUrl || image.originalUrl}
            alt={image.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-mono">
            No preview
          </div>
        )}

        {image.status === "processing" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-3">
            <p className="font-mono text-[9px] text-white/70 tracking-wide uppercase">
              {STEP_LABELS[image.step] ?? "Processing"}
            </p>

            <div className="w-full h-[4px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#dc136c] rounded-full transition-all duration-300"
                style={{ width: `${image.progress}%` }}
              />
            </div>

            <p className="font-mono text-sm font-medium text-white">
              {image.progress}%
            </p>
          </div>
        )}

        {image.status === "done" && (
          <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-9 h-9 bg-[#dc136c] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(220,19,108,0.35)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        )}

        <div
          className={`absolute top-2 right-2 font-mono text-[9px] font-medium px-2 py-0.5 rounded-full tracking-wide uppercase ${STATUS_STYLES[image.status]}`}
        >
          {image.status === "processing" ? "Proc…" : image.status}
        </div>
      </div>

      <div className="p-3">
        <p className="text-[11px] font-semibold truncate mb-0.5 text-white">
          {image.name}
        </p>
        <p className="font-mono text-[9px] text-white/30">{image.size}</p>

        <div className="flex gap-1 mt-3">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-[4px] flex-1 rounded-full transition-colors ${
                i < image.step
                  ? "bg-green-500"
                  : i === image.step && image.status === "processing"
                  ? "bg-[#dc136c]"
                  : i < image.step && image.status === "done"
                  ? "bg-green-500"
                  : image.status === "done"
                  ? "bg-green-500/70"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}