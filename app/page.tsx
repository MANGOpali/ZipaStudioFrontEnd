"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import ImageCard from "@/components/ImageCard";
import TopBar from "@/components/TopBar";

export type ImageFile = {
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

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAiEnhance, setUseAiEnhance] = useState(false);

  function handleFilesAdded(files: File[]) {
    const newImages: ImageFile[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      size: (file.size / 1024).toFixed(0) + " KB",
      status: "pending",
      progress: 0,
      step: 0,
      originalUrl: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...newImages]);
  }

  function updateImage(id: string, changes: Partial<ImageFile>) {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...changes } : img))
    );
  }

  async function processAll() {
    if (isProcessing) return;
    setIsProcessing(true);

    const pending = images.filter((img) => img.status === "pending");

    for (let i = 0; i < pending.length; i += 3) {
      const batch = pending.slice(i, i + 3);
      await Promise.all(
        batch.map((img) => processSingleImage(img, updateImage, useAiEnhance))
      );
    }

    setIsProcessing(false);
  }

  async function downloadAll() {
    const doneImages = images.filter(
      (img) => img.status === "done" && img.processedUrl
    );
    if (doneImages.length === 0) return;

    setIsProcessing(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      await Promise.all(
        doneImages.map(async (img) => {
          const response = await fetch(img.processedUrl!, { mode: "cors" });
          const blob = await response.blob();
          const fileName =
            img.name.replace(/\.[^/.]+$/, "") + "-zipa-ready.png";
          zip.file(fileName, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zipa-product-images.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP failed:", err);
      alert("ZIP download failed — check console for details");
    } finally {
      setIsProcessing(false);
    }
  }

  const doneCount = images.filter((i) => i.status === "done").length;
  const processingCount = images.filter((i) => i.status === "processing").length;
  const pendingCount = images.filter((i) => i.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#120811] text-white">
      <TopBar processingCount={processingCount} />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        <aside className="w-full lg:w-[300px] xl:w-[320px] bg-[#1a0d17] border-b lg:border-b-0 lg:border-r border-[#dc136c]/20 p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 shadow-[0_0_40px_rgba(220,19,108,0.08)] lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] overflow-y-auto">
          <div className="rounded-2xl border border-[#dc136c]/20 bg-gradient-to-br from-[#2a1020] to-[#160b14] p-4">
            <p className="text-[10px] font-mono text-[#f4a8cb]/60 tracking-[1.6px] uppercase mb-2">
              Brand Mode
            </p>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Zipa Vendor Studio
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 leading-relaxed">
              Pure white background, square format, clean product output for
              e-commerce listings.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] p-4">
            <p className="text-[10px] font-mono text-[#f4a8cb]/60 tracking-[1.6px] uppercase mb-3">
              Upload Products
            </p>
            <UploadZone onFilesAdded={handleFilesAdded} disabled={isProcessing} />
          </div>

          <div className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] p-4">
            <p className="text-[10px] font-mono text-[#f4a8cb]/60 tracking-[1.6px] uppercase mb-3">
              AI Enhancement
            </p>

            <button
              type="button"
              onClick={() => setUseAiEnhance((prev) => !prev)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                useAiEnhance
                  ? "bg-[#dc136c]/15 border-[#dc136c]/30 text-white"
                  : "bg-[#180c15] border-white/10 text-white/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {useAiEnhance ? "AI Enhance On" : "AI Enhance Off"}
                  </p>
                  <p className="text-[11px] mt-1 text-white/50">
                    Tries OpenAI first, then falls back to remove.bg.
                  </p>
                </div>

                <div
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    useAiEnhance ? "bg-[#dc136c]" : "bg-white/15"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      useAiEnhance ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </div>
              </div>
            </button>

            <p className="text-[10px] text-white/35 mt-3 leading-relaxed">
              Best for testing only. Default product-safe workflow is remove.bg +
              white background.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] p-4">
            <p className="text-[10px] font-mono text-[#f4a8cb]/60 tracking-[1.6px] uppercase mb-3">
              Output Rules
            </p>
            <div className="space-y-2 text-[12px] text-white/70 leading-relaxed">
              <div>• Pure white background</div>
              <div>• Square product image</div>
              <div>• Product centered</div>
              <div>• E-commerce ready output</div>
              <div>• No lifestyle background</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
            {[
              { label: "Total", val: images.length, color: "text-white" },
              { label: "Done", val: doneCount, color: "text-[#ff8bc0]" },
              { label: "Processing", val: processingCount, color: "text-[#ffc1dd]" },
              { label: "Pending", val: pendingCount, color: "text-white/40" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] p-3"
              >
                <div className={`font-mono text-xl sm:text-2xl font-semibold ${s.color}`}>
                  {s.val}
                </div>
                <div className="text-[10px] text-[#f4a8cb]/55 mt-1 tracking-[1.2px]">
                  {s.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] px-4 py-3 text-[12px] text-white/60 flex items-center justify-between">
            <span>Estimated cost</span>
            <span className="font-mono text-[#ff8bc0] font-semibold">
              ${(images.length * 0.012).toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 mt-1 lg:mt-auto">
            <button
              onClick={processAll}
              disabled={images.length === 0 || isProcessing}
              className="w-full rounded-2xl bg-[#dc136c] hover:bg-[#ef2a81] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3 transition-all shadow-[0_10px_30px_rgba(220,19,108,0.28)]"
            >
              {isProcessing ? "Processing…" : "Process all images"}
            </button>

            <button
              onClick={downloadAll}
              disabled={doneCount === 0 || isProcessing}
              className="w-full rounded-2xl bg-[#21101b] hover:bg-[#2b1422] disabled:opacity-40 disabled:cursor-not-allowed border border-[#dc136c]/20 text-white font-semibold text-sm py-3 transition-colors"
            >
              {isProcessing ? "Building ZIP…" : `Download all (${doneCount})`}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[radial-gradient(circle_at_top_right,rgba(220,19,108,0.08),transparent_28%),linear-gradient(to_bottom,#120811,#0f0710)]">
          <div className="mb-5 sm:mb-6">
            <p className="text-[11px] uppercase tracking-[2px] text-[#f4a8cb]/60 font-mono mb-2">
              Dashboard
            </p>
            <h1 className="text-xl sm:text-2xl font-bold">
              Zipa Product Image Processor
            </h1>
            <p className="text-white/55 text-sm mt-1 max-w-2xl">
              Upload vendor product photos and convert them into clean listing
              images with a white background.
            </p>
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[280px] sm:min-h-[420px] rounded-3xl border border-dashed border-[#dc136c]/20 bg-[#170b14] text-white/35 px-6 text-center">
              <div className="text-4xl sm:text-5xl mb-4">👜</div>
              <p className="font-semibold text-base sm:text-lg">
                No products uploaded yet
              </p>
              <p className="text-sm mt-2 text-white/40 max-w-md">
                Add product images from the upload section to start processing
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="rounded-3xl border border-[#dc136c]/15 bg-[#180c15] p-2 shadow-[0_0_20px_rgba(220,19,108,0.05)]"
                >
                  <ImageCard image={img} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

async function processSingleImage(
  img: ImageFile,
  update: (id: string, changes: Partial<ImageFile>) => void,
  useAiEnhance: boolean
) {
  update(img.id, { status: "processing", progress: 5, step: 0 });

  try {
    let finalUrl: string;

    if (useAiEnhance) {
      try {
        update(img.id, { step: 0, progress: 15 });
        const editedUrl = await callOpenAIEdit(img.file);

        update(img.id, { step: 1, progress: 70 });
        finalUrl = await callCloudinary(editedUrl);
      } catch (openAiErr) {
        console.warn(
          "OpenAI failed, falling back to remove.bg + Cloudinary",
          openAiErr
        );

        update(img.id, { step: 0, progress: 40 });
        const removedBgUrl = await callRemoveBg(img.file);

        update(img.id, { step: 1, progress: 80 });
        finalUrl = await callCloudinary(removedBgUrl);
      }
    } else {
      update(img.id, { step: 0, progress: 40 });
      const removedBgUrl = await callRemoveBg(img.file);

      update(img.id, { step: 1, progress: 80 });
      finalUrl = await callCloudinary(removedBgUrl);
    }

    update(img.id, {
      status: "done",
      progress: 100,
      step: 2,
      processedUrl: finalUrl,
    });
  } catch (err) {
    update(img.id, { status: "error", progress: 0 });
    console.error("Failed:", img.name, err);
  }
}

async function callRemoveBg(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/remove-bg", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data.details || data.error || "remove-bg failed";

    if (String(message).toLowerCase().includes("insufficient credits")) {
      throw new Error("remove.bg credits are finished. Recharge remove.bg to continue.");
    }

    throw new Error(message);
  }

  return data.resultUrl;
}

async function callCloudinary(imageUrl: string): Promise<string> {
  const res = await fetch("/api/apply-background", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details || data.error || "cloudinary failed");
  }

  return data.resultUrl;
}

async function callOpenAIEdit(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/openai-edit", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "OpenAI edit failed");
  }

  return data.resultUrl;
}