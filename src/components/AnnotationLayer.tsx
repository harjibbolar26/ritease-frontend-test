// AnnotationLayer.tsx
import React from "react";
import Image from "next/image";
import { Annotation } from "./types";

interface AnnotationLayerProps {
  annotations: Annotation[];
  pageContainerRef: React.RefObject<HTMLDivElement>;
  draggedAnnotation: string | null;
  onMouseDown: (
    e: React.MouseEvent,
    annotationId: string,
    pageContainer: HTMLDivElement
  ) => void;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotations,
  pageContainerRef,
  draggedAnnotation,
  onMouseDown,
}) => {
  return (
    <div
      className="absolute top-0 left-0 w-full h-full"
      style={{
        position: "absolute",
      }}
    >
      {annotations.map((annotation) => {
        switch (annotation.type) {
          case "highlight":
            return (
              <div
                key={annotation.id}
                className="absolute opacity-40 rounded pointer-events-none"
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                  backgroundColor: annotation.color,
                  width: `${annotation.width}px`,
                  height: `${annotation.height}px`,
                }}
              />
            );
          case "underline":
            return (
              <div
                key={annotation.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                  backgroundColor: annotation.color,
                  width: `${annotation.width}px`,
                  height: `${annotation.height}px`,
                }}
              />
            );
          case "comment":
            return (
              <div
                key={annotation.id}
                className={`absolute cursor-move p-2 bg-white bg-opacity-90 border border-gray-300 rounded shadow-sm ${
                  draggedAnnotation === annotation.id ? "opacity-80" : ""
                }`}
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                  fontSize: "12px",
                  maxWidth: "180px",
                  zIndex: 20,
                  pointerEvents: "auto",
                }}
                onMouseDown={(e) =>
                  pageContainerRef.current &&
                  onMouseDown(e, annotation.id, pageContainerRef.current)
                }
              >
                <div className="font-medium text-xs text-gray-500 mb-1">Comment</div>
                <div className="text-gray-800">{annotation.text}</div>
              </div>
            );
          case "signature":
            return annotation.signatureDataUrl ? (
              <div
                key={annotation.id}
                className={`absolute cursor-move ${
                  draggedAnnotation === annotation.id ? "opacity-50" : ""
                }`}
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                  zIndex: 20,
                  pointerEvents: "auto", // Enable pointer events explicitly
                }}
                onMouseDown={(e) =>
                  pageContainerRef.current &&
                  onMouseDown(e, annotation.id, pageContainerRef.current)
                }
              >
                <Image
                  src={annotation.signatureDataUrl}
                  alt="Signature"
                  width={annotation.width}
                  height={annotation.height}
                />
              </div>
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default AnnotationLayer;