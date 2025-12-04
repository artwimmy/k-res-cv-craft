import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { CVData } from "@/pages/Index";
import { extractText } from "@/lib/cvParser";
import { supabase } from "@/integrations/supabase/client";

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
      toast.info(`Extracting text from ${file.name}...`);
      
      // Extract text from PDF or DOCX
      const text = await extractText(file);
      
      if (!text || text.trim().length < 50) {
        throw new Error("Could not extract enough text from the document. Please ensure the file is not empty or image-only.");
      }

      toast.info("AI is analyzing your CV...");
      
      // Use AI to parse the CV
      const { data, error: fnError } = await supabase.functions.invoke('parse-cv', {
        body: { text }
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Failed to process CV with AI');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.cvData) {
        throw new Error('No CV data returned from AI');
      }

      toast.success("CV parsed successfully with AI!");
      onFileParsed(data.cvData as CVData, file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CV. Please try again.";
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
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-2">AI is analyzing your CV...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting and structuring information intelligently
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
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">AI-Powered Parsing</h3>
              <p className="text-sm text-muted-foreground">
                Intelligently extracts and categorizes CV data
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
