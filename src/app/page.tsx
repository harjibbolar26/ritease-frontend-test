"use client";

import React, { useState } from "react";
import DocumentViewer from "@/components/DocumentViewer";
import { exportAnnotatedPDF } from "@/utils/pdfExport";
import { Annotation } from "@/components/types";
import { Loader2, Check, AlertCircle } from "lucide-react";

export default function PDFAnnotatorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setIsLoading(true);
      setFeedback({ message: "", type: null });

      try {
        // Simulate file processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPdfFile(uploadedFile);
        setFeedback({
          message: `Successfully loaded "${uploadedFile.name}"`,
          type: "success",
        });
      } catch (error) {
        setFeedback({
          message: "Failed to process the PDF file",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (uploadedFile) {
      setFeedback({
        message: "Invalid file format. Please upload a PDF file",
        type: "error",
      });
    }
  };

  // Drag and drop file upload
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setIsLoading(true);
      setFeedback({ message: "", type: null });

      try {
        // Simulate file processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPdfFile(droppedFile);
        setFeedback({
          message: `Successfully loaded "${droppedFile.name}"`,
          type: "success",
        });
      } catch (error) {
        setFeedback({
          message: "Failed to process the PDF file",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (droppedFile) {
      setFeedback({
        message: "Invalid file format. Please upload a PDF file",
        type: "error",
      });
    }
  };

  // Export annotated PDF
  const handleExport = async () => {
    if (pdfFile) {
      setIsExporting(true);
      setFeedback({ message: "", type: null });

      try {
        await exportAnnotatedPDF(pdfFile, annotations);
        setFeedback({
          message: "PDF successfully exported with annotations",
          type: "success",
        });
      } catch (error) {
        setFeedback({
          message: "Failed to export annotated PDF",
          type: "error",
        });
        console.error("Export error:", error);
      } finally {
        setIsExporting(false);
      }
    }
  };

  // Clear feedback after 5 seconds
  React.useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ message: "", type: null });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [feedback]);

  return (
    <div
      className="flex flex-col h-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="bg-white shadow-md p-4 flex flex-wrap items-center justify-between">
        {/* File Upload */}
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="pdf-upload"
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded ${
              isLoading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Upload PDF"
            )}
          </label>

          {/* Export Button */}
          {pdfFile && (
            <button
              onClick={handleExport}
              disabled={isExporting || annotations.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
                isExporting
                  ? "bg-green-300 cursor-not-allowed"
                  : annotations.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export Annotated PDF"
              )}
            </button>
          )}
        </div>

        {/* File info */}
        {pdfFile && !isLoading && (
          <div className="text-sm text-gray-600 mt-2 md:mt-0">
            Current file: <span className="font-medium">{pdfFile.name}</span>
          </div>
        )}
      </div>

      {/* Feedback message */}
      {feedback.message && (
        <div
          className={`px-4 py-2 mx-4 mt-2 rounded flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Document Viewer */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-500" />
          <p>Loading PDF document...</p>
        </div>
      ) : pdfFile ? (
        <DocumentViewer file={pdfFile} onAnnotationChange={setAnnotations} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed m-4 rounded-lg">
          <p className="mb-2">
            Drag and drop a PDF or click 'Upload PDF' to get started
          </p>
          <p className="text-sm text-gray-400">Supported file: PDF</p>
        </div>
      )}
    </div>
  );
}
