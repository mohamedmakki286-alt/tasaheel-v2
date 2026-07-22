import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X } from 'lucide-react';

export function MediaUploader({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (f: File) => void;
  onRemove: (i: number) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      Array.from(selected).forEach((f) => onAdd(f));
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <Upload className="h-5 w-5" />
        {t('components.mediaUploader.upload')}
      </button>
      {files.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="relative">
              <div className="h-16 w-16 bg-surface-700 rounded-lg flex items-center justify-center text-xs text-surface-400">
                {f.type.startsWith('image/') ? '📷' : '🎬'}
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -top-1 -right-1 bg-danger-500 rounded-full p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
