import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isbn, userInput } = await req.json();

    if (!isbn) {
      return new Response(
        JSON.stringify({ error: 'ISBN is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating social posts for ISBN:', isbn);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch book data from books_public view
    const { data: book, error: bookError } = await supabase
      .from('books_public')
      .select('*')
      .eq('isbn', isbn)
      .single();

    if (bookError || !book) {
      console.error('Book not found:', bookError);
      return new Response(
        JSON.stringify({ error: 'Book not found with ISBN: ' + isbn }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found book:', book.title);

    const bookUrl = `https://ideenfunken.lovable.app/?isbn=${isbn}`;

    // Prepare prompt for AI (in German)
    const prompt = `Du bist Social Media Manager für die Ideenfunken-Initiative in Schramberg - eine Community-Plattform für Buchempfehlungen.

BUCH-INFOS:
Titel: ${book.title}
Autor: ${book.author}
Empfehlung vom User: "${book.inspiration_quote || 'Keine Empfehlung vorhanden'}"
${userInput ? `Mark's Kommentar: "${userInput}"` : ''}

AUFGABE:
Erstelle 3 Social Media Posts (Facebook, LinkedIn, Instagram) nach EXAKT diesem Template:

---TEMPLATE START---
Interessanter Buchvorschlag in Ideenfunken:
${bookUrl}

📖 ${book.title} - ${book.author}

${book.inspiration_quote}

${userInput ? userInput : '[Hier könnte dein Kommentar stehen]'}

💡 Teile auch du dein Lieblingsbuch auf Ideenfunken und vote für andere Vorschläge! Die Top 10 gehen direkt an die Mediathek Schramberg.
https://ideenfunken.lovable.app/

#Schramberg #Buchempfehlungen #Community #Lesen
---TEMPLATE END---

WICHTIG:
- Verwende IMMER den Link ${bookUrl} am Anfang
- Verwende IMMER die User-Empfehlung im Original
- Füge Mark's Kommentar hinzu wenn vorhanden, sonst lass den Teil weg
- Am Ende IMMER: Call-to-Action + ideenfunken.lovable.app Link + Hashtags

PLATTFORM-ANPASSUNGEN:
- Facebook: Wie Template, etwas persönlicher/emotionaler Ton
- LinkedIn: Wie Template, aber professioneller Ton, betone Qualität/Innovation
- Instagram: Wie Template, aber kürzer, mehr Emojis, zusätzliche Hashtags

Antworte NUR mit einem JSON-Objekt in diesem exakten Format:
{
  "facebook": "kompletter Post Text",
  "linkedin": "kompletter Post Text",
  "instagram": "kompletter Post Text"
}`;

    // Call Anthropic Claude API
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Anthropic API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let postsText = aiData.content[0].text;

    // Parse the AI response
    let socialPosts;
    try {
      // Strip markdown code blocks if present
      postsText = postsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      socialPosts = JSON.parse(postsText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', postsText);
      socialPosts = {
        facebook: postsText,
        linkedin: postsText,
        instagram: postsText
      };
    }

    // Return response with book data and generated posts
    return new Response(
      JSON.stringify({
        success: true,
        book: {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          coverUrl: book.cover_url,
          description: book.description,
          inspirationQuote: book.inspiration_quote,
          suggesterName: book.suggester_name,
          goodreadsUrl: book.url_good_reads,
          moreInfoUrl: book.more_info_url,
        },
        posts: socialPosts,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-social-posts:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
