// FILE: api/generate.js
// Vercel Serverless Function for a single AI model: gemini-2.5-flash-preview-05-20

// The API key must be stored as an environment variable in Vercel.
// Example: GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;

export default async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { chatHistory } = req.body;

    if (!chatHistory || chatHistory.length === 0) {
        return res.status(400).json({ error: 'Chat history is required.' });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key not found in environment variables.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const payload = { contents: chatHistory };
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            throw new Error(`API error: ${geminiResponse.statusText}`);
        }

        const result = await geminiResponse.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            res.status(200).json({ text });
        } else {
            res.status(500).json({ error: 'Failed to get a response from Gemini.' });
        }

    } catch (error) {
        console.error('Error calling the API:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}
