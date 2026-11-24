import {
  BetterExpression,
  CEFRLevel,
  ChatMessage,
  DebateTopic,
  GrammarIssue,
  Persona,
  Stance,
  TurnAnalysis,
  WordPronunciation,
} from '../types';

const IPA_DICTIONARY: Record<string, { ipa: string; tip?: string }> = {
  think: { ipa: '/θɪŋk/', tip: 'Đặt đầu lưỡi giữa hai răng cho âm /θ/, tránh đọc thành /t/.' },
  thought: { ipa: '/θɔːt/', tip: 'Âm /θ/ nhẹ, không bật hơi như /t/.' },
  through: { ipa: '/θruː/', tip: 'Nối mượt /θ/ sang /r/.' },
  because: { ipa: '/bɪˈkɒz/', tip: 'Nhấn trọng âm ở âm tiết 2, kết thúc bằng âm /z/.' },
  technology: { ipa: '/tekˈnɒlədʒi/', tip: 'Trọng âm rơi vào âm tiết thứ 2 (-nɒl-).' },
  students: { ipa: '/ˈstjuːdənts/', tip: 'Nhớ bật rõ phụ âm cuối /ts/.' },
  student: { ipa: '/ˈstjuːdənt/', tip: 'Nhớ bật âm cuối /t/.' },
  homework: { ipa: '/ˈhoʊmwɜːrk/', tip: 'Trọng âm rơi vào âm tiết đầu.' },
  education: { ipa: '/ˌedʒuˈkeɪʃən/', tip: 'Trọng âm chính ở âm tiết thứ 3 (-keɪ-).' },
  pronunciation: { ipa: '/prəˌnʌnsiˈeɪʃən/', tip: 'Đọc là /nʌn/, không phải /naʊn/.' },
  environment: { ipa: '/ɪnˈvaɪrənmənt/', tip: 'Chú ý cụm /rən/ và âm cuối /t/.' },
  confidence: { ipa: '/ˈkɒnfɪdəns/', tip: 'Trọng âm âm tiết 1, âm cuối /s/.' },
  important: { ipa: '/ɪmˈpɔːrtənt/', tip: 'Nhấn âm tiết 2 (-pɔːr-).' },
  effective: { ipa: '/ɪˈfektɪv/', tip: 'Âm cuối /v/ rung nhẹ môi dưới.' },
  personalized: { ipa: '/ˈpɜːrsənəlaɪzd/', tip: 'Âm cuối -ed đọc là /d/.' },
  feedback: { ipa: '/ˈfiːdbæk/', tip: 'Kéo dài nguyên âm /iː/.' },
  critical: { ipa: '/ˈkrɪtɪkəl/', tip: 'Nhấn âm tiết 1.' },
  thinking: { ipa: '/ˈθɪŋkɪŋ/', tip: 'Giữ âm mũi /ŋ/ ở cả hai âm tiết.' },
  independent: { ipa: '/ˌɪndɪˈpendənt/', tip: 'Trọng âm chính ở -pen-.' },
  social: { ipa: '/ˈsoʊʃəl/', tip: 'Âm /ʃ/ tròn môi.' },
  media: { ipa: '/ˈmiːdiə/', tip: 'Ba âm tiết rõ ràng /miː-di-ə/.' },
  teenagers: { ipa: '/ˈtiːneɪdʒərz/', tip: 'Âm cuối /z/ rõ ràng.' },
  mental: { ipa: '/ˈmentəl/', tip: 'Nhấn âm tiết 1.' },
  health: { ipa: '/helθ/', tip: 'Đừng quên âm /θ/ ở cuối từ.' },
  grammar: { ipa: '/ˈɡræmər/', tip: 'Âm /æ/ mở miệng rộng.' },
  mistakes: { ipa: '/mɪˈsteɪks/', tip: 'Bật rõ cụm phụ âm cuối /ks/.' },
  practice: { ipa: '/ˈpræktɪs/', tip: 'Trọng âm âm tiết 1, kết thúc /s/.' },
  english: { ipa: '/ˈɪŋɡlɪʃ/', tip: 'Kết thúc bằng âm /ʃ/ tròn môi.' },
  argument: { ipa: '/ˈɑːrɡjumənt/', tip: 'Trọng âm rơi vào âm tiết đầu.' },
  believe: { ipa: '/bɪˈliːv/', tip: 'Kéo dài /iː/ và khép nhẹ âm cuối /v/.' },
  should: { ipa: '/ʃʊd/', tip: 'Âm /l/ là âm câm, không đọc.' },
  replace: { ipa: '/rɪˈpleɪs/', tip: 'Nhấn âm tiết 2, kết thúc /s/.' },
  traditional: { ipa: '/trəˈdɪʃənəl/', tip: 'Trọng âm ở -dɪ-.' },
  teachers: { ipa: '/ˈtiːtʃərz/', tip: 'Âm /tʃ/ bật hơi nhẹ, kết thúc /z/.' },
  climate: { ipa: '/ˈklaɪmət/', tip: 'Trọng âm âm tiết 1.' },
  government: { ipa: '/ˈɡʌvərnmənt/', tip: 'Nhấn âm tiết 1, đọc nhẹ âm /r/.' },
  sustainable: { ipa: '/səˈsteɪnəbəl/', tip: 'Trọng âm ở -steɪ-.' },
  scholarship: { ipa: '/ˈskɒlərʃɪp/', tip: 'Chữ "ch" đọc là /k/, không phải /tʃ/.' },
  leadership: { ipa: '/ˈliːdərʃɪp/', tip: 'Trọng âm âm tiết 1.' },
  resilience: { ipa: '/rɪˈzɪliəns/', tip: 'Trọng âm âm tiết 2 (-zɪl-).' },
  burnout: { ipa: '/ˈbɜːrnaʊt/', tip: 'Kéo dài âm /ɜːr/.' },
  productivity: { ipa: '/ˌproʊdʌkˈtɪvəti/', tip: 'Trọng âm chính ở -tɪv-.' },
  curriculum: { ipa: '/kəˈrɪkjələm/', tip: 'Trọng âm ở -rɪk-.' },
  however: { ipa: '/haʊˈevər/', tip: 'Nhấn âm tiết 2.' },
  opinion: { ipa: '/əˈpɪnjən/', tip: 'Trọng âm âm tiết 2 (-pɪn-).' },
  actually: { ipa: '/ˈæktʃuəli/', tip: 'Trọng âm âm tiết 1.' },
  speaking: { ipa: '/ˈspiːkɪŋ/', tip: 'Kéo dài nguyên âm /iː/.' },
  confidence_: { ipa: '/ˈkɒnfɪdəns/' },
};

