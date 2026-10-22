import { GoogleGenAI } from '@google/genai';

const DETECTION_API_KEY = process.env.DETECTION_API_KEY;
const MIN_ESSAY_LENGTH = 40;

async function detectWithAI(essay) {
  const ai = new GoogleGenAI({ apiKey: DETECTION_API_KEY });

  const prompt = `You are a content authenticity detector specialised in analysing short student application essays.

Evaluate the following essay excerpt and determine whether it was likely written by an AI language model rather than a genuine high-school student.

Consider:
- Overly formal or corporate phrasing unusual for a teenager
- Generic template-like sentences ("I am passionate about...", "I believe that...")
- Lack of specific personal anecdotes or informal voice
- Perfect grammar and zero colloquialisms
- Predictable intro/body/conclusion structure in a short paragraph

Return ONLY valid JSON (no markdown, no extra text) in this exact schema:
{
  "aiProbability": <number 0.0-1.0>,
  "isAI": <true|false>,
  "flags": [<short string reason 1>, ...]
}

Essay:
"""
${essay.slice(0, 1200)}
"""`;

  const response = await ai.models.generateContent({
    model: process.env.DETECTION_MODEL || 'text-model-v1',
    contents: prompt
  });

  const raw = (response.text || '').trim();
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    aiProbability: Number(parsed.aiProbability ?? 0),
    isAI: Boolean(parsed.isAI),
    flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 6) : [],
    method: 'api'
  };
}

const AI_PHRASES = [
  'i am passionate about', 'i believe that', 'in conclusion', 'furthermore',
  'it is important to note', 'as a result', 'this experience has taught me',
  'i am excited about the opportunity', 'i am committed to', 'i strive to',
  'in today\'s world', 'in the modern world', 'as a dedicated',
  'with a strong foundation', 'i am eager to', 'my passion for',
  'i have always been', 'i look forward to', 'it is worth noting', 'to sum up'
];

function detectWithHeuristics(essay) {
  const lower = essay.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 5);

  const flags = [];
  let score = 0;

  const hitPhrases = AI_PHRASES.filter(p => lower.includes(p));
  if (hitPhrases.length >= 3) {
    score += 0.35;
    flags.push(`Contains ${hitPhrases.length} AI-common phrases`);
  } else if (hitPhrases.length >= 1) {
    score += 0.10;
    flags.push(`Contains AI-common phrase: "${hitPhrases[0]}"`);
  }

  if (sentences.length >= 3) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
    if (variance < 8) {
      score += 0.20;
      flags.push('Suspiciously uniform sentence lengths');
    }
  }

  if (words.length >= 30) {
    const ttr = new Set(words).size / words.length;
    if (ttr > 0.82) {
      score += 0.15;
      flags.push('Unusually high vocabulary diversity');
    }
  }

  const contractions = (essay.match(/\b\w+n't\b|\b(i'm|it's|i've|i'd|i'll|don't|can't|won't)\b/gi) || []).length;
  if (words.length > 40 && contractions === 0) {
    score += 0.10;
    flags.push('No contractions or informal language');
  }

  if (/^(dear|to whom|i am writing|my name is)/i.test(essay.trim())) {
    score += 0.10;
    flags.push('Starts with a formal boilerplate introduction');
  }

  const finalScore = Math.min(score, 1.0);
  return {
    aiProbability: parseFloat(finalScore.toFixed(2)),
    isAI: finalScore > 0.5,
    flags,
    method: 'heuristic'
  };
}

export async function analyzeEssay(essay) {
  const analyzedAt = new Date().toISOString();

  if (!essay || typeof essay !== 'string' || essay.trim().length < MIN_ESSAY_LENGTH) {
    return { aiProbability: 0, isAI: false, flags: ['Essay too short to analyse'], method: 'skipped', analyzedAt };
  }

  if (DETECTION_API_KEY) {
    try {
      const result = await detectWithAI(essay);
      return { ...result, analyzedAt };
    } catch (err) {
      console.warn('[aiDetection] API unavailable, falling back to heuristics:', err.message);
    }
  }

  return { ...detectWithHeuristics(essay), analyzedAt };
}
