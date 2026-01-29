import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Save, FileText, Loader2 } from "lucide-react";
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
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { saveCV, isSaving } = useCVs();
  const { logoUrl } = useAppSettings();
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!previewRef.current) {
      toast.error("Preview not available");
      return;
    }

    setIsExportingPDF(true);
    try {
      toast.info("Generating PDF...");
      
      const contentElement = previewRef.current.querySelector('.cv-preview-content') as HTMLElement;
      if (!contentElement) {
        toast.error("Preview content not found");
        setIsExportingPDF(false);
        return;
      }

      // Force parent visibility for capture
      const parentContainer = previewRef.current.parentElement;
      const parentOriginalStyles = parentContainer ? {
        display: parentContainer.style.display,
        visibility: parentContainer.style.visibility,
        position: parentContainer.style.position,
      } : null;
      
      if (parentContainer) {
        parentContainer.style.display = 'block';
        parentContainer.style.visibility = 'visible';
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      // A4 dimensions in mm and pixels (at 96 DPI)
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 12;
      const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - (MARGIN_MM * 2);
      const MM_TO_PX = 3.7795; // 96 DPI conversion
      const CONTENT_HEIGHT_PX = CONTENT_HEIGHT_MM * MM_TO_PX;

      // Find all sections that should not be split
      const sections = contentElement.querySelectorAll('[style*="breakInside"], [style*="pageBreakInside"], .space-y-6 > div');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
      
      if (sections.length > 0) {
        // Smart page breaking: render sections individually
        let currentPageY = 0;
        let isFirstPage = true;
        const scale = 2;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as HTMLElement;
          
          // Capture this section
          const sectionCanvas = await html2canvas(section, {
            scale,
            useCORS: true,
            backgroundColor: null,
            logging: false,
          });

          if (sectionCanvas.width === 0 || sectionCanvas.height === 0) continue;

          // Calculate section height in mm
          const sectionHeightPx = sectionCanvas.height / scale;
          const sectionWidthPx = sectionCanvas.width / scale;
          const scaleFactor = CONTENT_WIDTH_MM / sectionWidthPx;
          const sectionHeightMM = sectionHeightPx * scaleFactor;

          // Check if section fits on current page
          const remainingSpace = CONTENT_HEIGHT_MM - currentPageY;
          
          if (sectionHeightMM > remainingSpace && currentPageY > 0) {
            // Section won't fit, start new page
            pdf.addPage();
            currentPageY = 0;
            isFirstPage = false;
          }

          // Add section image to PDF
          const imgData = sectionCanvas.toDataURL('image/png');
          pdf.addImage(
            imgData, 
            'PNG', 
            MARGIN_MM, 
            MARGIN_MM + currentPageY, 
            CONTENT_WIDTH_MM, 
            sectionHeightMM
          );

          currentPageY += sectionHeightMM + 2; // Add small gap between sections
        }
      } else {
        // Fallback: capture entire content and paginate
        const canvas = await html2canvas(contentElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.cv-preview-content') as HTMLElement;
            if (clonedElement) {
              clonedElement.style.display = 'block';
              clonedElement.style.visibility = 'visible';
              clonedElement.style.opacity = '1';
              clonedElement.style.position = 'relative';
            }
          }
        });

        if (canvas.width === 0 || canvas.height === 0) {
          toast.error("Failed to capture content");
          setIsExportingPDF(false);
          return;
        }

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const scaleFactor = CONTENT_WIDTH_MM / (imgWidth / 2);
        const scaledTotalHeight = (imgHeight / 2) * scaleFactor;
        
        if (scaledTotalHeight <= CONTENT_HEIGHT_MM) {
          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, scaledTotalHeight);
        } else {
          const pageHeightPx = (CONTENT_HEIGHT_MM / scaleFactor) * 2;
          const totalPages = Math.ceil(imgHeight / pageHeightPx);

          for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();

            const sourceY = page * pageHeightPx;
            const sourceHeight = Math.min(pageHeightPx, imgHeight - sourceY);
            
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = imgWidth;
            pageCanvas.height = sourceHeight;
            
            const ctx = pageCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
              ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            }

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
            const pageScaledHeight = (sourceHeight / 2) * scaleFactor;
            pdf.addImage(pageImgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, pageScaledHeight);
          }
        }
      }

      // Restore parent
      if (parentContainer && parentOriginalStyles) {
        Object.assign(parentContainer.style, parentOriginalStyles);
      }
      
      pdf.save(`${fileName.replace(/\.[^/.]+$/, '')}_CV.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExportingPDF(false);
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
            <Button size="sm" onClick={handleExportPDF} disabled={isExportingPDF}>
              {isExportingPDF ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExportingPDF ? 'Generating...' : 'Export PDF'}
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

        {/* Right Pane: Preview - Always rendered but visually hidden on mobile when form is active */}
        <div 
          className={`overflow-x-auto ${activeTab === 'form' ? 'lg:block absolute lg:relative -left-[9999px] lg:left-0' : ''}`}
          style={{ visibility: activeTab === 'form' ? 'hidden' : 'visible' }}
        >
          <div ref={previewRef} className="min-w-fit lg:visible" style={{ visibility: 'visible' }}>
            <CVPreview cvData={cvData} />
          </div>
        </div>
      </div>
    </div>
  );
};