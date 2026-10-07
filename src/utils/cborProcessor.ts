import type { DecodeCborOptions, DecodeCborResult } from './decodeCbor.mjs';

export interface ProcessFileResult extends DecodeCborResult {
  success: boolean;
  error?: string;
  code?: string;
}

interface WorkerReply {
  success: boolean;
  jsonText?: string;
  warnings?: string[];
  error?: string;
  code?: string;
}

export const processCborFile = async (
  file: File,
  options: DecodeCborOptions = {}
): Promise<ProcessFileResult> => {
  try {
    const bytes = await file.arrayBuffer();
    return await new Promise((resolve) => {
      const worker = new Worker(new URL('./cbor.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        worker.terminate();
        const reply = event.data;
        resolve(reply.success
          ? { success: true, jsonText: reply.jsonText ?? 'null', warnings: reply.warnings ?? [] }
          : { success: false, error: reply.error ?? 'CBOR decoding failed.', code: reply.code, jsonText: '', warnings: [] });
      };
      worker.onerror = () => {
        worker.terminate();
        resolve({ success: false, error: 'CBOR decoding worker failed.', code: 'WORKER_FAILED', jsonText: '', warnings: [] });
      };
      worker.postMessage({ bytes, options }, [bytes]);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read the selected file.';
    return { success: false, error: message, code: 'FILE_READ_FAILED', jsonText: '', warnings: [] };
  }
};
