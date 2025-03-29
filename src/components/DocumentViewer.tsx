// DocumentViewer.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import { AnnotationType, Annotation } from "./types";
import AnnotationToolbar from "./AnnotationToolbar";
import SignatureModal from "./SignatureModal";
import AnnotationLayer from "./AnnotationLayer";
import ReactSignatureCanvas from "react-signature-canvas";
import CommentDialog from "./CommentDialog";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(null);
  
  // New state for comment dialog
  const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>("");
  const [pendingCommentAnnotation, setPendingCommentAnnotation] = useState<Partial<Annotation> | null>(null);

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

      setSignatureModal(false);
    }
  };

  // Handle comment dialog submission
  const handleCommentSave = () => {
    if (pendingCommentAnnotation && commentText.trim()) {
      const newAnnotation: Annotation = {
        id: uuidv4(),
        type: "comment",
        text: commentText,
        x: pendingCommentAnnotation.x || 0,
        y: pendingCommentAnnotation.y || 0,
        width: 150, // default width for comments
        height: 50, // default height
        pageNumber: pendingCommentAnnotation.pageNumber || 1,
      };

      setAnnotations((prev) => {
        const updatedAnnotations = [...prev, newAnnotation];
        onAnnotationChange?.(updatedAnnotations);
        return updatedAnnotations;
      });
    }
    
    setCommentDialogOpen(false);
    setCommentText("");
    setPendingCommentAnnotation(null);
  };

  // Underline and Highlight functionality
  const handleAnnotationStart = (e: React.MouseEvent, pageNumber: number) => {
    if (!currentTool) return;
    
    // Don't create new annotations when clicking on existing signatures
    // Check if we clicked on a signature element
    const target = e.target as HTMLElement;
    if (target.closest('.cursor-move')) {
      return;
    }

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // For comments, open the dialog instead of immediately creating the annotation
    if (currentTool === "comment") {
      setPendingCommentAnnotation({
        type: "comment",
        x,
        y,
        pageNumber,
      });
      setCommentDialogOpen(true);
      return;
    }

    const newAnnotation: Annotation = {
      id: uuidv4(),
      type: currentTool,
      color: selectedColor,
      x,
      y,
      width: currentTool === "highlight" ? 100 : 100, // default width
      height: currentTool === "underline" ? 2 : 25, // adjusted height for highlight
      pageNumber,
    };

    setAnnotations((prev) => {
      const updatedAnnotations = [...prev, newAnnotation];
      onAnnotationChange?.(updatedAnnotations);
      return updatedAnnotations;
    });
  };

  const handleToolChange = (tool: AnnotationType | null) => {
    setCurrentTool(tool);
    if (tool === "signature") {
      setSignatureModal(true);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    annotationId: string,
    pageContainer: HTMLDivElement
  ) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation to prevent creating new annotations

    const rect = pageContainer.getBoundingClientRect();
    const annotation = annotations.find((a) => a.id === annotationId);
    
    if (!annotation) return;
    
    const offsetX = e.clientX - rect.left - annotation.x;
    const offsetY = e.clientY - rect.top - annotation.y;

    const startDragging = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      const newX = Math.max(0, moveEvent.clientX - rect.left - offsetX);
      const newY = Math.max(0, moveEvent.clientY - rect.top - offsetY);

      requestAnimationFrame(() => {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === annotationId
              ? { ...a, x: newX, y: newY }
              : a
          )
        );
      });
    };

    const stopDragging = () => {
      document.removeEventListener("mousemove", startDragging);
      document.removeEventListener("mouseup", stopDragging);
      setDraggedAnnotation(null);
      
      // Trigger annotation change after drag is complete
      onAnnotationChange?.(annotations);
    };

    document.addEventListener("mousemove", startDragging);
    document.addEventListener("mouseup", stopDragging);
    setDraggedAnnotation(annotationId);
  };

  useEffect(() => {
    if (onAnnotationChange) {
      onAnnotationChange(annotations);
    }
  }, [annotations, onAnnotationChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Annotation Tools */}
      <div className="p-2 bg-gray-100">
        <AnnotationToolbar
          currentTool={currentTool}
          selectedColor={selectedColor}
          onToolChange={handleToolChange}
          onColorChange={handleColorChange}
        />
      </div>

      {signatureModal && (
        <SignatureModal
          signatureCanvasRef={signatureCanvasRef}
          onSave={() => saveSignature(currentPage)}
          onClear={clearSignature}
          onCancel={() => setSignatureModal(false)}
        />
      )}
      
      {/* Comment Dialog */}
      <CommentDialog 
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        commentText={commentText}
        onCommentChange={setCommentText}
        onSave={handleCommentSave}
      />

      {/* Document Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
        >
          {Array.from(new Array(numPages), (_, index) => {
            const pageContainerRef = React.createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement>;
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
                <AnnotationLayer
                  annotations={annotations.filter((a) => a.pageNumber === index + 1)}
                  pageContainerRef={pageContainerRef}
                  draggedAnnotation={draggedAnnotation}
                  onMouseDown={handleMouseDown}
                />
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
};

export default DocumentViewer;