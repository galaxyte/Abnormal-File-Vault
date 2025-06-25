
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import { Upload, Search, LogOut, User, File } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

interface FileData {
  id: number;
  filename: string;
  size: number;
  file_type: string;
  upload_date: string;
  file_hash: string;
  download_url: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.results || data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch files",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fetch files error:', error);
      toast({
        title: "Error",
        description: "Network error while fetching files",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleFileUploaded = (newFile: FileData) => {
    setFiles(prev => [newFile, ...prev]);
    setUploadModalOpen(false);
    toast({
      title: "Upload Successful",
      description: `${newFile.filename} has been uploaded successfully.`,
    });
  };

  const handleFileDelete = async (fileId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        toast({
          title: "File Deleted",
          description: "File has been successfully deleted.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete file error:', error);
      toast({
        title: "Error",
        description: "Network error while deleting file",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.file_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <File className="w-8 h-8 text-indigo-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Abnormal File Vault</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-1" />
                <span>Welcome back!</span>
              </div>
              <Button variant="outline" onClick={onLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{files.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatBytes(totalSize)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Storage Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Via Deduplication</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search files by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-white/20"
              />
            </div>
          </div>
          
          <Button onClick={() => setUploadModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>

        {/* File List */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Your Files</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <FileList 
                files={filteredFiles} 
                onDelete={handleFileDelete}
                onRefresh={fetchFiles}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <FileUpload
          onFileUploaded={handleFileUploaded}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
