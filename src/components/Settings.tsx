import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export const Settings = () => {
  const { logoUrl, uploadLogo, isUploading } = useAppSettings();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadLogo(acceptedFiles[0]);
    }
  }, [uploadLogo]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Customize your K Resourcing CV template
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Company Logo</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your logo to appear on all CV templates (top-right corner)
            </p>
          </div>

          {logoUrl && (
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Current Logo</Label>
              <div className="border rounded-lg p-4 bg-muted/20 inline-block">
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="h-16 object-contain"
                />
              </div>
            </div>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground animate-pulse" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isDragActive ? 'Drop the logo here' : 'Drag & drop logo here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to select a file (PNG, JPG, SVG)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {logoUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
