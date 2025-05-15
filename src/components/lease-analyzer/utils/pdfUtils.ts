
import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js with a direct CDN URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file
 * @param file The PDF file to extract text from
 * @param onProgress Callback function to report progress
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromPdf(
  file: File, 
  onProgress?: (percent: number, currentPage: number, totalPages: number) => void
): Promise<string> {
  try {
    console.log("PDF.js worker source:", pdfjs.GlobalWorkerOptions.workerSrc);
    console.log("PDF.js version:", pdfjs.version);
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF file
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    
    // Add loading event listener
    loadingTask.onProgress = (progress) => {
      const percent = progress.loaded / progress.total * 100;
      console.log(`PDF loading progress: ${Math.round(percent)}%`);
    };
    
    console.log("Before PDF document loading");
    const pdf = await loadingTask.promise;
    console.log(`PDF document loaded successfully with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      if (onProgress) {
        onProgress(Math.round((i / pdf.numPages) * 100), i, pdf.numPages);
      }
      
      console.log(`Extracting text from page ${i}/${pdf.numPages}`);
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    console.log(`Extracted ${fullText.length} characters from PDF`);
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
