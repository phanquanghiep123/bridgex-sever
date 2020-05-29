import { Transform } from "stream";

export interface ParseOptions {
  debug?: boolean;
  decodeString?: (buffer: Buffer) => string;
}

export interface ExtractOptions {
  path?: string;
}

export function Parse(): Transform;
export function Extract(opts?: ExtractOptions): Transform;
