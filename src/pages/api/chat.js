// File: src/pages/api/chat.js
// Endpoint API untuk memanggil model Gemini 2.5 Flash.

export async function POST({ request }) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Input prompt is required." }), { status: 400 });
    }

    // Ambil API key dari Environment Variables
    const apiKey = import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is not configured." }), { status: 500 });
    }

    // Konfigurasi Gemini API
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Lakukan panggilan fetch ke Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const responseText = result.candidates[0].content.parts[0].text;
      
      return new Response(JSON.stringify({ text: responseText }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      throw new Error('Invalid response structure from Gemini API.');
    }

  } catch (error) {
    console.error('Error in API route:', error);
    return new Response(JSON.stringify({ error: `Terjadi kesalahan saat memproses permintaan: ${error.message}` }), { status: 500 });
  }
}
