import * as CBOR from 'cbor-js';

export interface ProcessFileResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const processCborFile = async (file: File): Promise<ProcessFileResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Decode CBOR data using cbor-js
    const decodedData = CBOR.decode(uint8Array.buffer);
    
    // Convert to JSON-serializable format
    const jsonData = JSON.parse(JSON.stringify(decodedData));
    
    return { success: true, data: jsonData };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error processing CBOR file:', err);
    
    // Provide more user-friendly error messages
    let userFriendlyMessage = errorMessage;
    if (errorMessage.toLowerCase().includes('invalid')) {
      userFriendlyMessage = 'Invalid CBOR file format. Please ensure the file is a valid CBOR file.';
    } else if (errorMessage.toLowerCase().includes('unexpected end')) {
      userFriendlyMessage = 'File appears to be corrupted or incomplete.';
    } else if (errorMessage.toLowerCase().includes('not supported')) {
      userFriendlyMessage = 'This CBOR feature is not supported. Try a different CBOR file.';
    }
    
    return { success: false, error: userFriendlyMessage };
  }
};
