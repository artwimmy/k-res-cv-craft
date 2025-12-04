import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating profile description for:", cvData.candidate?.fullName);

    const prompt = `Based on this CV data, write a professional profile description (2-3 paragraphs) that summarizes the candidate's experience, skills, and value proposition. Make it engaging and suitable for a recruitment profile.

CV Data:
- Name: ${cvData.candidate?.fullName || 'Unknown'}
- Email: ${cvData.candidate?.email || 'N/A'}
- Phone: ${cvData.candidate?.phone || 'N/A'}
- Location: ${cvData.candidate?.location || 'N/A'}
- LinkedIn: ${cvData.candidate?.linkedin || 'N/A'}

Summary: ${cvData.summary || 'No summary provided'}

Skills:
${cvData.skills?.map((s: any) => `- ${s.category}: ${s.items?.join(', ')}`).join('\n') || 'No skills listed'}

Experience:
${cvData.experience?.map((e: any) => `- ${e.title} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n') || 'No experience listed'}

Education:
${cvData.education?.map((e: any) => `- ${e.degree} from ${e.institution} (${e.year})`).join('\n') || 'No education listed'}

Languages: ${cvData.languages?.map((l: any) => `${l.name} (${l.level})`).join(', ') || 'Not specified'}

Write a compelling profile description that highlights their strengths and experience.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a professional recruiter writing candidate profile descriptions. Write clear, professional, and engaging descriptions that highlight the candidate's key strengths and experience." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const profileDescription = data.choices?.[0]?.message?.content;

    console.log("Profile description generated successfully");

    return new Response(JSON.stringify({ profileDescription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating profile:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
