import { decodeCbor } from './decodeCbor.mjs';
import type { DecodeCborOptions } from './decodeCbor.mjs';

interface DecodeRequest {
  bytes: ArrayBuffer;
  options?: DecodeCborOptions;
}

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<DecodeRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

workerScope.onmessage = (event: MessageEvent<DecodeRequest>) => {
  try {
    const result = decodeCbor(new Uint8Array(event.data.bytes), event.data.options);
    workerScope.postMessage({ success: true, ...result });
  } catch (error) {
    workerScope.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'CBOR decoding failed.',
      code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'DECODE_FAILED',
    });
  }
};
