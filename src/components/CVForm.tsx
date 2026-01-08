import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, X, Link as LinkIcon, ChevronDown, Briefcase, GraduationCap, Wrench, User, FileText } from "lucide-react";
import { useState } from "react";
import type { CVData } from "@/pages/Index";

interface CVFormProps {
  cvData: CVData;
  onUpdate: (data: CVData) => void;
}

export const CVForm = ({ cvData, onUpdate }: CVFormProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    candidate: true,
    summary: true,
    experience: true,
    skills: true,
    education: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const addSkillCategory = () => {
    const newData = { ...cvData };
    newData.skills.push({ category: "", items: [] });
    onUpdate(newData);
  };

  const removeSkillCategory = (index: number) => {
    const newData = { ...cvData };
    newData.skills.splice(index, 1);
    onUpdate(newData);
  };

  const addEducation = () => {
    const newData = { ...cvData };
    newData.education.push({ degree: "", institution: "", year: "" });
    onUpdate(newData);
  };

  const removeEducation = (index: number) => {
    const newData = { ...cvData };
    newData.education.splice(index, 1);
    onUpdate(newData);
  };

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    section, 
    count,
    onAdd,
    addLabel 
  }: { 
    icon: React.ElementType; 
    title: string; 
    section: string;
    count?: number;
    onAdd?: () => void;
    addLabel?: string;
  }) => (
    <div className="flex items-center justify-between w-full">
      <CollapsibleTrigger className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections[section] ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      {onAdd && (
        <Button onClick={(e) => { e.stopPropagation(); onAdd(); }} size="sm" variant="outline" className="ml-2">
          <Plus className="h-4 w-4 mr-1" />
          {addLabel || 'Add'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Candidate Info */}
      <Collapsible open={openSections.candidate} onOpenChange={() => toggleSection('candidate')}>
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <SectionHeader icon={User} title="Personal Info" section="candidate" />
          </div>
          <CollapsibleContent>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</Label>
                <Input
                  id="fullName"
                  value={cvData.candidate.fullName}
                  onChange={(e) => updateField(['candidate', 'fullName'], e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={cvData.candidate.email}
                    onChange={(e) => updateField(['candidate', 'email'], e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</Label>
                  <Input
                    id="phone"
                    value={cvData.candidate.phone}
                    onChange={(e) => updateField(['candidate', 'phone'], e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</Label>
                <Input
                  id="location"
                  value={cvData.candidate.location}
                  onChange={(e) => updateField(['candidate', 'location'], e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Social Links */}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center mb-3">
                  <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <LinkIcon className="h-3 w-3" />
                    Social Links
                  </Label>
                  <Button onClick={addLink} size="sm" variant="ghost" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(cvData.candidate.links || []).map((link, index) => (
                    <div key={index} className="flex gap-2 items-center group">
                      <Input
                        placeholder="Label (LinkedIn, GitHub...)"
                        value={link.label}
                        onChange={(e) => updateField(['candidate', 'links', index, 'label'], e.target.value)}
                        className="flex-1 h-9"
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateField(['candidate', 'links', index, 'url'], e.target.value)}
                        className="flex-[2] h-9"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(index)}
                        className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!cvData.candidate.links || cvData.candidate.links.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No links added</p>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Professional Summary */}
      <Collapsible open={openSections.summary} onOpenChange={() => toggleSection('summary')}>
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <SectionHeader icon={FileText} title="Summary" section="summary" />
          </div>
          <CollapsibleContent>
            <div className="p-4">
              <Textarea
                value={cvData.summary}
                onChange={(e) => updateField(['summary'], e.target.value)}
                rows={4}
                placeholder="Write a compelling professional summary..."
                className="resize-none"
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Experience */}
      <Collapsible open={openSections.experience} onOpenChange={() => toggleSection('experience')}>
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <SectionHeader 
              icon={Briefcase} 
              title="Experience" 
              section="experience" 
              count={cvData.experience.length}
              onAdd={addExperience}
              addLabel="Add Role"
            />
          </div>
          <CollapsibleContent>
            <div className="divide-y">
              {cvData.experience.length === 0 ? (
                <div className="p-8 text-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No experience added yet</p>
                  <Button onClick={addExperience} variant="outline" size="sm" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Add your first role
                  </Button>
                </div>
              ) : (
                cvData.experience.map((exp, index) => (
                  <div key={index} className="p-4 group relative hover:bg-muted/20 transition-colors">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeExperience(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="space-y-3 pr-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job Title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => updateField(['experience', index, 'title'], e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Senior Developer"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateField(['experience', index, 'company'], e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Acme Corp"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</Label>
                          <Input
                            value={exp.location}
                            onChange={(e) => updateField(['experience', index, 'location'], e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Amsterdam"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</Label>
                          <Input
                            value={exp.startDate}
                            onChange={(e) => updateField(['experience', index, 'startDate'], e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Jan 2020"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Date</Label>
                          <Input
                            value={exp.endDate}
                            onChange={(e) => updateField(['experience', index, 'endDate'], e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Present"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateField(['experience', index, 'description'], e.target.value)}
                          rows={3}
                          className="mt-1 resize-none"
                          placeholder="Describe your responsibilities and achievements..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Skills */}
      <Collapsible open={openSections.skills} onOpenChange={() => toggleSection('skills')}>
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <SectionHeader 
              icon={Wrench} 
              title="Skills" 
              section="skills" 
              count={cvData.skills.length}
              onAdd={addSkillCategory}
              addLabel="Add Category"
            />
          </div>
          <CollapsibleContent>
            <div className="p-4 space-y-3">
              {cvData.skills.length === 0 ? (
                <div className="text-center py-6">
                  <Wrench className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                  <Button onClick={addSkillCategory} variant="outline" size="sm" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Add skill category
                  </Button>
                </div>
              ) : (
                cvData.skills.map((skillGroup, index) => (
                  <div key={index} className="flex gap-2 items-start group bg-muted/30 rounded-lg p-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</Label>
                        <Input
                          value={skillGroup.category}
                          onChange={(e) => updateField(['skills', index, 'category'], e.target.value)}
                          placeholder="e.g., Languages"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills (comma separated)</Label>
                        <Input
                          value={skillGroup.items.join(', ')}
                          onChange={(e) => updateField(['skills', index, 'items'], e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="e.g., JavaScript, Python, Go"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSkillCategory(index)}
                      className="h-9 w-9 mt-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Education */}
      <Collapsible open={openSections.education} onOpenChange={() => toggleSection('education')}>
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <SectionHeader 
              icon={GraduationCap} 
              title="Education" 
              section="education" 
              count={cvData.education.length}
              onAdd={addEducation}
              addLabel="Add Education"
            />
          </div>
          <CollapsibleContent>
            <div className="p-4 space-y-3">
              {cvData.education.length === 0 ? (
                <div className="text-center py-6">
                  <GraduationCap className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No education added yet</p>
                  <Button onClick={addEducation} variant="outline" size="sm" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Add education
                  </Button>
                </div>
              ) : (
                cvData.education.map((edu, index) => (
                  <div key={index} className="flex gap-2 items-start group bg-muted/30 rounded-lg p-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateField(['education', index, 'degree'], e.target.value)}
                          placeholder="e.g., BSc Computer Science"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateField(['education', index, 'institution'], e.target.value)}
                          placeholder="e.g., University of Amsterdam"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateField(['education', index, 'year'], e.target.value)}
                          placeholder="e.g., 2020"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEducation(index)}
                      className="h-9 w-9 mt-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};