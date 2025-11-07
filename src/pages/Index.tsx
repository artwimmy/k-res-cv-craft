import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { CVEditor } from "@/components/CVEditor";
import { FileText } from "lucide-react";

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
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const handleFileParsed = (data: CVData, fileName: string) => {
    setCVData(data);
    setUploadedFileName(fileName);
  };

  const handleBack = () => {
    setCVData(null);
    setUploadedFileName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">K-Resourcing CV Normalizer</h1>
              <p className="text-sm text-muted-foreground">Transform CVs into professional templates</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!cvData ? (
          <FileUpload onFileParsed={handleFileParsed} />
        ) : (
          <CVEditor 
            cvData={cvData} 
            onUpdate={setCVData} 
            fileName={uploadedFileName}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
