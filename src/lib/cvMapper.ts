import type { CVData } from '@/pages/Index';

// Helper function to extract email
function extractEmail(text: string): string {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

// Helper function to extract phone
function extractPhone(text: string): string {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/;
  const match = text.match(phoneRegex);
  return match ? match[0].trim() : '';
}

// Helper function to extract name (usually first line or near contact info)
function extractName(text: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  // Name is typically in the first few lines and doesn't contain special chars
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length > 2 && trimmed.length < 50 && 
        !/[@.]/.test(trimmed) && 
        !/\d{3}/.test(trimmed)) {
      return trimmed;
    }
  }
  return lines[0]?.trim() || '';
}

// Helper function to extract LinkedIn/GitHub URLs
function extractLinks(text: string): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;
  
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    links.push({ label: 'LinkedIn', url: `https://${linkedinMatch[0]}` });
  }
  
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    links.push({ label: 'GitHub', url: `https://${githubMatch[0]}` });
  }
  
  return links;
}

// Helper to extract section content
function extractSection(text: string, sectionNames: string[]): string {
  const lowerText = text.toLowerCase();
  
  for (const name of sectionNames) {
    const regex = new RegExp(`${name.toLowerCase()}[:\\s]+([\\s\\S]*?)(?=\\n[A-Z][a-z]+[:\\s]|$)`, 'i');
    const match = lowerText.match(regex);
    if (match) {
      const startIndex = match.index! + match[0].indexOf(match[1]);
      const extracted = text.substring(startIndex, startIndex + match[1].length);
      return extracted.trim();
    }
  }
  
  return '';
}

// Helper to extract experience entries
function extractExperience(text: string): CVData['experience'] {
  const experienceSection = extractSection(text, [
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'work history'
  ]);
  
  if (!experienceSection) return [];
  
  const experiences: CVData['experience'] = [];
  const entries = experienceSection.split(/\n(?=[A-Z])/);
  
  for (const entry of entries.slice(0, 5)) {
    if (entry.trim().length < 20) continue;
    
    const lines = entry.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    const dateRegex = /(\d{4}|present)/gi;
    const dates = entry.match(dateRegex) || [];
    
    experiences.push({
      company: lines[1] || '',
      role: lines[0] || '',
      employmentType: 'Full-time',
      location: '',
      startDate: dates[0] || '',
      endDate: dates[1] || 'Present',
      highlights: lines.slice(2, 5).filter(l => l.length > 10),
      tech: []
    });
  }
  
  return experiences;
}

// Helper to extract education
function extractEducation(text: string): CVData['education'] {
  const educationSection = extractSection(text, ['education', 'academic background', 'qualifications']);
  
  if (!educationSection) return [];
  
  const education: CVData['education'] = [];
  const entries = educationSection.split(/\n(?=[A-Z])/);
  
  for (const entry of entries.slice(0, 3)) {
    if (entry.trim().length < 10) continue;
    
    const lines = entry.split('\n').map(l => l.trim()).filter(Boolean);
    const dateRegex = /\d{4}/g;
    const dates = entry.match(dateRegex) || [];
    
    education.push({
      degree: lines[0] || '',
      field: '',
      institution: lines[1] || '',
      startDate: dates[0] || '',
      endDate: dates[1] || dates[0] || ''
    });
  }
  
  return education;
}

// Helper to extract skills
function extractSkills(text: string): CVData['skills'] {
  const skillsSection = extractSection(text, ['skills', 'technical skills', 'core competencies']);
  
  if (!skillsSection) return [];
  
  // Common skill patterns
  const skills: CVData['skills'] = [];
  const lines = skillsSection.split('\n').filter(l => l.trim());
  
  for (const line of lines.slice(0, 10)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const category = line.substring(0, colonIndex).trim();
      const items = line.substring(colonIndex + 1)
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(Boolean);
      
      if (items.length > 0) {
        skills.push({ category, items });
      }
    }
  }
  
  // If no categorized skills found, create a general category
  if (skills.length === 0 && skillsSection) {
    const allSkills = skillsSection
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 30)
      .slice(0, 15);
    
    if (allSkills.length > 0) {
      skills.push({ category: 'Technical Skills', items: allSkills });
    }
  }
  
  return skills;
}

export function mapTextToCVData(text: string): CVData {
  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const links = extractLinks(text);
  
  const summarySection = extractSection(text, [
    'summary',
    'professional summary',
    'profile',
    'about',
    'objective'
  ]);
  
  return {
    candidate: {
      fullName: name,
      title: '',
      location: '',
      email,
      phone,
      links
    },
    summary: summarySection,
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    certifications: [],
    projects: [],
    languages: [],
    extras: []
  };
}
