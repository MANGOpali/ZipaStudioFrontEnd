"use client";
import { useRef, useState } from "react";

type Props = {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
};

export default function UploadZone({ onFilesAdded, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || disabled) return;

    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );

    if (imageFiles.length > 0) onFilesAdded(imageFiles);
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`
        relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300
        ${
          isDragging
            ? "border-[#dc136c] bg-[#dc136c]/10 shadow-[0_0_25px_rgba(220,19,108,0.25)]"
            : "border-[#dc136c]/20 bg-[#1a0d17] hover:border-[#dc136c]/40"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Glow background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#dc136c]/5 to-transparent pointer-events-none" />

      {/* Upload Icon */}
      <div className="relative z-10 w-10 h-10 bg-[#dc136c]/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-[#dc136c]/20">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff8bc0"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {/* Text */}
      <p className="relative z-10 text-sm font-semibold text-white mb-1">
        Drop product images
      </p>

      <p className="relative z-10 text-[11px] text-white/40 leading-relaxed">
        PNG, JPG up to 20MB <br />
        10–20 images at once
      </p>

      {/* CTA */}
      <p className="relative z-10 text-[#ff8bc0] text-[11px] font-semibold mt-3">
        Browse files →
      </p>
    </div>
  );
}