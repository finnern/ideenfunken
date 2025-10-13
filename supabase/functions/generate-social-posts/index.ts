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

    // Prepare prompt for AI
    const prompt = `Generate social media posts for the following book recommendation:

Book Title: ${book.title}
Author: ${book.author}
${book.description ? `Description: ${book.description}` : ''}
${book.inspiration_quote ? `Recommendation from poster: "${book.inspiration_quote}"` : ''}
${book.suggester_name ? `Suggested by: ${book.suggester_name}` : ''}

Additional context from editor: ${userInput || 'None provided'}

Please generate 3 engaging social media posts optimized for:
1. Facebook (conversational, can be longer, up to 400 characters)
2. LinkedIn (professional tone, focus on insights and learning, up to 300 characters)
3. Instagram (casual, engaging, use emojis, up to 250 characters, suggest 3-5 relevant hashtags)

Format your response as JSON with this structure:
{
  "facebook": "post text",
  "linkedin": "post text",
  "instagram": {
    "text": "post text",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
  }
}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Free during promotion period
        messages: [
          { 
            role: 'system', 
            content: 'You are a social media marketing expert. Generate engaging, authentic posts that capture the essence of book recommendations. Always return valid JSON only, no additional text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    // Parse the AI response
    let socialPosts;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = generatedContent.match(/```json\n?(.*?)\n?```/s) || 
                       generatedContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedContent;
      socialPosts = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      socialPosts = {
        facebook: generatedContent,
        linkedin: generatedContent,
        instagram: { text: generatedContent, hashtags: [] }
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