const GRAMMAR_PATTERNS: Array<{
  regex: RegExp;
  getIssue: (match: RegExpMatchArray) => GrammarIssue;
}> = [
  {
    regex: /\bi am agree\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: 'I agree',
      rule: 'Động từ thường không đi kèm "to be"',
      explanationVi: '"Agree" là động từ thường, nên dùng "I agree" hoặc "I strongly agree" thay vì "I am agree".',
    }),
  },
  {
    regex: /\b(he|she|it|ai|technology|social media)\s+(don't|have|make|help|need|do)\b/i,
    getIssue: (m) => {
      const subj = m[1];
      const verb = m[2].toLowerCase();
      const map: Record<string, string> = {
        "don't": "doesn't",
        have: 'has',
        make: 'makes',
        help: 'helps',
        need: 'needs',
        do: 'does',
      };
      return {
        original: m[0],
        corrected: `${subj} ${map[verb] || verb + 's'}`,
        rule: 'Hòa hợp Chủ ngữ - Động từ (S-V Agreement)',
        explanationVi: `Chủ ngữ số ít "${subj}" cần chia động từ ở ngôi thứ 3 số ít.`,
      };
    },
  },
  {
    regex: /\bmore\s+(better|easier|harder|faster|stronger)\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: m[1],
      rule: 'So sánh kép (Double Comparative)',
      explanationVi: `Tính từ "${m[1]}" đã ở dạng so sánh hơn nên không cần thêm "more" phía trước.`,
    }),
  },
  {
    regex: /\bdepend\s+in\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: 'depend on',
      rule: 'Giới từ đi kèm động từ (Collocation)',
      explanationVi: 'Động từ "depend" luôn đi với giới từ "on" (depend on).',
    }),
  },
  {
    regex: /\bfocus\s+in\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: 'focus on',
      rule: 'Giới từ đi kèm động từ (Collocation)',
      explanationVi: 'Dùng "focus on" thay vì "focus in".',
    }),
  },
  {
    regex: /\bvery\s+much\s+(good|bad|important|useful)\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: `extremely ${m[1]}`,
      rule: 'Trạng từ bổ nghĩa tính từ',
      explanationVi: 'Không dùng "very much" trước tính từ thường; hãy dùng "very", "extremely" hoặc "highly".',
    }),
  },
  {
    regex: /\bpeople\s+is\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: 'people are',
      rule: 'Danh từ số nhiều bất quy tắc',
      explanationVi: '"People" là danh từ số nhiều nên luôn đi với động từ "are".',
    }),
  },
  {
    regex: /\bcan\s+to\s+([a-z]+)\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: `can ${m[1]}`,
      rule: 'Động từ khuyết thiếu (Modal Verb)',
      explanationVi: 'Sau "can / should / must" dùng động từ nguyên mẫu không "to".',
    }),
  },
  {
    regex: /\bin\s+my\s+opinion,\s*i\s+think\b/i,
    getIssue: (m) => ({
      original: m[0],
      corrected: 'In my opinion,',
      rule: 'Tránh lặp ý (Redundancy)',
      explanationVi: 'Chỉ cần dùng "In my opinion," hoặc "I firmly believe that..." để câu gọn và học thuật hơn.',
    }),
  },
];

