import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header } from "docx";
import type { CVData } from "@/pages/Index";

interface ExportOptions {
  anonymize: boolean;
  logoUrl?: string;
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('.');
}

function anonymizeEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';
  return `${local.charAt(0)}***@${domain}`;
}

function anonymizePhone(phone: string): string {
  if (phone.length < 4) return '***';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

async function fetchLogoAsBase64(url: string): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          // Scale logo to reasonable size (max 150px width)
          const maxWidth = 150;
          const scale = Math.min(1, maxWidth / img.width);
          resolve({
            base64,
            width: img.width * scale,
            height: img.height * scale
          });
        };
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateWordDocument(cvData: CVData, options: ExportOptions): Promise<Blob> {
  const { anonymize, logoUrl } = options;
  
  const displayName = anonymize ? getInitials(cvData.candidate.fullName) : cvData.candidate.fullName;
  const displayEmail = anonymize && cvData.candidate.email ? anonymizeEmail(cvData.candidate.email) : cvData.candidate.email;
  const displayPhone = anonymize && cvData.candidate.phone ? anonymizePhone(cvData.candidate.phone) : cvData.candidate.phone;

  // Prepare header with logo if available
  let headerChildren: Paragraph[] = [];
  
  if (logoUrl) {
    const logoData = await fetchLogoAsBase64(logoUrl);
    if (logoData) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: Uint8Array.from(atob(logoData.base64), c => c.charCodeAt(0)),
              transformation: {
                width: logoData.width,
                height: logoData.height,
              },
              type: "png",
            }),
          ],
        })
      );
    }
  }

  const sections = [];
  
  // Header section with logo
  const header = headerChildren.length > 0 ? new Header({ children: headerChildren }) : undefined;

  // Document content
  const children: Paragraph[] = [];

  // Name (centered)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: displayName,
          bold: true,
          size: 48, // 24pt
        }),
      ],
    })
  );

  // Contact info (centered)
  const contactParts: string[] = [];
  if (displayEmail) contactParts.push(displayEmail);
  if (displayPhone) contactParts.push(displayPhone);
  if (cvData.candidate.location && !anonymize) contactParts.push(cvData.candidate.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: contactParts.join(' | '),
            size: 22,
            color: "666666",
          }),
        ],
      })
    );
  }

  // Summary
  if (cvData.summary) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
        children: [
          new TextRun({
            text: cvData.summary,
            size: 24,
          }),
        ],
      })
    );
  }

  // Skills section
  if (cvData.skills && cvData.skills.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: 28,
            color: "333333",
          }),
        ],
      })
    );

    cvData.skills.forEach(skill => {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${skill.category}: `,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: skill.items.join(', '),
              size: 22,
            }),
          ],
        })
      );
    });
  }

  // Experience section
  if (cvData.experience && cvData.experience.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: "EXPERIENCE",
            bold: true,
            size: 28,
            color: "333333",
          }),
        ],
      })
    );

    cvData.experience.forEach(exp => {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 50 },
          children: [
            new TextRun({
              text: exp.title,
              bold: true,
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${exp.company} | ${exp.startDate} - ${exp.endDate}`,
              size: 22,
              color: "666666",
            }),
          ],
        })
      );
      if (exp.description) {
        children.push(
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: exp.description,
                size: 22,
              }),
            ],
          })
        );
      }
    });
  }

  // Education section
  if (cvData.education && cvData.education.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: 28,
            color: "333333",
          }),
        ],
      })
    );

    cvData.education.forEach(edu => {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: `${edu.institution} | ${edu.year}`,
              size: 22,
              color: "666666",
            }),
          ],
        })
      );
    });
  }

  // Languages section
  if (cvData.languages && cvData.languages.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: "LANGUAGES",
            bold: true,
            size: 28,
            color: "333333",
          }),
        ],
      })
    );

    const langText = cvData.languages.map(l => `${l.name} (${l.level})`).join(', ');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: langText,
            size: 22,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{
      headers: header ? { default: header } : undefined,
      children,
    }],
  });

  return await Packer.toBlob(doc);
}
