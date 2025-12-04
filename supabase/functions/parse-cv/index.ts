import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an expert CV/resume parser. Your task is to extract structured information from CV text and return it as valid JSON.

Extract the following information and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):

{
  "candidate": {
    "name": "Full name of the candidate",
    "email": "Email address or empty string",
    "phone": "Phone number or empty string",
    "location": "City, Country or empty string",
    "links": [{"label": "LinkedIn/GitHub/Portfolio", "url": "URL"}]
  },
  "summary": "Professional summary or objective (2-4 sentences). If not explicitly stated, create a brief professional summary based on their experience.",
  "skills": [
    {
      "category": "Category name (e.g., Programming Languages, Frameworks, Tools, Soft Skills)",
      "items": ["skill1", "skill2", "skill3"]
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "location": "Location or empty string",
      "startDate": "Start date (e.g., Jan 2020)",
      "endDate": "End date or Present",
      "description": "Detailed description of responsibilities and achievements as a single paragraph"
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree and field of study",
      "year": "Graduation year or date range",
      "location": "Location or empty string"
    }
  ],
  "extras": {
    "interests": ["interest1", "interest2"],
    "publications": ["publication1"],
    "awards": ["award1"]
  }
}

Rules:
1. Extract ALL relevant information from the CV
2. If a field is not found, use an empty string or empty array as appropriate
3. For skills, categorize them intelligently (Programming, Frameworks, Tools, Languages, Soft Skills, etc.)
4. For experience descriptions, combine bullet points into cohesive paragraphs
5. Parse dates in a consistent format
6. Return ONLY the JSON object, no explanations or markdown`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid text parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing CV text, length:', text.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this CV and extract all information:\n\n${text}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, parsing JSON...');
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    try {
      const parsedCV = JSON.parse(cleanedContent);
      console.log('CV parsed successfully');
      
      return new Response(
        JSON.stringify({ cvData: parsedCV }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Content:', cleanedContent.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in parse-cv function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
