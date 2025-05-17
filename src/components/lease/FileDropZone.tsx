
import React, { useCallback, useState } from 'react';
import { FileText, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FileDropZoneProps {
  accept: string;
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export function FileDropZone({ accept, onFileSelected, isLoading = false }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
      
      // Check if the file type is accepted
      if (accept.includes(fileExtension)) {
        onFileSelected(file);
      }
    }
  }, [accept, onFileSelected]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };
  
  return (
    <Card
      className={`border-2 border-dashed ${
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
      } relative rounded-lg transition-colors`}
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div 
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full py-12 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xl font-medium mb-1">Upload Lease Document</p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your lease document or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Accepted formats: {accept.replace(/\./g, '').toUpperCase().split(',').join(', ')}
            </p>
          </div>
          
          <input
            id="fileInput"
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
