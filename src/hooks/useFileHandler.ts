import { useRef } from 'react';
import { processCborFile } from '../utils/cborProcessor';
import { SUPPORTED_FILE_EXTENSIONS } from '../constants';
import { fileTooLargeMessage } from '../constants/limits';

interface UseFileHandlerProps {
  onCborConverted: (jsonText: string, warnings: string[], fileName: string) => void;
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

    const tooLarge = fileTooLargeMessage(file.size);
    if (tooLarge) {
      if (onError) onError(tooLarge);
      onFileProcessingError();
      return;
    }

    onFileProcessingStart();

    try {
      const result = await processCborFile(file);
      
      if (result.success) {
        onCborConverted(result.jsonText, result.warnings, file.name);
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
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    // Reset after taking the File so the same path can be chosen again.
    e.target.value = '';
    if (file) {
      handleFile(file);
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
