
const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const TEXT_MODEL = 'llama3.2:3b';
const VISION_MODEL = 'qwen3-vl:4b';

export interface LLMResponse {
  content: string;
  error?: string;
}

export const processText = async (text: string, systemPrompt: string, jsonMode = false): Promise<LLMResponse> => {
  try {
    const body: Record<string, unknown> = {
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      stream: false,
      options: { temperature: 0 },
    };
    if (jsonMode) body.format = 'json';

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Ollama API Error:', errText);
      return { content: '', error: `Ollama request failed: ${errText}` };
    }

    const data = await response.json();
    return { content: data.message?.content ?? '' };
  } catch (error) {
    console.error('Ollama Network Error:', error);
    return { content: '', error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const processImage = async (base64Image: string, prompt: string, _apiKey?: string): Promise<LLMResponse> => {
  const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
            images: [rawBase64]
          }
        ],
        stream: false,
        options: {
          temperature: 0
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Ollama Vision API Error:', errText);
      return { content: '', error: `Ollama vision request failed: ${errText}` };
    }

    const data = await response.json();
    return { content: data.message?.content ?? '' };
  } catch (error) {
    console.error('Ollama Vision Network Error:', error);
    return { content: '', error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }
};
