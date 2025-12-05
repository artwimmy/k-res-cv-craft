import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Save, FileText } from "lucide-react";
import { CVForm } from "@/components/CVForm";
import { CVPreview } from "@/components/CVPreview";
import type { CVData } from "@/pages/Index";
import { toast } from "sonner";
import { useCVs } from "@/hooks/useCVs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { generateWordDocument } from "@/lib/wordExport";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CVEditorProps {
  cvData: CVData;
  onUpdate: (data: CVData) => void;
  fileName: string;
  onBack: () => void;
  cvId?: string;
}

export const CVEditor = ({ cvData, onUpdate, fileName, onBack, cvId }: CVEditorProps) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [anonymize, setAnonymize] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const { saveCV, isSaving } = useCVs();
  const { logoUrl } = useAppSettings();
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!previewRef.current) {
      toast.error("Preview not available");
      return;
    }

    try {
      toast.info("Generating PDF...");
      
      // Get the actual content element inside the preview
      const contentElement = previewRef.current.querySelector('.cv-preview-content') || previewRef.current;
      
      const canvas = await html2canvas(contentElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Use JPEG format which is more reliable with jsPDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Scale to fill the page width with margins
      const margin = 10; // 10mm margins
      const availableWidth = pdfWidth - (margin * 2);
      const ratio = availableWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      
      // Handle multi-page if content is too long
      if (scaledHeight > pdfHeight - (margin * 2)) {
        const pageHeight = (pdfHeight - (margin * 2)) / ratio;
        let position = 0;
        
        while (position < imgHeight) {
          if (position > 0) {
            pdf.addPage();
          }
          pdf.addImage(
            imgData, 
            'JPEG', 
            margin, 
            margin - (position * ratio), 
            imgWidth * ratio, 
            imgHeight * ratio
          );
          position += pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'JPEG', margin, margin, availableWidth, scaledHeight);
      }
      
      pdf.save(`${fileName.replace(/\.[^/.]+$/, '')}_CV.pdf`);
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportDOCX = async () => {
    setIsExportingWord(true);
    try {
      toast.info("Generating Word document...");
      
      const blob = await generateWordDocument(cvData, {
        anonymize,
        logoUrl: logoUrl || undefined,
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}_CV${anonymize ? '_anon' : ''}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Word document exported successfully!");
    } catch (error) {
      console.error('Error generating DOCX:', error);
      toast.error("Failed to generate Word document");
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully!");
  };

  const handleSave = () => {
    saveCV({ fileName, cvData, id: cvId });
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {cvData.candidate.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            <div className="h-6 w-px bg-border" />

            {/* Anonymize option */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymize" 
                checked={anonymize}
                onCheckedChange={(checked) => setAnonymize(checked === true)}
              />
              <Label htmlFor="anonymize" className="text-sm cursor-pointer">
                Anonymize
              </Label>
            </div>
            
            <div className="h-6 w-px bg-border" />
            
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportDOCX}
              disabled={isExportingWord}
            >
              <FileText className="mr-2 h-4 w-4" />
              {isExportingWord ? 'Generating...' : 'DOCX'}
            </Button>
            <Button size="sm" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'form'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Edit Form
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Two-Pane Editor */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Pane: Form */}
        <div className={`${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
          <CVForm cvData={cvData} onUpdate={onUpdate} />
        </div>

        {/* Right Pane: Preview */}
        <div className={`${activeTab === 'form' ? 'hidden lg:block' : ''} overflow-x-auto`}>
          <div className="sticky top-6" ref={previewRef}>
            <CVPreview cvData={cvData} />
          </div>
        </div>
      </div>
    </div>
  );
};
