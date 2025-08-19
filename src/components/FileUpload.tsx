import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface Team {
  TeamName: string;
  GitHubURL: string;
}

interface FileUploadProps {
  onDataLoaded: (teams: Team[]) => void;
  onError: (error: string) => void;
}

export function FileUpload({ onDataLoaded, onError }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const processExcelFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Team[];
      
      // Validate required columns
      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }
      
      const firstRow = jsonData[0];
      if (!('TeamName' in firstRow) || !('GitHubURL' in firstRow)) {
        throw new Error('Excel file must contain "TeamName" and "GitHubURL" columns');
      }

      // Filter out invalid rows
      const validTeams = jsonData.filter(team => 
        team.TeamName && team.GitHubURL && 
        typeof team.TeamName === 'string' && 
        typeof team.GitHubURL === 'string'
      );

      if (validTeams.length === 0) {
        throw new Error('No valid team data found in Excel file');
      }

      onDataLoaded(validTeams);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      onError(error instanceof Error ? error.message : 'Failed to process Excel file');
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onDataLoaded, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processExcelFile(file);
    }
  }, [processExcelFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isProcessing
  });

  const clearFile = () => {
    setUploadedFile(null);
  };

  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      <div className="relative p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Upload Team Data
          </h2>
          <p className="text-muted-foreground">
            Upload an Excel file with TeamName and GitHubURL columns
          </p>
        </div>

        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-300 ease-smooth
              ${isDragActive 
                ? 'border-primary bg-primary/10 scale-105' 
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <div className={`
                p-4 rounded-full transition-all duration-300
                ${isDragActive ? 'bg-primary/20 shadow-glow' : 'bg-muted/20'}
              `}>
                <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              
              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your Excel file'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (xlsx, xls, csv)
                </p>
                
                <Button 
                  variant="outline" 
                  disabled={isProcessing}
                  className="bg-gradient-primary text-primary-foreground border-0 hover:opacity-90"
                >
                  {isProcessing ? 'Processing...' : 'Select File'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/20 rounded-lg p-6 text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-medium">{uploadedFile}</span>
            </div>
            
            <div className="flex justify-center space-x-2">
              <Button 
                variant="outline" 
                onClick={clearFile}
                className="text-muted-foreground hover:text-foreground"
              >
                Upload Different File
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/10 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">File Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li>• Excel file (.xlsx, .xls) or CSV file</li>
                <li>• Must contain columns: "TeamName" and "GitHubURL"</li>
                <li>• GitHub URLs should be in format: https://github.com/owner/repo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}