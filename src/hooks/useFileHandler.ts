import { useRef } from 'react';
import { processCborFile } from '../utils/cborProcessor';
import { SUPPORTED_FILE_EXTENSIONS } from '../constants';

interface UseFileHandlerProps {
  onCborConverted: (data: any, fileName: string) => void;
  onFileProcessingStart: () => void;
  onFileProcessingError: () => void;
  onError?: (error: string) => void;
}

export const useFileHandler = ({
  onCborConverted,
  onFileProcessingStart,
  onFileProcessingError,
  onError
}: UseFileHandlerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (onError) onError(''); // Clear previous errors
    onFileProcessingStart();

    try {
      const result = await processCborFile(file);
      
      if (result.success && result.data) {
        onCborConverted(result.data, file.name);
      } else {
        if (onError) onError(result.error || 'Unknown error');
        onFileProcessingError();
      }
    } catch (error) {
      if (onError) onError('Failed to process file');
      onFileProcessingError();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const fileInputProps = {
    ref: fileInputRef,
    type: 'file' as const,
    accept: SUPPORTED_FILE_EXTENSIONS,
    onChange: handleFileInput,
    style: { display: 'none' as const }
  };

  return {
    handleFile,
    handleFileInput,
    openFileDialog,
    fileInputProps,
    fileInputRef
  };
};
