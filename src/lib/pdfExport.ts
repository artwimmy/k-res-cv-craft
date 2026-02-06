import jsPDF from 'jspdf';
import type { CVData } from '@/pages/Index';

interface PDFExportOptions {
  anonymize: boolean;
  logoUrl?: string;
}

// A4 dimensions in mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_H - MARGIN - 10; // 10mm safety buffer

// Colors (RGB)
const COLOR_BLACK: [number, number, number] = [30, 30, 30];
const COLOR_GREY: [number, number, number] = [100, 100, 100];
const COLOR_LIGHT_GREY: [number, number, number] = [180, 180, 180];
const COLOR_PRIMARY: [number, number, number] = [59, 130, 246]; // blue-ish

// ── helpers ──────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('.');
}
function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';
  return `${local.charAt(0)}***@${domain}`;
}
function maskPhone(phone: string) {
  if (phone.length < 4) return '***';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

async function fetchLogoAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve({ dataUrl: reader.result as string, width: img.width, height: img.height });
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

// ── PDF builder ──────────────────────────────────────────
export async function generatePDFDocument(cvData: CVData, options: PDFExportOptions): Promise<jsPDF> {
  const { anonymize, logoUrl } = options;

  const displayName = anonymize ? getInitials(cvData.candidate.fullName) : cvData.candidate.fullName;
  const displayEmail = anonymize && cvData.candidate.email ? maskEmail(cvData.candidate.email) : cvData.candidate.email;
  const displayPhone = anonymize && cvData.candidate.phone ? maskPhone(cvData.candidate.phone) : cvData.candidate.phone;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // ── ensure space, add page if needed ───────────────────
  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM_LIMIT) {
      pdf.addPage();
      y = MARGIN + 8; // top padding on continuation pages
    }
  };

  // ── draw a horizontal rule ─────────────────────────────
  const drawRule = (color: [number, number, number] = COLOR_LIGHT_GREY) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
  };

  // ── wrap text and return lines ─────────────────────────
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, maxWidth) as string[];
  };

  // ── Logo ───────────────────────────────────────────────
  if (logoUrl) {
    const logo = await fetchLogoAsDataUrl(logoUrl);
    if (logo) {
      const maxH = 12;
      const ratio = logo.width / logo.height;
      const h = maxH;
      const w = h * ratio;
      pdf.addImage(logo.dataUrl, 'PNG', PAGE_W - MARGIN - w, MARGIN, w, h);
    }
  }

  // ── Name ───────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...COLOR_BLACK);
  pdf.text(displayName, MARGIN, y + 7);
  y += 12;

  // ── Contact line ───────────────────────────────────────
  const contactParts: string[] = [];
  if (cvData.candidate.location && !anonymize) contactParts.push(cvData.candidate.location);
  if (displayEmail) contactParts.push(displayEmail);
  if (displayPhone) contactParts.push(displayPhone);

  if (contactParts.length > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLOR_GREY);
    pdf.text(contactParts.join('  •  '), MARGIN, y + 3);
    y += 7;
  }

  // ── Links ──────────────────────────────────────────────
  if (cvData.candidate.links?.length > 0 && !anonymize) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLOR_PRIMARY);
    const linkTexts = cvData.candidate.links.map(l => l.url || l.label).join('  |  ');
    pdf.text(linkTexts, MARGIN, y + 3);
    y += 6;
  }

  y += 2;
  drawRule(COLOR_PRIMARY);
  y += 2;

  // ── Section heading helper ─────────────────────────────
  const sectionHeading = (title: string) => {
    ensureSpace(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...COLOR_BLACK);
    pdf.text(title.toUpperCase(), MARGIN, y + 4);
    y += 8;
    drawRule();
  };

  // ── Professional Summary ───────────────────────────────
  if (cvData.summary) {
    sectionHeading('Professional Summary');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...COLOR_BLACK);
    const lines = wrapText(cvData.summary, CONTENT_W, 10);
    for (const line of lines) {
      ensureSpace(5);
      pdf.text(line, MARGIN, y + 3.5);
      y += 5;
    }
    y += 4;
  }

  // ── Skills ─────────────────────────────────────────────
  if (cvData.skills?.length > 0) {
    sectionHeading('Technical Skills');
    for (const skill of cvData.skills) {
      ensureSpace(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...COLOR_BLACK);
      const label = `${skill.category}: `;
      pdf.text(label, MARGIN, y + 3.5);
      const labelWidth = pdf.getTextWidth(label);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLOR_GREY);
      const itemsText = skill.items.join(', ');
      const availableWidth = CONTENT_W - labelWidth;
      const itemLines = wrapText(itemsText, availableWidth, 9.5);
      for (let i = 0; i < itemLines.length; i++) {
        if (i === 0) {
          pdf.text(itemLines[i], MARGIN + labelWidth, y + 3.5);
        } else {
          y += 4.5;
          ensureSpace(5);
          pdf.text(itemLines[i], MARGIN + labelWidth, y + 3.5);
        }
      }
      y += 5.5;
    }
    y += 2;
  }

  // ── Experience ─────────────────────────────────────────
  if (cvData.experience?.length > 0) {
    sectionHeading('Professional Experience');
    for (const exp of cvData.experience) {
      // Pre-calculate block height so we can avoid orphaned headers
      const descLines = exp.description ? wrapText(exp.description, CONTENT_W - 4, 9.5) : [];
      const blockHeight = 14 + descLines.length * 4.5;
      ensureSpace(Math.min(blockHeight, 30)); // at least keep title+company+first lines together

      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(...COLOR_BLACK);
      pdf.text(exp.title, MARGIN, y + 3.5);

      // Dates on the right
      if (exp.startDate || exp.endDate) {
        const dateStr = `${exp.startDate} – ${exp.endDate}`;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...COLOR_GREY);
        const dateW = pdf.getTextWidth(dateStr);
        pdf.text(dateStr, PAGE_W - MARGIN - dateW, y + 3.5);
      }
      y += 5.5;

      // Company & location
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...COLOR_PRIMARY);
      const companyLine = [exp.company, exp.location].filter(Boolean).join(' • ');
      pdf.text(companyLine, MARGIN, y + 3.5);
      y += 6;

      // Description
      if (descLines.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...COLOR_BLACK);
        for (const line of descLines) {
          ensureSpace(5);
          pdf.text(line, MARGIN + 2, y + 3.5);
          y += 4.5;
        }
      }
      y += 4;
    }
  }

  // ── Education ──────────────────────────────────────────
  if (cvData.education?.length > 0) {
    sectionHeading('Education');
    for (const edu of cvData.education) {
      ensureSpace(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...COLOR_BLACK);
      pdf.text(edu.degree, MARGIN, y + 3.5);

      if (edu.year) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...COLOR_GREY);
        const yearW = pdf.getTextWidth(edu.year);
        pdf.text(edu.year, PAGE_W - MARGIN - yearW, y + 3.5);
      }
      y += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...COLOR_GREY);
      pdf.text(edu.institution, MARGIN, y + 3.5);
      y += 7;
    }
  }

  // ── Certifications ─────────────────────────────────────
  if (cvData.certifications?.length > 0) {
    sectionHeading('Certifications');
    for (const cert of cvData.certifications) {
      ensureSpace(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...COLOR_BLACK);
      pdf.text(cert.name, MARGIN, y + 3.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLOR_GREY);
      const meta = [cert.issuer, cert.date].filter(Boolean).join(' • ');
      const metaW = pdf.getTextWidth(meta);
      pdf.text(meta, PAGE_W - MARGIN - metaW, y + 3.5);
      y += 6;
    }
  }

  // ── Languages ──────────────────────────────────────────
  if (cvData.languages?.length > 0) {
    sectionHeading('Languages');
    const langText = cvData.languages.map(l => `${l.name} (${l.level})`).join('  •  ');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLOR_BLACK);
    const langLines = wrapText(langText, CONTENT_W, 9.5);
    for (const line of langLines) {
      ensureSpace(5);
      pdf.text(line, MARGIN, y + 3.5);
      y += 5;
    }
  }

  return pdf;
}
