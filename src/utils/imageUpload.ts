export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadProductImage(file: File, productId: string): Promise<ImageUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Arquivo deve ser uma imagem' };
    }

    // Validate file size (max 5MB for Base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Imagem deve ter no máximo 5MB' };
    }

    // Convert image to Base64
    const base64String = await convertFileToBase64(file);
    
    if (!base64String) {
      return { success: false, error: 'Erro ao processar a imagem' };
    }

    // Return the Base64 string as the URL
    return { success: true, url: base64String };

  } catch (error) {
    console.error('Image upload error:', error);
    return { success: false, error: 'Erro inesperado ao processar imagem' };
  }
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  try {
    // For Base64 images, we don't need to delete anything from storage
    // The image data is stored directly in the database
    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
}

export function isSupabaseImageUrl(url: string): boolean {
  // For Base64 images, they start with "data:image/"
  return url.startsWith('data:image/');
}

export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Helper function to convert File to Base64
function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}