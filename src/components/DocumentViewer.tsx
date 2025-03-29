/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import ReactSignatureCanvas from "react-signature-canvas";
import { v4 as uuidv4 } from "uuid";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Annotation types with more detailed properties
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

interface DocumentViewerProps {
  file: File;
  onAnnotationChange?: (annotations: Annotation[]) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  file,
  onAnnotationChange,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<AnnotationType | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#ffff00"); // Default highlight color
  const signatureCanvasRef = useRef<ReactSignatureCanvas>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [signatureModal, setSignatureModal] = useState<boolean>(false);
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(
    null
  );

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const saveSignature = (pageNumber: number) => {
    if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
      const dataUrl = signatureCanvasRef.current.toDataURL();

      setAnnotations((prev) => {
        const updatedAnnotations = [
          ...prev,
          {
            id: uuidv4(),
            type: "signature" as AnnotationType,
            x: 100,
            y: 50,
            width: 200,
            height: 100,
            pageNumber,
            signatureDataUrl: dataUrl,
          },
        ];
        onAnnotationChange?.(updatedAnnotations);
        return updatedAnnotations;
      });

      // Separate state updates
      setSignatureModal(false);
      //   setSignatureDataUrl(dataUrl);
    }
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    annotationId: string,
    pageContainer: HTMLDivElement
  ) => {
    // Prevent default to stop text selection or other browser behaviors
    e.preventDefault();

    const rect = pageContainer.getBoundingClientRect();
    const offsetX =
      e.clientX -
      rect.left -
      (annotationId
        ? annotations.find((a) => a.id === annotationId)?.x || 0
        : 0);
    const offsetY =
      e.clientY -
      rect.top -
      (annotationId
        ? annotations.find((a) => a.id === annotationId)?.y || 0
        : 0);

    // const startDragging = (moveEvent: MouseEvent) => {
    //   // Prevent default to stop text selection
    //   moveEvent.preventDefault();

    //   const newX = moveEvent.clientX - rect.left - offsetX;
    //   const newY = moveEvent.clientY - rect.top - offsetY;

    //   setAnnotations((prev) =>
    //     prev.map((annotation) =>
    //       annotation.id === annotationId
    //         ? { ...annotation, x: newX, y: newY }
    //         : annotation
    //     )
    //   );
    // };

    const startDragging = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - rect.left - offsetX;
      const newY = moveEvent.clientY - rect.top - offsetY;
      moveEvent.preventDefault();

      requestAnimationFrame(() => {
        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === annotationId
              ? { ...annotation, x: newX, y: newY }
              : annotation
          )
        );
      });
    };

    const stopDragging = () => {
      document.removeEventListener("mousemove", startDragging);
      document.removeEventListener("mouseup", stopDragging);
      setDraggedAnnotation(null);
    };

    document.addEventListener("mousemove", startDragging);
    document.addEventListener("mouseup", stopDragging);
    setDraggedAnnotation(annotationId);
  };

  const renderSignatureModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl mb-4">Draw Your Signature</h2>
        <ReactSignatureCanvas
          ref={signatureCanvasRef}
          canvasProps={{
            width: 400,
            height: 200,
            className: "border-2 border-gray-300",
          }}
          clearOnResize={false}
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={clearSignature}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
          <button
            onClick={() => saveSignature(currentPage)}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={() => setSignatureModal(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Underline and Highlight functionality
  const handleAnnotationStart = (e: React.MouseEvent, pageNumber: number) => {
    if (!currentTool) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation: Annotation = {
      id: uuidv4(),
      type: currentTool,
      color: selectedColor,
      x,
      y,
      width: 100, // default width
      height: currentTool === "underline" ? 2 : 20, // thin line for underline
      pageNumber,
    };

    setAnnotations((prev) => {
      const updatedAnnotations = [...prev, newAnnotation];
      onAnnotationChange?.(updatedAnnotations);
      return updatedAnnotations;
    });

    // For comment, show a prompt
    if (currentTool === "comment") {
      const commentInput = prompt("Enter your comment:");
      if (commentInput) {
        newAnnotation.text = commentInput;
        setAnnotations((prev) => {
          const updatedAnnotations = [
            ...prev.slice(0, -1),
            { ...newAnnotation },
          ];
          onAnnotationChange?.(updatedAnnotations);
          return updatedAnnotations;
        });
      }
    }
  };

  useEffect(() => {
    if (onAnnotationChange) {
      onAnnotationChange(annotations);
    }
  }, [annotations, onAnnotationChange]);

  const renderAnnotationTools = () => (
    <div className="flex space-x-2 p-2 bg-white shadow-md rounded-lg">
      <select
        value={currentTool || ""}
        onChange={(e) => {
          const tool = e.target.value as AnnotationType;
          setCurrentTool(tool);
          if (tool === "signature") {
            setSignatureModal(true);
          }
        }}
        className="border rounded p-1"
      >
        <option value="">Select Tool</option>
        <option value="highlight">Highlight</option>
        <option value="underline">Underline</option>
        <option value="comment">Comment</option>
        <option value="signature">Signature</option>
      </select>

      {(currentTool === "highlight" || currentTool === "underline") && (
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-10 h-10"
        />
      )}
    </div>
  );

  const renderAnnotations = (
    pageNumber: number,
    pageContainer: React.RefObject<HTMLDivElement>
  ) => {
    return annotations
      .filter((a) => a.pageNumber === pageNumber)
      .map((annotation) => {
        switch (annotation.type) {
          case "highlight":
            return (
              <div
                key={annotation.id}
                className="absolute opacity-50"
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
                className="absolute"
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
                className="absolute p-1 bg-transparent border border-black rounded text-black"
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                }}
              >
                {annotation.text}
              </div>
            );
          case "signature":
            // Only render if signatureDataUrl exists
            return annotation.signatureDataUrl ? (
              <div
                key={annotation.id}
                className={`absolute cursor-move ${
                  draggedAnnotation === annotation.id ? "opacity-50" : ""
                }`}
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                }}
                onMouseDown={(e) =>
                  pageContainer.current &&
                  handleMouseDown(e, annotation.id, pageContainer.current)
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
      });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Annotation Tools */}
      <div className="p-2 bg-gray-100">{renderAnnotationTools()}</div>

      {signatureModal && renderSignatureModal()}

      {/* Document Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
        >
          {Array.from(new Array(numPages), (_, index) => {
            const pageContainerRef: React.RefObject<HTMLDivElement | any> =
              React.createRef();
            return (
              <div
                key={`page_${index + 1}`}
                ref={pageContainerRef}
                className="relative mb-4"
                onMouseDown={(e) => handleAnnotationStart(e, index + 1)}
              >
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                <div
                  className="absolute top-0 left-0 pointer-events-none z-10"
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                  }}
                >
                  {renderAnnotations(index + 1, pageContainerRef)}
                </div>
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
};

export default DocumentViewer;
