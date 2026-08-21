/**
 * Upload a certificate file to the server
 */
export async function uploadCertificateFile(
  file: Blob,
  fileName: string,
): Promise<{
  success: boolean;
  fileName: string;
  storageURL: string;
  documentHash: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file, fileName);

    // `file` is a Blob (e.g. the AES-encrypted output), not a File — it has
    // no `.name`. The real filename is already passed in separately.
    console.log('Uploading file:', fileName, 'Size:', file.size);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload error response:', errorData);
      return {
        success: false,
        fileName: '',
        storageURL: '',
        documentHash: '',
        error: errorData.error || 'Upload failed',
      };
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return {
      success: true,
      fileName: data.fileName,
      storageURL: data.storageURL,
      documentHash: data.documentHash,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      fileName: '',
      storageURL: '',
      documentHash: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = ['application/pdf'];
  return allowedTypes.includes(file.type);
}

/**
 * Get MIME type from filename
 */
export function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream'; // Default binary stream type
  }
}
