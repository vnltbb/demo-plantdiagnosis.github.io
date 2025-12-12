import React, { useCallback, useState } from 'react';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
        ${isDragging 
          ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
          : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-emerald-100' : 'bg-slate-100 group-hover:bg-emerald-50'} transition-colors`}>
          {isDragging ? (
            <ArrowUpTrayIcon className="w-8 h-8 text-emerald-600" />
          ) : (
            <PhotoIcon className="w-8 h-8 text-slate-400 group-hover:text-emerald-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-700">
            {isDragging ? 'Drop image here' : 'Upload Plant Image'}
          </p>
          <p className="text-sm text-slate-500">
            JPG, PNG, TIFF, BMP supported
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;