"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  tenantId: string;
  folder?: string;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  tenantId,
  folder,
  className,
}: ImageUploaderProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!file || !file.type.startsWith("image/")) {
      setError("Geçerli bir görsel seçin");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya boyutu 10MB'dan küçük olmalı");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "media");
      form.append("tenantId", tenantId);
      form.append("folder", folder || "images");
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Yükleme başarısız");
      } else {
        const url = json.publicUrl as string;
        setPreview(url);
        onChange(url);
      }
    } catch {
      setError("Yükleme sırasında hata");
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    setError(null);
    try {
      const url = preview || value;
      if (url) {
        const marker = "/object/public/media/";
        const idx = url.indexOf(marker);
        if (idx >= 0) {
          const p = url.slice(idx + marker.length);
          await supabase.storage.from("media").remove([p]);
        }
      }
    } catch {}
    setPreview(null);
    onChange("");
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div
        className="border border-border/50 rounded-md overflow-hidden bg-muted"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        {preview ? (
          <div className="relative">
            <div className="aspect-[4/3]">
              <img
                src={preview}
                alt="Görsel"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 flex items-end justify-between p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openPicker}
                disabled={uploading}
              >
                {uploading ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Yükleniyor" : "Değiştir"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Kaldır
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground"
            onClick={openPicker}
            disabled={uploading}
          >
            {uploading ? <Spinner /> : <ImageIcon className="h-6 w-6" />}
            <span>
              {uploading ? "Yükleniyor" : "Görsel yükle veya sürükleyin"}
            </span>
          </button>
        )}
      </div>
      {error ? <div className="text-red-500 text-xs mt-1">{error}</div> : null}
    </div>
  );
}
