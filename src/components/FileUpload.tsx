import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { CVData } from "@/pages/Index";
import { extractText } from "@/lib/cvParser";
import { mapTextToCVData } from "@/lib/cvMapper";

interface FileUploadProps {
  onFileParsed: (data: CVData, fileName: string) => void;
}

export const FileUpload = ({ onFileParsed }: FileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError("");

    try {
      toast.info(`Parsing ${file.name}...`);
      
      // Extract text from PDF or DOCX
      const text = await extractText(file);
      
      // Map extracted text to CV data structure
      const parsedData = mapTextToCVData(text);

      toast.success("CV parsed successfully!");
      onFileParsed(parsedData, file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CV. Please ensure it's a valid PDF or DOCX file.";
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">Upload Candidate CV</h2>
        <p className="text-lg text-muted-foreground">
          Transform any CV into our professional K-Resourcing template
        </p>
      </div>

      <Card className="border-2 border-dashed transition-all duration-300 hover:border-primary/50">
        <div
          {...getRootProps()}
          className={`p-12 cursor-pointer transition-colors duration-200 ${
            isDragActive ? 'bg-accent/50' : 'hover:bg-accent/20'
          } ${isProcessing ? 'cursor-wait opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-6">
            {isProcessing ? (
              <>
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-2">Processing CV...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting and normalizing data
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {isDragActive ? (
                      <Upload className="h-12 w-12 text-primary" />
                    ) : (
                      <FileText className="h-12 w-12 text-primary" />
                    )}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    {isDragActive ? 'Drop your CV here' : 'Drag & drop CV here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    PDF
                  </span>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    DOCX
                  </span>
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                    Max 10MB
                  </span>
                </div>

                <Button size="lg" className="mt-4">
                  <Upload className="mr-2 h-5 w-5" />
                  Select File
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Smart Parsing</h3>
              <p className="text-sm text-muted-foreground">
                Automatically extracts and structures CV data
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Live Preview</h3>
              <p className="text-sm text-muted-foreground">
                See changes in real-time as you edit
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Export Ready</h3>
              <p className="text-sm text-muted-foreground">
                Download as PDF, DOCX, or JSON
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
