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

      // Force parent visibility
      const parentContainer = previewRef.current.parentElement;
      const parentOriginalDisplay = parentContainer?.style.display || '';
      if (parentContainer) {
        parentContainer.style.display = 'block';
      }

      // A4 dimensions
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 15;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
      const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - (MARGIN_MM * 2);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Get all sections that should not be split
      const sections = contentElement.querySelectorAll('[style*="breakInside"], [style*="pageBreakInside"], .space-y-6 > div');
      
      // If no sections found, capture entire content at once
      if (sections.length === 0) {
        const canvas = await html2canvas(contentElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const scale = CONTENT_WIDTH_MM / (canvas.width / 2);
        const scaledHeight = (canvas.height / 2) * scale;
        
        pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, scaledHeight);
      } else {
        // Smart page breaking: capture sections and place them intelligently
        let currentY = MARGIN_MM;
        let currentPage = 0;
        
        // First, capture the entire content as one image
        const fullCanvas = await html2canvas(contentElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.cv-preview-content') as HTMLElement;
            if (clonedElement) {
              clonedElement.style.display = 'block';
              clonedElement.style.visibility = 'visible';
            }
          }
        });

        const fullImgWidth = fullCanvas.width;
        const scale = CONTENT_WIDTH_MM / (fullImgWidth / 2);
        
        // Get section positions relative to the content element
        const sectionData: { top: number; height: number; bottom: number }[] = [];
        const contentRect = contentElement.getBoundingClientRect();
        
        sections.forEach((section) => {
          const rect = (section as HTMLElement).getBoundingClientRect();
          const top = (rect.top - contentRect.top) * 2; // Scale factor of 2
          const height = rect.height * 2;
          sectionData.push({ top, height, bottom: top + height });
        });

        // Calculate page breaks based on sections
        const pageHeightPx = (CONTENT_HEIGHT_MM / scale) * 2;
        const breaks: number[] = [0]; // Start positions for each page
        let currentBreak = 0;

        while (currentBreak < fullCanvas.height) {
          let nextBreak = currentBreak + pageHeightPx;
          
          // Find if we're cutting through a section
          for (const section of sectionData) {
            // If the break would cut through this section
            if (nextBreak > section.top && nextBreak < section.bottom) {
              // Move the break to before this section starts (with a small buffer)
              if (section.top > currentBreak + 50) { // Ensure we have at least some content
                nextBreak = section.top - 10;
              }
              break;
            }
          }
          
          // Ensure we don't go backwards or get stuck
          if (nextBreak <= currentBreak) {
            nextBreak = currentBreak + pageHeightPx;
          }
          
          if (nextBreak >= fullCanvas.height) {
            breaks.push(fullCanvas.height);
            break;
          }
          
          breaks.push(nextBreak);
          currentBreak = nextBreak;
        }

        // Render each page
        for (let i = 0; i < breaks.length - 1; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const startY = breaks[i];
          const endY = breaks[i + 1];
          const sliceHeight = endY - startY;

          // Create canvas for this page slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = fullImgWidth;
          pageCanvas.height = sliceHeight;

          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            
            ctx.drawImage(
              fullCanvas,
              0, startY,
              fullImgWidth, sliceHeight,
              0, 0,
              fullImgWidth, sliceHeight
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const pageScaledHeight = (sliceHeight / 2) * scale;

          pdf.addImage(pageImgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, pageScaledHeight);
        }
      }

      // Restore parent container
      if (parentContainer) {
        parentContainer.style.display = parentOriginalDisplay;
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