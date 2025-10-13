import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const isbn = url.searchParams.get('isbn')

    if (!isbn) {
      return new Response('ISBN parameter required', { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch book data
    const { data: book, error } = await supabase
      .from('books_public')
      .select('*')
      .eq('isbn', isbn)
      .maybeSingle()

    if (error || !book) {
      // Return default meta tags
      return new Response(generateHtml({
        title: 'Ideenfunken – Die Bücher, die Leben verändern',
        description: 'Entdecke, stimme ab und teile Bücher, die dein Leben verbessert haben.',
        image: 'https://ideenfunken.lovable.app/lovable-uploads/95bb2644-19b0-4a70-b00d-bfadeaafe50f.png',
        url: `https://ideenfunken.lovable.app/?isbn=${isbn}`
      }), {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Return book-specific meta tags
    return new Response(generateHtml({
      title: `${book.title} – Ideenfunken`,
      description: book.inspiration_quote || book.description || `${book.title} von ${book.author}`,
      image: book.cover_url || book.original_cover_url || 'https://ideenfunken.lovable.app/lovable-uploads/95bb2644-19b0-4a70-b00d-bfadeaafe50f.png',
      url: `https://ideenfunken.lovable.app/?isbn=${isbn}`
    }), {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Error generating OG meta:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

function generateHtml({ title, description, image, url }: {
  title: string
  description: string
  image: string
  url: string
}) {
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    
    <!-- Redirect to actual app -->
    <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
    <script>window.location.href = "${escapeHtml(url)}";</script>
  </head>
  <body>
    <p>Redirecting...</p>
  </body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
