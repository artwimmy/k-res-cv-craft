import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Link as LinkIcon } from "lucide-react";
import type { CVData } from "@/pages/Index";

interface CVFormProps {
  cvData: CVData;
  onUpdate: (data: CVData) => void;
}

export const CVForm = ({ cvData, onUpdate }: CVFormProps) => {
  const updateField = (path: (string | number)[], value: any) => {
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
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    });
    onUpdate(newData);
  };

  const removeExperience = (index: number) => {
    const newData = { ...cvData };
    newData.experience.splice(index, 1);
    onUpdate(newData);
  };

  const addLink = () => {
    const newData = { ...cvData };
    if (!newData.candidate.links) {
      newData.candidate.links = [];
    }
    newData.candidate.links.push({ label: "", url: "" });
    onUpdate(newData);
  };

  const removeLink = (index: number) => {
    const newData = { ...cvData };
    newData.candidate.links.splice(index, 1);
    onUpdate(newData);
  };

  return (
    <div className="space-y-6">
      {/* Candidate Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Candidate Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={cvData.candidate.fullName}
              onChange={(e) => updateField(['candidate', 'fullName'], e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={cvData.candidate.email}
                onChange={(e) => updateField(['candidate', 'email'], e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={cvData.candidate.phone}
                onChange={(e) => updateField(['candidate', 'phone'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={cvData.candidate.location}
              onChange={(e) => updateField(['candidate', 'location'], e.target.value)}
            />
          </div>

          {/* Social Links */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Social Links / Profiles
              </Label>
              <Button onClick={addLink} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            <div className="space-y-3">
              {(cvData.candidate.links || []).map((link, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Label (e.g., LinkedIn, GitHub)"
                      value={link.label}
                      onChange={(e) => updateField(['candidate', 'links', index, 'label'], e.target.value)}
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateField(['candidate', 'links', index, 'url'], e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!cvData.candidate.links || cvData.candidate.links.length === 0) && (
                <p className="text-sm text-muted-foreground">No social links added yet.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Professional Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Professional Summary</h2>
        <Textarea
          value={cvData.summary}
          onChange={(e) => updateField(['summary'], e.target.value)}
          rows={4}
          placeholder="Write a professional summary..."
        />
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Experience</h2>
          <Button onClick={addExperience} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>

        <div className="space-y-6">
          {cvData.experience.map((exp, index) => (
            <div key={index} className="border-l-2 border-primary pl-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute -left-2 top-0"
                onClick={() => removeExperience(index)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="space-y-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={exp.title}
                      onChange={(e) => updateField(['experience', index, 'title'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateField(['experience', index, 'company'], e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateField(['experience', index, 'location'], e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) => updateField(['experience', index, 'startDate'], e.target.value)}
                      placeholder="e.g., Jan 2020"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      value={exp.endDate}
                      onChange={(e) => updateField(['experience', index, 'endDate'], e.target.value)}
                      placeholder="e.g., Dec 2022 or Present"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateField(['experience', index, 'description'], e.target.value)}
                    rows={3}
                    placeholder="Describe your role and achievements..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Skills</h2>
        <div className="space-y-4">
          {cvData.skills.map((skillGroup, index) => (
            <div key={index}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={skillGroup.category}
                    onChange={(e) => updateField(['skills', index, 'category'], e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Skills (comma separated)</Label>
                  <Input
                    value={skillGroup.items.join(', ')}
                    onChange={(e) => updateField(['skills', index, 'items'], e.target.value.split(',').map(s => s.trim()))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Education</h2>
        <div className="space-y-4">
          {cvData.education.map((edu, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Degree</Label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateField(['education', index, 'degree'], e.target.value)}
                />
              </div>
              <div>
                <Label>Institution</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateField(['education', index, 'institution'], e.target.value)}
                />
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  value={edu.year}
                  onChange={(e) => updateField(['education', index, 'year'], e.target.value)}
                  placeholder="e.g., 2020"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
