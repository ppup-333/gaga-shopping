import React, { useRef, useState } from 'react';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';

/**
 * 手機拍照與圖片上傳元件
 * - 使用 accept="image/*" 與 capture="environment" 完美支援手機瀏覽器開啟鏡頭拍照
 * - 電腦端則自動開啟檔案選取視窗
 * - 具備即時預覽與客戶端輕量壓縮機制
 */
export default function CameraCapture({ onImageSelected, currentImageUrl }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [compressing, setCompressing] = useState(false);

  // 處理拍照或檔案選取
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 客戶端 Canvas 輕量壓縮 (限制最大寬度 1200px，避免大圖上傳緩慢)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          setCompressing(false);
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            setPreview(previewUrl);
            // 傳回處理後的檔案物件供 Form 送出
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            onImageSelected(compressedFile);
          }
        }, 'image/jpeg', 0.85);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelected(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        物品照片 (手機可直接拍照上傳)
      </label>

      {/* 隱藏的 HTML5 相機原生觸發輸入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // 喚起手機後置相機拍照
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 圖片預覽區 */}
      {preview ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-w-sm aspect-video flex items-center justify-center group shadow-inner">
          <img 
            src={preview} 
            alt="物品照片預覽" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white text-slate-800 rounded-full hover:bg-slate-100 shadow transition"
              title="重新拍照/上傳"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow transition"
              title="清除相片"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* 未選取照片時的拍照/選取引導按鈕 */
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-xl text-blue-600 transition active:scale-95"
          >
            <Camera className="w-8 h-8 mb-1" />
            <span className="text-xs font-semibold">手機拍照</span>
            <span className="text-[10px] text-blue-400">開啟相機即拍即存</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                // 暫時移除 capture 屬性以允許從相簿選取
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
                // 點擊後復原 capture 屬性
                setTimeout(() => {
                  fileInputRef.current?.setAttribute('capture', 'environment');
                }, 500);
              }
            }}
            disabled={compressing}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition active:scale-95"
          >
            <Upload className="w-8 h-8 mb-1 text-slate-500" />
            <span className="text-xs font-semibold">選擇照片</span>
            <span className="text-[10px] text-slate-400">相簿選取或電腦上傳</span>
          </button>
        </div>
      )}

      {compressing && (
        <p className="text-xs text-blue-600 flex items-center gap-1 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          正在將照片進行高效率最佳化壓縮...
        </p>
      )}
    </div>
  );
}
