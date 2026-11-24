import { DebateTopic } from '../types';

export type QuestionType = 'mcq' | 'word_bank' | 'listening' | 'grammar_fix' | 'speaking';

export interface LessonQuestion {
  id: string;
  type: QuestionType;
  badge: string;
  promptVi: string;
  promptEn?: string;
  audioText?: string;
  options?: string[];
  correctAnswer: string;
  wordBank?: string[];
  explanationVi: string;
  ipaHighlight?: { word: string; ipa: string };
}

function shuffleOptions(opts: string[], seed: number): string[] {
  const arr = [...opts];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i * 5 + seed) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getQuestionsForTopic(topic: DebateTopic): LessonQuestion[] {
  const raw = buildRawQuestions(topic);
  return raw.map((q, idx) =>
    q.options ? { ...q, options: shuffleOptions(q.options, idx + topic.id.length) } : q
  );
}

function buildRawQuestions(topic: DebateTopic): LessonQuestion[] {
  const v0 = topic.keyVocab[0] ?? {
    word: 'perspective',
    ipa: '/pərˈspektɪv/',
    meaningVi: 'quan điểm, góc nhìn',
  };
  const v1 = topic.keyVocab[1] ?? {
    word: 'critical thinking',
    ipa: '/ˈkrɪtɪkəl ˈθɪŋkɪŋ/',
    meaningVi: 'tư duy phản biện',
  };

  if (topic.id === 'ai-in-classrooms') {
    return [
      {
        id: 'q1-mcq',
        type: 'mcq',
        badge: 'Từ vựng trọng tâm',
        promptVi: `Nghĩa chính xác của từ "${v0.word}" trong chủ đề giáo dục là gì?`,
        promptEn: `AI tutors provide ${v0.word} learning paths for every student.`,
        ipaHighlight: { word: v0.word, ipa: v0.ipa },
        options: [
          'Cá nhân hóa theo từng học sinh',
          'Đồng bộ hóa giống nhau hoàn toàn',
          'Thay thế hoàn toàn trường học',
          'Bài tập viết tay truyền thống',
        ],
        correctAnswer: 'Cá nhân hóa theo từng học sinh',
        explanationVi: `"Personalized" (${v0.ipa}) nghĩa là cá nhân hóa — rất hay dùng trong IELTS & tranh biện về EdTech.`,
      },
      {
        id: 'q2-wordbank',
        type: 'word_bank',
        badge: 'Ghép câu phản biện',
        promptVi: 'Sắp xếp các từ sau thành câu lập luận chuẩn tiếng Anh:',
        wordBank: ['AI', 'tutors', 'give', 'immediate', 'feedback', 'to', 'students'],
        correctAnswer: 'AI tutors give immediate feedback to students',
        explanationVi: 'Cấu trúc gọn, tự nhiên: "give immediate feedback to students" (đưa phản hồi tức thì cho học sinh).',
      },
      {
        id: 'q3-listening',
        type: 'listening',
        badge: 'Luyện nghe & hiểu',
        promptVi: 'Nhấn nút loa để nghe câu tiếng Anh và chọn ý nghĩa đúng nhất:',
        audioText: 'Over-reliance on artificial intelligence might reduce independent thinking.',
        options: [
          'Phụ thuộc quá mức vào AI có thể làm giảm tư duy độc lập.',
          'AI giúp học sinh không cần suy nghĩ độc lập nữa.',
          'Học sinh nên dùng AI để làm mọi bài kiểm tra trên lớp.',
          'Tư duy độc lập không còn quan trọng trong thời đại số.',
        ],
        correctAnswer: 'Phụ thuộc quá mức vào AI có thể làm giảm tư duy độc lập.',
        explanationVi: '"Over-reliance" = sự phụ thuộc quá mức; "independent thinking" = tư duy độc lập.',
      },
      {
        id: 'q4-grammar',
        type: 'grammar_fix',
        badge: 'Sửa lỗi ngữ pháp',
        promptVi: 'Chọn cách viết ĐÚNG ngữ pháp cho câu tranh biện sau:',
        promptEn: '❌ "I am agree that technology help students learn more better."',
        options: [
          'I strongly agree that technology helps students learn much better.',
          'I am agree that technology helps students learn better.',
          'I agree that technology help students learn more better.',
          'I strongly agree technology helping students learn more better.',
        ],
        correctAnswer: 'I strongly agree that technology helps students learn much better.',
        explanationVi: 'Không dùng "I am agree" (bỏ "am"); chủ ngữ số ít "technology" chia "helps"; không dùng so sánh kép "more better".',
      },
      {
        id: 'q5-speaking',
        type: 'speaking',
        badge: 'Thử thách Luyện nói',
        promptVi: 'Nhấn Micro để nói câu trả lời của bạn bằng tiếng Anh (hoặc đọc câu gợi ý):',
        promptEn: topic.openingQuestionBuddy,
        correctAnswer: topic.sampleHints[0],
        explanationVi: 'Tuyệt vời! Lượt nói của bạn đã được chấm IPA và cộng XP vào hồ sơ.',
      },
    ];
  }

  // Dynamic Duolingo 5-question generator for every other & custom topic!
  return [
    {
      id: `${topic.id}-q1`,
      type: 'mcq',
      badge: 'Từ vựng trọng tâm',
      promptVi: `Chọn nghĩa tiếng Việt đúng cho từ khóa "${v0.word}":`,
      promptEn: `Key term in "${topic.title}"`,
      ipaHighlight: { word: v0.word, ipa: v0.ipa },
      options: [
        v0.meaningVi,
        'Sự trì hoãn trong công việc',
        'Kế hoạch tài chính dài hạn',
        'Thói quen đọc sách buổi sáng',
      ],
      correctAnswer: v0.meaningVi,
      explanationVi: `"${v0.word}" (${v0.ipa}) có nghĩa là "${v0.meaningVi}".`,
    },
    {
      id: `${topic.id}-q2`,
      type: 'word_bank',
      badge: 'Ghép câu Better Expression',
      promptVi: 'Ghép các thẻ từ thành câu mở đầu luận điểm chuẩn Band 7.5+:',
      wordBank: ['From', 'my', 'perspective,', 'this', 'issue', 'really', 'matters'],
      correctAnswer: 'From my perspective, this issue really matters',
      explanationVi: '"From my perspective, ..." là cách mở đầu tự nhiên và học thuật hơn nhiều so với "I think".',
    },
    {
      id: `${topic.id}-q3`,
      type: 'listening',
      badge: 'Nghe & Phản xạ',
      promptVi: 'Nghe câu tiếng Anh sau và chọn câu khớp nội dung:',
      audioText: topic.sampleHints[0] || 'Practicing speaking every day builds real confidence.',
      options: [
        topic.sampleHints[0] || 'Practicing speaking every day builds real confidence.',
        'Traditional exams are the only way to measure speaking fluency.',
        'Students should never discuss controversial topics in class.',
        'Reading grammar rules silently is faster than speaking aloud.',
      ],
      correctAnswer: topic.sampleHints[0] || 'Practicing speaking every day builds real confidence.',
      explanationVi: 'Hãy bấm loa nghe lại thêm 1 lần để ghi nhớ ngữ điệu và nối âm tự nhiên nhé!',
    },
    {
      id: `${topic.id}-q4`,
      type: 'grammar_fix',
      badge: 'Sửa lỗi ngữ pháp',
      promptVi: `Chọn câu sử dụng từ "${v1.word}" ĐÚNG ngữ pháp nhất:`,
      promptEn: `❌ "In my opinion, I think people is needing ${v1.word}."`,
      options: [
        `In my opinion, people truly need ${v1.word} in modern life.`,
        `In my opinion, I think people is needing ${v1.word}.`,
        `People is need ${v1.word} very much good.`,
        `I am agree that people needs ${v1.word}.`,
      ],
      correctAnswer: `In my opinion, people truly need ${v1.word} in modern life.`,
      explanationVi: 'Tránh lặp "In my opinion, I think", và "people" là danh từ số nhiều nên đi với "need".',
    },
    {
      id: `${topic.id}-q5`,
      type: 'speaking',
      badge: 'Thử thách Luyện nói',
      promptVi: 'Nói quan điểm của bạn bằng tiếng Anh (nhấn Micro màu vàng hoặc gõ câu trả lời):',
      promptEn: topic.openingQuestionBuddy,
      correctAnswer: topic.sampleHints[0] || 'I firmly believe this topic deserves careful discussion.',
      explanationVi: 'Xuất sắc! Bạn đã hoàn thành phần nói phản xạ cho chủ đề này.',
    },
  ];
}
