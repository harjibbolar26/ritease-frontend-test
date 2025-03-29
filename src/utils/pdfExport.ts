import { saveAs } from 'file-saver';
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';

interface Annotation {
  id: string;
  type: 'highlight' | 'underline' | 'comment' | 'signature';
  color?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  signatureDataUrl?: string; // Changed from signatureImage
}

export async function exportAnnotatedPDF(
  originalFile: File, 
  annotations: Annotation[]
): Promise<void> {
  try {
    // Read the original PDF file
    const originalPdfBytes = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // Get the first font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Process annotations
    for (const annotation of annotations) {
      const page = pdfDoc.getPages()[annotation.pageNumber - 1];
      const pageHeight = page.getHeight();

      switch (annotation.type) {
        case 'highlight':
          drawHighlight(page, annotation, pageHeight);
          break;
        
        case 'underline':
          drawUnderline(page, annotation, pageHeight);
          break;

        case 'comment':
          drawComment(page, annotation, pageHeight, font);
          break;
        
        case 'signature':
          await drawSignature(page, annotation, pageHeight, pdfDoc);
          break;
      }
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, 'annotated-document.pdf');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

// Helper function to draw signatures
async function drawSignature(
  page: PDFPage, 
  annotation: Annotation, 
  pageHeight: number, 
  pdfDoc: PDFDocument
) {
  // If a signature data URL is provided
  if (annotation.signatureDataUrl) {
    try {
      // Convert data URL to file
      const response = await fetch(annotation.signatureDataUrl);
      const blob = await response.blob();
      const imageBytes = await blob.arrayBuffer();
      
      // Embed the image
      const embeddedImage = await pdfDoc.embedPng(imageBytes);

      // Draw the signature image
      page.drawImage(embeddedImage, {
        x: annotation.x,
        y: pageHeight - annotation.y - annotation.height,
        width: annotation.width,
        height: annotation.height
      });
    } catch (error) {
      console.warn('Error embedding signature image:', error);
      
      // Fallback to text signature if image fails
      page.drawText('Signed', {
        x: annotation.x,
        y: pageHeight - annotation.y,
        size: 12,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: rgb(0, 0, 0)
      });
    }
  } else {
    // Default text signature if no image provided
    page.drawText('Signed', {
      x: annotation.x,
      y: pageHeight - annotation.y,
      size: 12,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0, 0, 0)
    });
  }
}

// Other helper functions remain the same
function drawHighlight(page: PDFPage, annotation: Annotation, pageHeight: number) {
  page.drawRectangle({
    x: annotation.x,
    y: pageHeight - annotation.y, 
    width: annotation.width,
    height: annotation.height,
    color: rgb(1, 1, 0), // Yellow highlight
    opacity: 0.5
  });
}

function drawUnderline(page: PDFPage, annotation: Annotation, pageHeight: number) {
  page.drawLine({
    start: { 
      x: annotation.x, 
      y: pageHeight - annotation.y 
    },
    end: { 
      x: annotation.x + annotation.width, 
      y: pageHeight - annotation.y 
    },
    thickness: annotation.height,
    color: rgb(0, 0, 0) // Black underline
  });
}

function drawComment(page: PDFPage, annotation: Annotation, pageHeight: number, font: PDFFont) {
  page.drawText(annotation.text || 'Comment', {
    x: annotation.x,
    y: pageHeight - annotation.y,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });
}