const ADVANCED_WORDS = new Set([
  'however', 'furthermore', 'moreover', 'nevertheless', 'consequently', 'personalized',
  'critical', 'over-reliance', 'inequality', 'legislation', 'sustainable', 'resilience',
  'initiative', 'interdisciplinary', 'burnout', 'productivity', 'curriculum', 'accountability',
  'algorithm', 'double-edged', 'cyberbullying', 'hesitate', 'significant', 'ultimately',
  'comprehensive', 'evidence', 'perspective', 'counterargument', 'rebuttal', 'collaborate',
]);

function hashWord(word: string): number {
  let h = 0;
  for (let i = 0; i < word.length; i++) {
    h = (h * 31 + word.charCodeAt(i)) % 1000;
  }
  return h;
}

export function getSpeechRateForLevel(level: CEFRLevel, persona: Persona): number {
  const base: Record<CEFRLevel, number> = {
    A2: 0.86,
    B1: 0.94,
    B2: 1.02,
    C1: 1.1,
  };
  return Number((base[level] + (persona === 'judge' ? 0.04 : -0.04)).toFixed(2));
}

export function analyzeUtteranceLocal(
  text: string,
  topic: DebateTopic,
  currentLevel: CEFRLevel
): TurnAnalysis {
  const cleanWords = text
    .toLowerCase()
    .replace(/[^a-z'\-\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const wordCount = cleanWords.length;
  const uniqueWords = Array.from(new Set(cleanWords));
  const advancedHits = uniqueWords.filter((w) => ADVANCED_WORDS.has(w)).length;
  const lexicalRatio = wordCount > 0 ? uniqueWords.length / wordCount : 0.5;

  // 1. Grammar Issues
  const grammarIssues: GrammarIssue[] = [];
  for (const pattern of GRAMMAR_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      grammarIssues.push(pattern.getIssue(match));
    }
  }

  // Check capitalization or missing period for polish if very short
  if (wordCount < 6 && grammarIssues.length === 0) {
    grammarIssues.push({
      original: text.trim(),
      corrected: `${text.trim().replace(/\.?$/, '')}, because this directly impacts students' daily learning.`,
      rule: 'Mở rộng câu trả lời (Elaboration)',
      explanationVi: 'Câu nói khá ngắn. Trong phản biện & IELTS, hãy thêm vế nguyên nhân ("because...") hoặc ví dụ cụ thể.',
    });
  }

  // 2. Pronunciation IPA Analysis
  const pronunciationWords: WordPronunciation[] = [];
  const seen = new Set<string>();
  for (const w of cleanWords) {
    if (seen.has(w)) continue;
    const entry = IPA_DICTIONARY[w];
    if (entry) {
      seen.add(w);
      const pseudoScore = 72 + (hashWord(w + text.length) % 26); // 72..97
      pronunciationWords.push({
        word: w,
        ipa: entry.ipa,
        score: pseudoScore,
        tip: pseudoScore < 85 ? entry.tip : undefined,
      });
    }
    if (pronunciationWords.length >= 5) break;
  }

  // Ensure at least 3 topic words if user used short/unlisted words
  if (pronunciationWords.length < 3) {
    for (const v of topic.keyVocab) {
      if (pronunciationWords.length >= 4) break;
      const baseWord = v.word.toLowerCase().split(' ')[0];
      if (!seen.has(baseWord)) {
        seen.add(baseWord);
        pronunciationWords.push({
          word: v.word,
          ipa: v.ipa,
          score: 80 + (hashWord(v.word) % 16),
          tip: `Gợi ý luyện phát âm từ khóa chủ đề: ${v.meaningVi}.`,
        });
      }
    }
  }

  // 3. Better Expressions tailored to text & topic
  const betterExpressions: BetterExpression[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('i think') || lower.includes('in my opinion')) {
    betterExpressions.push({
      phrase: 'From my perspective, it is compelling to argue that...',
      level: 'C1 Academic',
      contextVi: 'Thay thế cho "I think / In my opinion" để mở đầu luận điểm sắc bén hơn.',
    });
  } else {
    betterExpressions.push({
      phrase: 'A key consideration here is that...',
      level: 'B2+ Debate',
      contextVi: 'Cách dẫn dắt luận điểm tự nhiên và thuyết phục khi tranh biện.',
    });
  }

  if (lower.includes('good') || lower.includes('bad') || lower.includes('help')) {
    betterExpressions.push({
      phrase: 'yield tangible benefits / pose a significant drawback',
      level: 'C1 IELTS 8.0',
      contextVi: 'Nâng cấp từ vựng "good / bad / help" thành cụm collocation chuẩn học thuật.',
    });
  } else if (lower.includes('but') || lower.includes('however')) {
    betterExpressions.push({
      phrase: 'Notwithstanding this concern, we must weigh the long-term impact...',
      level: 'C1 WSDC',
      contextVi: 'Cấu trúc phản biện nhượng bộ (concession) ghi điểm cao.',
    });
  } else {
    betterExpressions.push({
      phrase: `Strike a healthy balance between ${topic.keyVocab[0]?.word || 'innovation'} and human guidance`,
      level: 'B2+ Natural',
      contextVi: 'Cách diễn đạt quan điểm cân bằng, linh hoạt theo đúng chủ đề hiện tại.',
    });
  }

  if (topic.keyVocab[1]) {
    betterExpressions.push({
      phrase: `Without proper safeguards, this could undermine ${topic.keyVocab[1].word}.`,
      level: 'B2-C1',
      contextVi: `Tích hợp tự nhiên từ khóa "${topic.keyVocab[1].word}" (${topic.keyVocab[1].meaningVi}).`,
    });
  }

  // 4. Scores & Adaptive CEFR Level
  const fluencyScore = Math.min(96, Math.max(58, 62 + Math.min(24, wordCount * 1.1) + Math.round(lexicalRatio * 10)));
  const grammarScore = Math.min(97, Math.max(55, 91 - grammarIssues.length * 11 + (advancedHits > 0 ? 4 : 0)));
  const pronunciationScore =
    pronunciationWords.length > 0
      ? Math.round(pronunciationWords.reduce((sum, p) => sum + p.score, 0) / pronunciationWords.length)
      : 82;
  const argumentScore = Math.min(
    96,
    Math.max(
      60,
      65 +
        (wordCount >= 14 ? 12 : 4) +
        (lower.includes('because') || lower.includes('example') || lower.includes('however') ? 10 : 0) +
        advancedHits * 4
    )
  );
  const overallScore = Math.round((fluencyScore + grammarScore + pronunciationScore + argumentScore) / 4);

  let detectedLevel: CEFRLevel = currentLevel;
  if (overallScore >= 88 && wordCount >= 16) detectedLevel = 'C1';
  else if (overallScore >= 78 && wordCount >= 11) detectedLevel = 'B2';
  else if (overallScore >= 68) detectedLevel = 'B1';
  else detectedLevel = 'A2';

  const encouragementVi =
    overallScore >= 85
      ? 'Lập luận rất chặt chẽ và tự tin! AI đã tự động nâng nhẹ độ khó từ vựng và tốc độ nói.'
      : overallScore >= 74
      ? 'Ý tưởng rõ ràng và tự nhiên! Thử lồng thêm 1 cụm "Better Expressions" ở lượt sau để tăng điểm Band nhé.'
      : 'Bạn đang làm tốt lắm — đừng ngại nói dài hơn một chút! AI đã điều chỉnh tốc độ chậm lại để bạn dễ phản xạ.';

  return {
    overallScore,
    fluencyScore: Math.round(fluencyScore),
    grammarScore: Math.round(grammarScore),
    pronunciationScore: Math.round(pronunciationScore),
    argumentScore: Math.round(argumentScore),
    detectedLevel,
    pronunciationWords,
    grammarIssues,
    betterExpressions,
    encouragementVi,
  };
}

export function generateLocalReply(
  userText: string,
  topic: DebateTopic,
  persona: Persona,
  stance: Stance,
  turnIndex: number,
  detectedLevel: CEFRLevel
): string {
  const pool = persona === 'judge' ? topic.followUpsJudge : topic.followUpsBuddy;
  const baseFollowUp = pool[turnIndex % pool.length];

  const lower = userText.toLowerCase();
  let contextualPrefix = '';

  if (persona === 'judge') {
    if (lower.includes('balance') || lower.includes('both') || lower.includes('hybrid')) {
      contextualPrefix = 'A balanced stance is diplomatic, yet in competitive debate you must prioritize which side carries the greater weight. ';
    } else if (lower.includes('agree') || stance === 'for') {
      contextualPrefix = 'I note your affirmative position. ';
    } else if (lower.includes('disagree') || lower.includes('however') || stance === 'against') {
      contextualPrefix = 'You present a clear opposition angle. ';
    }
    if (detectedLevel === 'C1') {
      return `${contextualPrefix}${baseFollowUp} (Challenge: support your rebuttal with a concrete stakeholder analysis.)`;
    }
    return `${contextualPrefix}${baseFollowUp}`;
  } else {
    if (detectedLevel === 'A2') {
      return `Great try! You got your main idea across really well. ${baseFollowUp}`;
    }
    return `${baseFollowUp}`;
  }
}

export async function generateLiveGeminiTurn(params: {
  apiKey: string;
  userText: string;
  topic: DebateTopic;
  persona: Persona;
  stance: Stance;
  history: ChatMessage[];
  currentLevel: CEFRLevel;
}): Promise<{ reply: string; analysis: TurnAnalysis } | null> {
  const { apiKey, userText, topic, persona, stance, history, currentLevel } = params;

  const recentHistory = history
    .slice(-6)
    .map((m) => `${m.role === 'ai' ? 'AI' : 'Student'}: ${m.text}`)
    .join('\n');

  const systemPrompt = `You are SpeakSharp, an English speaking & debate coach for Vietnamese students.
Persona: ${
    persona === 'judge'
      ? 'Debate Judge (sharp, Socratic, challenges claims politely, formal academic English)'
      : 'Friendly Speaking Buddy (warm, encouraging, conversational, builds confidence)'
  }.
Topic: "${topic.title}" — Motion: "${topic.motion}". Student stance: ${stance}. Current CEFR level: ${currentLevel}.
Analyze the student's latest message and reply in JSON ONLY with this exact schema:
{
  "reply": "Your spoken English response (2-3 sentences, adaptive to CEFR level)",
  "analysis": {
    "overallScore": 82,
    "fluencyScore": 80,
    "grammarScore": 84,
    "pronunciationScore": 82,
    "argumentScore": 82,
    "detectedLevel": "A2|B1|B2|C1",
    "pronunciationWords": [{"word": "example", "ipa": "/ɪɡˈzæmpəl/", "score": 85, "tip": "short Vietnamese tip if score < 85"}],
    "grammarIssues": [{"original": "...", "corrected": "...", "rule": "Vietnamese rule name", "explanationVi": "Vietnamese explanation"}],
    "betterExpressions": [{"phrase": "Native C1/B2 phrase", "level": "B2+|C1", "contextVi": "Vietnamese usage note"}],
    "encouragementVi": "1 encouraging Vietnamese sentence"
  }
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nConversation so far:\n${recentHistory}\n\nStudent's new turn: "${userText}"`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;
    const parsed = JSON.parse(rawText);
    if (parsed?.reply && parsed?.analysis) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
