
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileUploaded: (file: any) => void;
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const uploadFile = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Calculate file hash for deduplication
    const hash = await calculateHash(file);
    
    // Check if file already exists for this user
    const { data: existingFile } = await supabase
      .from('files')
      .select('*')
      .eq('hash', hash)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingFile) {
      throw new Error('File already exists in your vault');
    }

    // Check if file exists globally (for deduplication)
    const { data: globalFile } = await supabase
      .from('files')
      .select('*')
      .eq('hash', hash)
      .limit(1)
      .maybeSingle();

    let storagePath;
    
    if (globalFile) {
      // File exists globally, reuse storage path
      storagePath = globalFile.storage_path;
    } else {
      // Upload new file to storage
      const fileName = `${user.id}/${hash}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      storagePath = fileName;
    }

    // Create file record for this user
    const { data: newFileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        size: file.size,
        type: file.type,
        hash: hash,
        user_id: user.id,
        storage_path: storagePath
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return newFileRecord;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          const uploadedFile = await uploadFile(file);
          onFileUploaded(uploadedFile);
        } catch (error) {
          if (error instanceof Error && error.message.includes('already exists')) {
            toast({
              title: "File Already Exists",
              description: `${file.name} is already in your vault.`,
              variant: "destructive",
            });
          } else {
            throw error;
          }
        }
        
        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      toast({
        title: "Upload Complete",
        description: `Files processed successfully.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    }

    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upload Files</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Support for all file types with automatic deduplication
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Selected Files</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Uploading...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Smart Deduplication</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Files are automatically checked for duplicates using SHA256 hashing. 
                  If a file already exists, it won't be stored again, saving storage space.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={selectedFiles.length === 0 || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;
