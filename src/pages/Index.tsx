import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { CVEditor } from "@/components/CVEditor";
import { CVList } from "@/components/CVList";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { FileText, Settings as SettingsIcon } from "lucide-react";

export type CVData = {
  candidate: {
    fullName: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    links: Array<{ label: string; url: string }>;
  };
  summary: string;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  experience: Array<{
    company: string;
    role: string;
    employmentType: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string[];
    tech: string[];
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
  }>;
  languages: Array<{
    name: string;
    level: string;
  }>;
  extras: Array<{
    label: string;
    value: string;
  }>;
};

const Index = () => {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [currentCvId, setCurrentCvId] = useState<string | undefined>();
  const [view, setView] = useState<'list' | 'upload' | 'settings'>('list');

  const handleFileParsed = (data: CVData, fileName: string) => {
    setCvData(data);
    setUploadedFileName(fileName);
    setCurrentCvId(undefined);
  };

  const handleBack = () => {
    setCvData(null);
    setUploadedFileName('');
    setCurrentCvId(undefined);
    setView('list');
  };

  const handleEdit = (id: string, data: CVData, fileName: string) => {
    setCvData(data);
    setUploadedFileName(fileName);
    setCurrentCvId(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            K Resourcing CV Normalizer
          </h1>
          <p className="text-muted-foreground">
            Transform candidate CVs into professional templates
          </p>
        </div>

        {/* Navigation */}
        {!cvData && (
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Saved CVs
            </Button>
            <Button
              variant={view === 'upload' ? 'default' : 'outline'}
              onClick={() => setView('upload')}
            >
              Upload New CV
            </Button>
            <Button
              variant={view === 'settings' ? 'default' : 'outline'}
              onClick={() => setView('settings')}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        )}

        {/* Main Content */}
        {cvData ? (
          <CVEditor 
            cvData={cvData}
            onUpdate={setCvData}
            fileName={uploadedFileName}
            onBack={handleBack}
            cvId={currentCvId}
          />
        ) : view === 'upload' ? (
          <FileUpload onFileParsed={handleFileParsed} />
        ) : view === 'settings' ? (
          <Settings />
        ) : (
          <CVList onEdit={handleEdit} />
        )}
      </div>
    </div>
  );
};

export default Index;
