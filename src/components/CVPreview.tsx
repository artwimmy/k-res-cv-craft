import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";
import type { CVData } from "@/pages/Index";
import { useAppSettings } from "@/hooks/useAppSettings";

interface CVPreviewProps {
  cvData: CVData;
}

export const CVPreview = ({ cvData }: CVPreviewProps) => {
  const { logoUrl } = useAppSettings();
  const formatDate = (date: string) => {
    if (date.toLowerCase() === 'present') return 'Present';
    const [year, month] = date.split('-');
    if (!year) return date;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return month ? `${monthNames[parseInt(month) - 1]} ${year}` : year;
  };

  return (
    <Card className="cv-preview-content p-8 bg-white shadow-lg relative print:shadow-none" style={{ width: '210mm', minWidth: '210mm' }}>
      {/* Logo in top-right */}
      {logoUrl && (
        <div className="absolute top-6 right-6">
          <img 
            src={logoUrl} 
            alt="K Resourcing Logo" 
            className="h-12 object-contain"
          />
        </div>
      )}

      <div className="space-y-6 text-sm">
        {/* Header - avoid page break inside */}
        <div className="border-b-2 border-primary pb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {cvData.candidate.fullName}
          </h1>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground mt-4">
            {cvData.candidate.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{cvData.candidate.location}</span>
              </div>
            )}
            {cvData.candidate.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{cvData.candidate.email}</span>
              </div>
            )}
            {cvData.candidate.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{cvData.candidate.phone}</span>
              </div>
            )}
          </div>

          {cvData.candidate.links.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-3">
              {cvData.candidate.links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2 text-primary">
                  {link.label.toLowerCase().includes('linkedin') && <Linkedin className="h-4 w-4" />}
                  {link.label.toLowerCase().includes('github') && <Github className="h-4 w-4" />}
                  <span className="text-sm">{link.url}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Professional Summary */}
        {cvData.summary && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h2 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide">
              Professional Summary
            </h2>
            <p className="text-foreground leading-relaxed">
              {cvData.summary}
            </p>
          </div>
        )}

        {/* Skills */}
        {cvData.skills.length > 0 && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h2 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide">
              Technical Skills
            </h2>
            <div className="space-y-2">
              {cvData.skills.map((skillGroup, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[100px]">
                    {skillGroup.category}:
                  </span>
                  <span className="text-foreground">
                    {skillGroup.items.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {cvData.experience.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide" style={{ pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
              Professional Experience
            </h2>
            <div className="space-y-5">
              {cvData.experience.map((exp, idx) => (
                <div key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {exp.title}
                      </h3>
                      <p className="text-primary font-semibold">
                        {exp.company}
                      </p>
                    </div>
                    <div className="text-right text-muted-foreground">
                      {exp.startDate && exp.endDate && (
                        <p>{exp.startDate} - {exp.endDate}</p>
                      )}
                      {exp.location && <p>{exp.location}</p>}
                    </div>
                  </div>
                  
                  {exp.description && (
                    <p className="text-foreground leading-relaxed ml-4">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education.length > 0 && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h2 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide">
              Education
            </h2>
            <div className="space-y-3">
              {cvData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                    <p className="text-foreground">{edu.institution}</p>
                  </div>
                  {edu.year && (
                    <p className="text-muted-foreground">{edu.year}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cvData.certifications && cvData.certifications.length > 0 && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h2 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide">
              Certifications
            </h2>
            <div className="space-y-2">
              {cvData.certifications.map((cert, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <span className="font-semibold text-foreground">{cert.name}</span>
                    <span className="text-muted-foreground"> - {cert.issuer}</span>
                  </div>
                  <span className="text-muted-foreground">{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {cvData.languages && cvData.languages.length > 0 && (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h2 className="text-lg font-bold text-foreground mb-3 uppercase tracking-wide">
              Languages
            </h2>
            <div className="flex flex-wrap gap-4">
              {cvData.languages.map((lang, idx) => (
                <div key={idx}>
                  <span className="font-semibold text-foreground">{lang.name}</span>
                  <span className="text-muted-foreground"> ({lang.level})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};