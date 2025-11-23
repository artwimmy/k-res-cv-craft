import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Download, Edit } from "lucide-react";
import { useCVs } from "@/hooks/useCVs";
import { formatDistanceToNow } from "date-fns";
import type { CVData } from "@/pages/Index";

interface CVListProps {
  onEdit: (id: string, cvData: CVData, fileName: string) => void;
}

export const CVList = ({ onEdit }: CVListProps) => {
  const { cvs, isLoading, deleteCV } = useCVs();

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
            
            <div className="flex gap-2 mt-4">
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
                onClick={() => {
                  // TODO: Implement download
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => deleteCV(cv.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
