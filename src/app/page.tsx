"use client";

import React, { useState } from "react";
import DocumentViewer, { Annotation } from "@/components/DocumentViewer";
import { exportAnnotatedPDF } from "@/utils/pdfExport";

export default function PDFAnnotatorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setPdfFile(uploadedFile);
    } else {
      alert('Please upload a valid PDF file');
    }
  };

  // Drag and drop file upload
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setPdfFile(droppedFile);
    } else {
      alert('Please drop a valid PDF file');
    }
  };

  // Export annotated PDF
  const handleExport = async () => {
    if (pdfFile) {
      try {
        await exportAnnotatedPDF(pdfFile, annotations);
      } catch (error) {
        alert('Failed to export PDF');
        console.error('Export error:', error);
      }
    }
  };

  return (
    <div
      className="flex flex-col h-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        {/* File Upload */}
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Upload PDF
          </label>

          {/* Export Button */}
          {pdfFile && (
            <button
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Export Annotated PDF
            </button>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      {pdfFile ? (
        <DocumentViewer 
          file={pdfFile} 
          onAnnotationChange={setAnnotations}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed m-4">
          Drag and drop a PDF or click &#39;Upload PDF&#39; to get started
        </div>
      )}
    </div>
  );
}