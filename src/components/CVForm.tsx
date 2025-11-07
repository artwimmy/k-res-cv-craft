import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { CVData } from "@/pages/Index";

interface CVFormProps {
  cvData: CVData;
  onUpdate: (data: CVData) => void;
}

export const CVForm = ({ cvData, onUpdate }: CVFormProps) => {
  const updateField = (path: string[], value: any) => {
    const newData = { ...cvData };
    let current: any = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onUpdate(newData);
  };

  const addExperience = () => {
    const newData = { ...cvData };
    newData.experience.push({
      company: "",
      role: "",
      employmentType: "Full-time",
      location: "",
      startDate: "",
      endDate: "",
      highlights: [""],
      tech: []
    });
    onUpdate(newData);
  };

  const removeExperience = (index: number) => {
    const newData = { ...cvData };
    newData.experience.splice(index, 1);
    onUpdate(newData);
  };

  return (
    <div className="space-y-6">
      {/* Candidate Info */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Candidate Information</h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={cvData.candidate.fullName}
                onChange={(e) => updateField(['candidate', 'fullName'], e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={cvData.candidate.title}
                onChange={(e) => updateField(['candidate', 'title'], e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={cvData.candidate.email}
                onChange={(e) => updateField(['candidate', 'email'], e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={cvData.candidate.phone}
                onChange={(e) => updateField(['candidate', 'phone'], e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={cvData.candidate.location}
              onChange={(e) => updateField(['candidate', 'location'], e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Professional Summary</h2>
        <Textarea
          value={cvData.summary}
          onChange={(e) => updateField(['summary'], e.target.value)}
          rows={5}
          className="resize-none"
          placeholder="Brief professional summary..."
        />
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Experience</h2>
          <Button size="sm" onClick={addExperience}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>

        <div className="space-y-6">
          {cvData.experience.map((exp, index) => (
            <div key={index} className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-foreground">Role {index + 1}</h3>
                {cvData.experience.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...cvData.experience];
                        newExp[index].company = e.target.value;
                        updateField(['experience'], newExp);
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      value={exp.role}
                      onChange={(e) => {
                        const newExp = [...cvData.experience];
                        newExp[index].role = e.target.value;
                        updateField(['experience'], newExp);
                      }}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...cvData.experience];
                        newExp[index].startDate = e.target.value;
                        updateField(['experience'], newExp);
                      }}
                      placeholder="YYYY-MM"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...cvData.experience];
                        newExp[index].endDate = e.target.value;
                        updateField(['experience'], newExp);
                      }}
                      placeholder="YYYY-MM or Present"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={exp.location}
                      onChange={(e) => {
                        const newExp = [...cvData.experience];
                        newExp[index].location = e.target.value;
                        updateField(['experience'], newExp);
                      }}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label>Highlights (one per line)</Label>
                  <Textarea
                    value={exp.highlights.join('\n')}
                    onChange={(e) => {
                      const newExp = [...cvData.experience];
                      newExp[index].highlights = e.target.value.split('\n').filter(h => h.trim());
                      updateField(['experience'], newExp);
                    }}
                    rows={4}
                    className="mt-1.5 resize-none"
                    placeholder="• Key achievement or responsibility&#10;• Another achievement"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Skills</h2>
        <div className="space-y-4">
          {cvData.skills.map((skillGroup, index) => (
            <div key={index}>
              <Label>{skillGroup.category}</Label>
              <Input
                value={skillGroup.items.join(', ')}
                onChange={(e) => {
                  const newSkills = [...cvData.skills];
                  newSkills[index].items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  updateField(['skills'], newSkills);
                }}
                className="mt-1.5"
                placeholder="Skill 1, Skill 2, Skill 3"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Education</h2>
        <div className="space-y-4">
          {cvData.education.map((edu, index) => (
            <div key={index} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => {
                      const newEdu = [...cvData.education];
                      newEdu[index].degree = e.target.value;
                      updateField(['education'], newEdu);
                    }}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => {
                      const newEdu = [...cvData.education];
                      newEdu[index].institution = e.target.value;
                      updateField(['education'], newEdu);
                    }}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
