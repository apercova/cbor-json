export type CborJson = null | boolean | number | string | CborJson[] | { [key: string]: CborJson };

export interface DecodeCborOptions {
  timestampFormat?: 'epoch' | 'iso' | 'tagged';
  /** @deprecated Use timestampFormat. true maps to iso; false maps to tagged. */
  formatDate?: boolean;
  /** Large integers are exact JSON number tokens by default; number mode may round. */
  largeIntegerMode?: 'exact' | 'number';
  /** Preserve every CBOR tag as an explicit tagged JSON object, overriding tag-specific handling. */
  preserveTags?: boolean;
  timezone?: string;
  maxDepth?: number;
  /** Reject CBOR maps containing non-string keys instead of coercing them to strings. */
  strictMapKeys?: boolean;
}

export interface DecodeCborResult {
  jsonText: string;
  warnings: string[];
}

export class CborDecodeError extends Error {
  code: string;
}

export function decodeCbor(bytes: Uint8Array, options?: DecodeCborOptions): DecodeCborResult;
