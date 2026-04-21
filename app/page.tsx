"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ImageStatus = "pending" | "processing" | "done" | "error";
type BriaMode = "none" | "increase_resolution" | "enhance" | "premium_3d";
type GarmentHint = "auto" | "top" | "long";

type ImageFile = {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  processedUrl?: string;
  status: ImageStatus;
  progress: number;
  step: number;
};

const PROCESS_STEPS = [
  "Background removal",
  "3D reconstruction / White background",
  "Finished",
];

// Cloudinary's free/default upload size limit
const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export default function Page() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [briaMode, setBriaMode] = useState<BriaMode>("none");
  const [garmentHint, setGarmentHint] = useState<GarmentHint>("auto");

  function handleFilesAdded(files: File[]) {
    const nextImages: ImageFile[] = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
        progress: 0,
        step: 0,
      }));

    setImages((prev) => [...prev, ...nextImages]);
  }

  function updateImage(id: string, changes: Partial<ImageFile>) {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...changes } : img))
    );
  }

  function clearAll() {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
  }

  async function processAll() {
    const pendingImages = images.filter((img) => img.status === "pending");
    if (pendingImages.length === 0) return;

    setIsProcessing(true);

    try {
      for (let i = 0; i < pendingImages.length; i += 3) {
        const batch = pendingImages.slice(i, i + 3);
        await Promise.all(
          batch.map((img) =>
            processSingleImage(img, updateImage, briaMode, garmentHint)
          )
        );
      }
    } finally {
      setIsProcessing(false);
    }
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

  const doneCount = useMemo(
    () => images.filter((i) => i.status === "done").length,
    [images]
  );
  const processingCount = useMemo(
    () => images.filter((i) => i.status === "processing").length,
    [images]
  );
  const pendingCount = useMemo(
    () => images.filter((i) => i.status === "pending").length,
    [images]
  );

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
              BRIA Processing
            </p>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  value: "none",
                  label: "Background Only",
                  desc: "Safest product-preserving mode",
                },
                {
                  value: "increase_resolution",
                  label: "Increase Resolution",
                  desc: "Sharper output, safer than enhance",
                },
                {
                  value: "enhance",
                  label: "Enhance",
                  desc: "Strongest cleanup, may change texture slightly",
                },
                {
                  value: "premium_3d",
                  label: "✦ Premium 3D",
                  desc: "GPT-image-1.5 · Self-supporting 3D form · ~$0.025/image",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBriaMode(option.value as BriaMode)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    briaMode === option.value
                      ? "bg-[#dc136c]/15 border-[#dc136c]/30 text-white"
                      : "bg-[#180c15] border-white/10 text-white/60"
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-[11px] mt-1 text-white/50">
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-white/35 mt-3 leading-relaxed">
              Use Background Only for safest catalog output. Test the other two
              carefully on logos, stitching, texture, and color.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] p-4">
            <p className="text-[10px] font-mono text-[#f4a8cb]/60 tracking-[1.6px] uppercase mb-3">
              Garment Type
            </p>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  value: "auto",
                  label: "Auto Detect",
                  desc: "Let backend decide top or long garment",
                },
                {
                  value: "top",
                  label: "Top Wear",
                  desc: "Tops, shirts, tees, blouses, jackets",
                },
                {
                  value: "long",
                  label: "Long Garment",
                  desc: "Skirts, dresses, gowns, long kurtha",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGarmentHint(option.value as GarmentHint)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    garmentHint === option.value
                      ? "bg-[#dc136c]/15 border-[#dc136c]/30 text-white"
                      : "bg-[#180c15] border-white/10 text-white/60"
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-[11px] mt-1 text-white/50">
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <BatchPanel garmentHint={garmentHint} />

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
              {
                label: "Processing",
                val: processingCount,
                color: "text-[#ffc1dd]",
              },
              { label: "Pending", val: pendingCount, color: "text-white/40" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-[#180c15] p-3"
              >
                <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                <div className="text-[11px] text-white/45 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={processAll}
              disabled={isProcessing || pendingCount === 0}
              className="w-full rounded-2xl bg-[#dc136c] hover:bg-[#ea2b7d] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold transition-all"
            >
              {isProcessing ? "Processing..." : "Process All"}
            </button>

            <button
              type="button"
              onClick={downloadAll}
              disabled={isProcessing || doneCount === 0}
              className="w-full rounded-2xl border border-white/10 bg-[#180c15] hover:bg-[#24101d] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold transition-all"
            >
              Download ZIP
            </button>

            <button
              type="button"
              onClick={clearAll}
              disabled={isProcessing || images.length === 0}
              className="w-full rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold transition-all"
            >
              Clear All
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6">
          {images.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
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

// ----------------------------
// Image compression helper
// ----------------------------

/**
 * Fetches a PNG from a URL and compresses it using an offscreen canvas.
 *
 * Strategy:
 * - Draw the image onto a canvas at its natural size (preserves quality)
 * - Export as JPEG at quality 0.92 — eliminates the alpha channel and
 *   dramatically reduces file size (14MB PNG → ~1-2MB JPEG typically)
 * - If the JPEG is still over the Cloudinary limit, scale the canvas
 *   down progressively until it fits (rarely needed)
 *
 * Why JPEG and not PNG?
 * At this point in the pipeline the image is going to Cloudinary which
 * will composite it onto a white background anyway. Transparency is no
 * longer needed, so JPEG is safe and ~5-10x smaller than PNG.
 *
 * NOTE: The alpha channel (transparent background) is intentionally
 * composited to white before JPEG encoding — this matches what
 * Cloudinary will do on its end.
 */
async function compressForCloudinary(
  imageUrl: string,
  maxBytes: number = CLOUDINARY_MAX_BYTES
): Promise<Blob> {
  // Fetch the PNG from FastAPI
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch processed image: ${res.status}`);
  const blob = await res.blob();

  // Fast path: already small enough, send as-is
  if (blob.size <= maxBytes) return blob;

  // Load into an image element for canvas drawing
  const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image for compression"));
    };
    img.src = objectUrl;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Try progressively smaller scales until we fit under the limit.
  // Start at 100% (no resize), then 85%, 70%, 55%.
  // In practice the JPEG conversion alone almost always solves it.
  const scales = [1.0, 0.85, 0.70, 0.55];
  const qualities = [0.92, 0.88, 0.85, 0.80];

  for (let i = 0; i < scales.length; i++) {
    const scale = scales[i];
    const quality = qualities[i];

    canvas.width = Math.round(imgEl.naturalWidth * scale);
    canvas.height = Math.round(imgEl.naturalHeight * scale);

    // Fill white before drawing — composites the transparent background.
    // This is correct: Cloudinary will do the same thing anyway.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        quality
      );
    });

    if (compressed.size <= maxBytes) return compressed;
  }

  // Last resort: return the final attempt even if slightly over
  // (Cloudinary may still accept it depending on plan limits)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Final compression failed"))),
      "image/jpeg",
      0.80
    );
  });
}

// ----------------------------
// Pipeline functions
// ----------------------------

async function processSingleImage(
  img: ImageFile,
  update: (id: string, changes: Partial<ImageFile>) => void,
  briaMode: BriaMode,
  garmentHint: GarmentHint
) {
  update(img.id, { status: "processing", progress: 5, step: 0 });

  try {
    update(img.id, { step: 0, progress: 40 });
    const bgResult = await callRemoveBg(img.file, briaMode, garmentHint);

    update(img.id, { step: 1, progress: 70 });

    // Compress before sending to Cloudinary — fixes the 10MB limit error.
    // The PNG from FastAPI can be 14MB+; this brings it to 1-3MB safely.
    const compressedBlob = await compressForCloudinary(bgResult.resultUrl);

    update(img.id, { progress: 80 });
    const finalUrl = await callCloudinary(compressedBlob);

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

async function callRemoveBg(
  file: File,
  mode: BriaMode,
  garmentHint: GarmentHint
): Promise<{ resultUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  formData.append("garment_hint", garmentHint);

  const res = await fetch("/api/remove-bg", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details || data.error || "remove-bg failed");
  }

  return data;
}

// callCloudinary now accepts a Blob directly instead of a URL string.
// This avoids a second fetch round-trip and lets us control the payload size.
async function callCloudinary(imageBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", imageBlob, "product.jpg");

  const res = await fetch("/api/apply-background", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details || data.error || "cloudinary failed");
  }

  return data.resultUrl;
}

// ----------------------------
// Batch API functions (~$0.025/image, async)
// ----------------------------

async function callBatchSubmit(
  files: File[],
  garmentHint: GarmentHint
): Promise<{ batch_id: string; submitted_count: number; estimated_cost_usd: number }> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  formData.append("garment_hint", garmentHint);

  const res = await fetch("/api/batch/submit", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || "Batch submit failed");
  return data;
}

async function callBatchStatus(
  batchId: string
): Promise<{ status: string; completed: number; total: number }> {
  const res = await fetch(`/api/batch/status/${batchId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Status check failed");
  return data;
}

async function callBatchResults(
  batchId: string
): Promise<{ results: { custom_id: string; result_url: string | null }[] }> {
  const res = await fetch(`/api/batch/results/${batchId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Results fetch failed");
  return data;
}

// ----------------------------
// BatchPanel component
// ----------------------------

type BatchStatus = "idle" | "submitting" | "polling" | "done" | "error";

function BatchPanel({ garmentHint }: { garmentHint: GarmentHint }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<BatchStatus>("idle");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useState<ReturnType<typeof setInterval> | null>(null);

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles(selected);
    setStatus("idle");
    setBatchId(null);
    setResultUrls([]);
    setError(null);
    e.currentTarget.value = "";
  }

  async function handleSubmit() {
    if (!files.length) return;
    setStatus("submitting");
    setError(null);

    try {
      const res = await callBatchSubmit(files, garmentHint);
      setBatchId(res.batch_id);
      setEstimatedCost(res.estimated_cost_usd);
      setProgress({ completed: 0, total: res.submitted_count });
      setStatus("polling");
      startPolling(res.batch_id);
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  function startPolling(id: string) {
    const interval = setInterval(async () => {
      try {
        const s = await callBatchStatus(id);
        setProgress({ completed: s.completed, total: s.total });

        if (s.status === "completed") {
          clearInterval(interval);
          const results = await callBatchResults(id);
          const urls = results.results
            .filter((r) => r.result_url)
            .map((r) => r.result_url as string);
          setResultUrls(urls);
          setStatus("done");
        } else if (["failed", "expired", "cancelled"].includes(s.status)) {
          clearInterval(interval);
          setError(`Batch ${s.status}`);
          setStatus("error");
        }
      } catch (err: any) {
        clearInterval(interval);
        setError(err.message);
        setStatus("error");
      }
    }, 30_000); // poll every 30s
  }

  async function downloadAll() {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    await Promise.all(
      resultUrls.map(async (url, i) => {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        zip.file(`zipa-3d-${i + 1}.png`, blob);
      })
    );
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "zipa-batch-3d.zip";
    a.click();
  }

  return (
    <div className="rounded-2xl border border-[#dc136c]/15 bg-[#21101b] p-4 space-y-3">
      <div>
        <p className="text-[10px] font-mono text-[#f4a8cb]/60 tracking-[1.6px] uppercase mb-1">
          Batch 3D Mode
        </p>
        <p className="text-[11px] text-white/50 leading-relaxed">
          ~$0.025/image · Processed within 1–4h · Up to 100 images
        </p>
      </div>

      {/* File picker */}
      <label className="block cursor-pointer">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={onFilesSelected}
          disabled={status === "submitting" || status === "polling"}
        />
        <div className="rounded-xl border border-dashed border-white/15 bg-[#180c15] hover:bg-[#24101d] transition-all p-4 text-center">
          <p className="text-sm font-semibold">
            {files.length > 0 ? `${files.length} images selected` : "Select images for batch"}
          </p>
          <p className="text-[11px] text-white/40 mt-1">Up to 100 images</p>
        </div>
      </label>

      {/* Submit */}
      {status === "idle" && files.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-[#dc136c] hover:bg-[#ea2b7d] px-4 py-2.5 text-sm font-semibold transition-all"
        >
          Submit Batch ({files.length} images · est. ${(files.length * 0.025).toFixed(2)})
        </button>
      )}

      {/* Submitting */}
      {status === "submitting" && (
        <div className="text-center text-sm text-white/60 py-2">
          Running BRIA on {files.length} images...
        </div>
      )}

      {/* Polling */}
      {status === "polling" && batchId && (
        <div className="space-y-2">
          <div className="flex justify-between text-[12px] text-white/60">
            <span>Processing with OpenAI...</span>
            <span>{progress.completed}/{progress.total}</span>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#dc136c] transition-all duration-500"
              style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-white/35">
            Batch ID: {batchId.slice(0, 16)}... · Polling every 30s
          </p>
        </div>
      )}

      {/* Done */}
      {status === "done" && (
        <div className="space-y-2">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <p className="text-sm font-semibold text-emerald-300">
              ✓ {resultUrls.length} images ready
            </p>
            <p className="text-[11px] text-white/40 mt-1">
              Cost: ~${estimatedCost.toFixed(3)}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadAll}
            className="w-full rounded-xl border border-white/10 bg-[#180c15] hover:bg-[#24101d] px-4 py-2.5 text-sm font-semibold transition-all"
          >
            Download ZIP
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-[12px] text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => { setStatus("idle"); setError(null); }}
            className="mt-2 text-[11px] text-white/50 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ----------------------------
// UI components (unchanged)
// ----------------------------

function TopBar({ processingCount }: { processingCount: number }) {
  return (
    <header className="h-[57px] border-b border-[#dc136c]/15 bg-[#140912]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-2xl bg-[#dc136c] shadow-[0_0_20px_rgba(220,19,108,0.35)]" />
        <div>
          <h1 className="text-sm sm:text-base font-bold">Zipa Image Forge</h1>
          <p className="text-[11px] text-white/45">
            Fashion listing cleanup pipeline
          </p>
        </div>
      </div>

      <div className="text-[12px] text-white/55">
        Processing:{" "}
        <span className="text-white font-semibold">{processingCount}</span>
      </div>
    </header>
  );
}

function EmptyState() {
  return (
    <div className="h-full min-h-[60vh] rounded-3xl border border-dashed border-white/10 bg-[#180c15] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-[#dc136c]/10 border border-[#dc136c]/20 flex items-center justify-center mb-4">
          <span className="text-2xl">🛍️</span>
        </div>
        <h3 className="text-xl font-bold">Upload product photos</h3>
        <p className="text-sm text-white/50 mt-2 leading-relaxed">
          Add raw store images, choose a BRIA mode, and generate catalog-ready
          outputs for Zipa.
        </p>
      </div>
    </div>
  );
}

function UploadZone({
  onFilesAdded,
  disabled,
}: {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}) {
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) onFilesAdded(files);
    e.currentTarget.value = "";
  }

  return (
    <label className={`block cursor-pointer ${disabled ? "opacity-60" : ""}`}>
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      <div className="rounded-2xl border border-dashed border-white/15 bg-[#180c15] hover:bg-[#24101d] transition-all p-6 text-center">
        <div className="text-2xl mb-2">📤</div>
        <p className="text-sm font-semibold">Click to upload product images</p>
        <p className="text-[11px] text-white/45 mt-1">
          Multiple images supported
        </p>
      </div>
    </label>
  );
}

function ImageCard({ image }: { image: ImageFile }) {
  return (
    <div className="overflow-hidden rounded-[22px]">
      <div className="relative aspect-square bg-[#120811] rounded-[22px] overflow-hidden border border-white/10">
        <Image
          src={image.processedUrl || image.previewUrl}
          alt={image.name}
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{image.name}</p>
            <p className="text-[11px] text-white/40 mt-1">
              {PROCESS_STEPS[Math.min(image.step, PROCESS_STEPS.length - 1)]}
            </p>
          </div>

          <StatusBadge status={image.status} />
        </div>

        <div className="mt-3">
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#dc136c] transition-all duration-300"
              style={{ width: `${image.progress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/40 mt-2">{image.progress}%</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ImageStatus }) {
  const styles: Record<ImageStatus, string> = {
    pending: "bg-white/8 text-white/60 border-white/10",
    processing: "bg-[#dc136c]/10 text-[#ffc1dd] border-[#dc136c]/20",
    done: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    error: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}