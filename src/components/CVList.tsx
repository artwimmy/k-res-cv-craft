import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Trash2, Download, Edit, Sparkles, Loader2 } from "lucide-react";
import { useCVs, SavedCV } from "@/hooks/useCVs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatDistanceToNow } from "date-fns";
import { generateWordDocument } from "@/lib/wordExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CVData } from "@/pages/Index";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CVListProps {
  onEdit: (id: string, cvData: CVData, fileName: string) => void;
}

export const CVList = ({ onEdit }: CVListProps) => {
  const { cvs, isLoading, deleteCV } = useCVs();
  const { logoUrl } = useAppSettings();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [profileDescription, setProfileDescription] = useState<string>("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Download dialog state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [selectedCV, setSelectedCV] = useState<SavedCV | null>(null);
  const [anonymizeDownload, setAnonymizeDownload] = useState(false);

  const handleGenerateProfile = async (cvData: CVData, cvId: string) => {
    setGeneratingId(cvId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-profile', {
        body: { cvData }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setProfileDescription(data.profileDescription);
      setShowProfileDialog(true);
    } catch (error) {
      console.error('Error generating profile:', error);
      toast.error('Failed to generate profile description');
    } finally {
      setGeneratingId(null);
    }
  };

  const openDownloadDialog = (cv: SavedCV) => {
    setSelectedCV(cv);
    setAnonymizeDownload(false);
    setShowDownloadDialog(true);
  };

  const handleDownload = async () => {
    if (!selectedCV) return;
    
    setDownloadingId(selectedCV.id);
    setShowDownloadDialog(false);
    
    try {
      const blob = await generateWordDocument(selectedCV.cv_data, {
        anonymize: anonymizeDownload,
        logoUrl: logoUrl || undefined,
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baseName = selectedCV.file_name.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}_CV${anonymizeDownload ? '_anon' : ''}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Downloaded successfully!");
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download CV');
    } finally {
      setDownloadingId(null);
      setSelectedCV(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileDescription);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading CVs...</div>
      </div>
    );
  }

  if (cvs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No CVs saved yet</h3>
        <p className="text-muted-foreground">
          Upload a CV to get started
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Saved CVs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <Card key={cv.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{cv.cv_data.candidate.fullName}</h3>
                  <p className="text-sm text-muted-foreground truncate">{cv.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {formatDistanceToNow(new Date(cv.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleGenerateProfile(cv.cv_data, cv.id)}
                  disabled={generatingId === cv.id}
                >
                  {generatingId === cv.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate Profile Description
                    </>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => onEdit(cv.id, cv.cv_data, cv.file_name)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openDownloadDialog(cv)}
                    disabled={downloadingId === cv.id}
                  >
                    {downloadingId === cv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteCV(cv.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Download Options Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download CV</DialogTitle>
            <DialogDescription>
              Choose your download options for {selectedCV?.cv_data.candidate.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymize-download" 
                checked={anonymizeDownload}
                onCheckedChange={(checked) => setAnonymizeDownload(checked === true)}
              />
              <Label htmlFor="anonymize-download" className="cursor-pointer">
                Anonymize personal data (use initials, mask email & phone)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Description Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Profile Description</DialogTitle>
            <DialogDescription>
              AI-generated professional profile based on the CV
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
              {profileDescription}
            </div>
            <Button onClick={copyToClipboard} className="w-full">
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
