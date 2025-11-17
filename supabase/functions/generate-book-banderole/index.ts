import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import QRCode from 'npm:qrcode@1.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const bookId = url.searchParams.get('bookId')

    if (!bookId) {
      return new Response('Missing bookId parameter', { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      'https://tdrrwgarryjjyoviktgf.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcnJ3Z2FycnlqanlvdmlrdGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MTg3ODEsImV4cCI6MjA0OTQ5NDc4MX0.C-gOY2RWMO3wGAuupznbT5m2A81yPwIFkmq597XlHrs'
    )

    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (error || !book) {
      console.error('Error fetching book:', error)
      return new Response('Book not found', { status: 404, headers: corsHeaders })
    }

    const bookUrl = `https://ideenfunken.lovable.app/books/${bookId}`
    const qrCodeDataUrl = await QRCode.toDataURL(bookUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Banderole - ${book.title}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      width: 297mm;
      height: 210mm;
      display: flex;
    }
    .side {
      flex: 1;
      padding: 20mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 2px dashed #ccc;
      position: relative;
    }
    .front {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    }
    .back {
      background: white;
    }
    .front::after {
      content: 'VORNE (Front)';
      position: absolute;
      top: 5mm;
      left: 5mm;
      font-size: 8pt;
      color: rgba(0,0,0,0.3);
    }
    .back::after {
      content: 'HINTEN (Back)';
      position: absolute;
      top: 5mm;
      left: 5mm;
      font-size: 8pt;
      color: rgba(0,0,0,0.3);
    }
    .logo-text {
      font-size: 14pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 10mm;
      text-align: center;
    }
    .qr-code {
      margin: 10mm 0;
    }
    .qr-code img {
      width: 50mm;
      height: 50mm;
      border: 3px solid #000;
      padding: 2mm;
      background: white;
    }
    .book-info {
      text-align: center;
      color: #000;
      font-size: 9pt;
      max-width: 80%;
      margin-top: 5mm;
    }
    .book-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 2mm;
    }
    .back-content {
      text-align: center;
      max-width: 80%;
    }
    .back-logo {
      width: 60mm;
      margin-bottom: 15mm;
    }
    .feedback-prompt {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10mm;
      line-height: 1.5;
    }
    .feedback-text {
      font-size: 10pt;
      color: #666;
      margin-top: 5mm;
    }
    .cut-instructions {
      position: absolute;
      bottom: 5mm;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8pt;
      color: #999;
      text-align: center;
    }
    @media print {
      .side::after {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="side front">
    <div class="logo-text">Ideenfunken</div>
    <div class="qr-code">
      <img src="${qrCodeDataUrl}" alt="QR Code" />
    </div>
    <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div>${book.author || ''}</div>
    </div>
    <div class="cut-instructions">
      Ausschneiden und um Buchrücken wickeln | Cut and wrap around book spine
    </div>
  </div>
  
  <div class="side back">
    <div class="back-content">
      <img src="/assets/images/make-it-in-schramberg-logo.jpg" alt="Make it in Schramberg" class="back-logo" />
      <div class="feedback-prompt">
        Vom Buch inspiriert?<br>
        Was war es?
      </div>
      <div class="feedback-text">
        Scanne den QR-Code und teile deine Gedanken auf Ideenfunken.
      </div>
    </div>
    <div class="cut-instructions">
      Dann wissen wir auch, dass das Buch wieder im Bücherschrank ist.
    </div>
  </div>
</body>
</html>
    `

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating banderole:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
