import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Save } from "lucide-react";
import { CVForm } from "@/components/CVForm";
import { CVPreview } from "@/components/CVPreview";
import type { CVData } from "@/pages/Index";
import { toast } from "sonner";

interface CVEditorProps {
  cvData: CVData;
  onUpdate: (data: CVData) => void;
  fileName: string;
  onBack: () => void;
}

export const CVEditor = ({ cvData, onUpdate, fileName, onBack }: CVEditorProps) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const handleExportPDF = () => {
    toast.success("PDF export coming soon!");
    // In production: generate PDF from CVPreview component
  };

  const handleExportDOCX = () => {
    toast.success("DOCX export coming soon!");
    // In production: generate DOCX using template
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
    toast.success("CV saved successfully!");
    // In production: save to backend storage
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportDOCX}>
              DOCX
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
        <div className={`${activeTab === 'form' ? 'hidden lg:block' : ''}`}>
          <div className="sticky top-6">
            <CVPreview cvData={cvData} />
          </div>
        </div>
      </div>
    </div>
  );
};
