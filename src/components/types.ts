// types.ts
export type AnnotationType =
  | "highlight"
  | "underline"
  | "comment"
  | "signature";

export interface Annotation {
  id: string;
  type: AnnotationType;
  color?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  signatureDataUrl?: string;
}