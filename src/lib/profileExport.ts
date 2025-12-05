import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header } from 'docx';
import jsPDF from 'jspdf';

interface ExportOptions {
  logoUrl?: string;
  candidateName: string;
}

async function fetchLogoAsBase64(url: string): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ base64, width: img.width, height: img.height });
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

export async function generateProfileWordDocument(
  profileDescription: string,
  options: ExportOptions
): Promise<Blob> {
  const { logoUrl, candidateName } = options;
  
  // Prepare header with logo
  const headerChildren: Paragraph[] = [];
  
  if (logoUrl) {
    const logoData = await fetchLogoAsBase64(logoUrl);
    if (logoData) {
      const maxHeight = 50;
      const aspectRatio = logoData.width / logoData.height;
      const height = maxHeight;
      const width = height * aspectRatio;
      
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: Uint8Array.from(atob(logoData.base64), c => c.charCodeAt(0)),
              transformation: { width, height },
              type: 'png',
            }),
          ],
        })
      );
    }
  }
  
  const doc = new Document({
    sections: [{
      headers: headerChildren.length > 0 ? {
        default: new Header({ children: headerChildren }),
      } : undefined,
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'Profile Description',
              bold: true,
              size: 32,
            }),
          ],
        }),
        // Candidate Name
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: candidateName,
              bold: true,
              size: 28,
            }),
          ],
        }),
        // Separator
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: '─'.repeat(40),
              color: '999999',
            }),
          ],
        }),
        // Profile Description
        ...profileDescription.split('\n').map(para => 
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: para,
                size: 24,
              }),
            ],
          })
        ),
      ],
    }],
  });
  
  return await Packer.toBlob(doc);
}

export async function generateProfilePDF(
  profileDescription: string,
  options: ExportOptions
): Promise<void> {
  const { logoUrl, candidateName } = options;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  
  // Add logo if available
  if (logoUrl) {
    try {
      const logoData = await fetchLogoAsBase64(logoUrl);
      if (logoData) {
        const maxHeight = 15;
        const aspectRatio = logoData.width / logoData.height;
        const height = maxHeight;
        const width = height * aspectRatio;
        
        // Position logo in top right
        pdf.addImage(
          `data:image/png;base64,${logoData.base64}`,
          'PNG',
          pageWidth - margin - width,
          margin,
          width,
          height
        );
        yPosition = margin + height + 10;
      }
    } catch (e) {
      console.error('Failed to add logo to PDF:', e);
    }
  }
  
  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Profile Description', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;
  
  // Candidate Name
  pdf.setFontSize(14);
  pdf.text(candidateName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Separator line
  pdf.setDrawColor(150, 150, 150);
  pdf.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
  yPosition += 15;
  
  // Profile Description
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const lines = pdf.splitTextToSize(profileDescription, contentWidth);
  
  for (const line of lines) {
    if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  }
  
  pdf.save(`${candidateName.replace(/\s+/g, '_')}_Profile.pdf`);
}
