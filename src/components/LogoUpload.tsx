import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useLogo } from '../contexts/LogoContext';

export default function LogoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logoUrl, setLogoUrl } = useLogo();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      {logoUrl ? (
        <div className="relative group">
          <img src={logoUrl} alt="Logo" className="h-24 object-contain mb-2" />
          <button
            onClick={handleClick}
            className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Upload className="h-6 w-6" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cyan-300 rounded-lg hover:border-cyan-500 transition-colors"
        >
          <Upload className="h-12 w-12 text-cyan-500 mb-2" />
          <span className="text-sm text-cyan-600">Carregar Logo</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}