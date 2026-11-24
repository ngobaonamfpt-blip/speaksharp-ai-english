import { DebateTopic } from '../types';

export const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'ai-in-classrooms',
    title: 'Should AI Tutors Replace Traditional Homework?',
    titleVi: 'AI có nên thay thế bài tập về nhà truyền thống?',
    motion: 'This House believes that AI tutors should replace traditional paper homework in high schools.',
    category: 'Hùng biện WSDC',
    level: 'B2',
    isPro: false,
    durationMin: 15,
    keyVocab: [
      { word: 'personalized', ipa: '/ˈpɜːrsənəlaɪzd/', meaningVi: 'cá nhân hóa' },
      { word: 'critical thinking', ipa: '/ˈkrɪtɪkəl ˈθɪŋkɪŋ/', meaningVi: 'tư duy phản biện' },
      { word: 'over-reliance', ipa: '/ˌoʊvər rɪˈlaɪəns/', meaningVi: 'sự phụ thuộc quá mức' },
      { word: 'immediate feedback', ipa: '/ɪˈmiːdiət ˈfiːdbæk/', meaningVi: 'phản hồi tức thì' },
    ],
    openingQuestionJudge:
      'Welcome to the debate floor. Our motion is: "AI tutors should replace traditional homework in high schools." State your opening stance clearly and provide one concrete reason to support it.',
    openingQuestionBuddy:
      "Hey! Let's warm up with a super fun topic: Do you think AI tutors should replace traditional homework at school? Don't worry about making mistakes—just share what you honestly think!",
    sampleHints: [
      'I strongly believe AI tutors can personalize learning and give instant feedback to students.',
      'However, relying too much on AI might reduce students’ independent problem-solving skills.',
      'In my opinion, a hybrid approach combining teachers and AI is more effective than full replacement.',
    ],
    followUpsJudge: [
      'That is a compelling claim, but let me challenge it: if every student uses an AI tutor, how do teachers prevent over-reliance and ensure genuine independent thinking during exams?',
      'Interesting perspective. However, what about students in rural areas who lack stable internet or devices? Wouldn’t replacing traditional homework widen educational inequality?',
      'You raised a valid point. Now, to strengthen your rebuttal, can you provide a measurable criterion to prove that AI feedback leads to better long-term retention than writing by hand?',
    ],
    followUpsBuddy: [
      "I really like how you explained that! You made a super clear point. What do you think happens when a student gets stuck on a hard math or English question late at night?",
      "Great job expressing your idea! Let's stretch it a bit further—if you were a school principal, how would you balance AI tools with traditional paper exercises?",
      "You're doing awesome! Your ideas flow naturally. Can you give one real-life example from your own study routine where an AI helper made things easier or harder?",
    ],
  },
  {
    id: 'ielts-social-media',
    title: 'Social Media & Teenage Mental Health',
    titleVi: 'Mạng xã hội và sức khỏe tinh thần tuổi teen',
    motion: 'Does social media do more harm than good for teenagers today?',
    category: 'IELTS Speaking',
    level: 'B1',
    isPro: false,
    durationMin: 12,
    keyVocab: [
      { word: 'double-edged sword', ipa: '/ˌdʌbəl edʒd ˈsɔːrd/', meaningVi: 'con dao hai lưỡi' },
      { word: 'cyberbullying', ipa: '/ˈsaɪbərbʊliɪŋ/', meaningVi: 'bắt nạt trên mạng' },
      { word: 'self-esteem', ipa: '/ˌself ɪˈstiːm/', meaningVi: 'lòng tự trọng / sự tự tin' },
      { word: 'mindful usage', ipa: '/ˈmaɪndfəl ˈjuːsɪdʒ/', meaningVi: 'sử dụng có chừng mực' },
    ],
    openingQuestionJudge:
      'Let us begin IELTS Speaking Part 3. Many educators argue that social media negatively affects teenagers’ mental health. To what extent do you agree or disagree?',
    openingQuestionBuddy:
      "Hi there! Today we're practicing an IELTS Speaking Part 3 question about social media. Do you think platforms like TikTok or Instagram help teenagers connect, or do they cause more stress?",
    sampleHints: [
      'I think social media is a double-edged sword because it connects people but also creates unrealistic standards.',
      'Many teenagers spend too much time scrolling, which negatively affects their sleep and concentration.',
      'On the other hand, online study groups help students share knowledge and practice English together.',
    ],
    followUpsJudge: [
      'You mentioned both sides briefly. In an IELTS Band 8 answer, examiners look for depth: should governments strictly ban social media for users under 16, or should parents take primary responsibility?',
      'Let me push back on that: if parents often lack digital literacy themselves, how realistic is it to expect them to monitor their children effectively?',
      'Fair argument. How do you think social media algorithms specifically amplify social comparison compared to traditional media like television?',
    ],
    followUpsBuddy: [
      "Nice start! I love that you thought about the real impact on students. Have you ever tried taking a 'digital detox' or limiting your screen time before exams?",
      "That's a very thoughtful point! Try using a linking phrase like 'On the flip side'—what is one positive habit teenagers can learn from online communities?",
      "Awesome effort! You're getting much more confident. If you could redesign one feature of social media to make it healthier for teens, what would it be?",
    ],
  },
  {
    id: 'daily-english-fear',
    title: 'Overcoming the Fear of Speaking English',
    titleVi: 'Vượt qua nỗi sợ nói tiếng Anh trước đám đông',
    motion: 'Why do students hesitate to speak English even after years of studying grammar?',
    category: 'Giao tiếp hằng ngày',
    level: 'A2',
    isPro: false,
    durationMin: 10,
    keyVocab: [
      { word: 'hesitate', ipa: '/ˈhezɪteɪt/', meaningVi: 'ngập ngừng, do dự' },
      { word: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/', meaningVi: 'phát âm' },
      { word: 'environment', ipa: '/ɪnˈvaɪrənmənt/', meaningVi: 'môi trường' },
      { word: 'confidence', ipa: '/ˈkɒnfɪdəns/', meaningVi: 'sự tự tin' },
    ],
    openingQuestionJudge:
      'Many Vietnamese students study English for over ten years yet still feel nervous speaking aloud. What do you believe is the root cause of this hesitation?',
    openingQuestionBuddy:
      "Welcome! Let's chat comfortably about something we all relate to: why do you think many students feel shy or afraid of making grammar mistakes when speaking English?",
    sampleHints: [
      'I think many students are afraid of making grammar mistakes and being laughed at by classmates.',
      'At school, we focus too much on writing tests and do not have enough time to practice speaking.',
      'Practicing every day with a friendly partner can help build confidence step by step.',
    ],
    followUpsJudge: [
      'If fear of judgment is the main barrier, should schools remove pronunciation grading entirely, or does grading motivate students to improve accuracy?',
      'Interesting point. How would you redesign a 45-minute English class of 35 students so that every single learner actually speaks for at least 5 minutes?',
      'Good reasoning. Do you believe fluency is more important than grammatical accuracy in everyday communication? Defend your choice.',
    ],
    followUpsBuddy: [
      "Totally agree with you! That makes complete sense. What usually helps you feel more relaxed when you have to speak English with someone new?",
      "You expressed that really clearly! Don't stress about small grammar slips—communication is what matters. How many minutes a day do you think is ideal for speaking practice?",
      "Well done! You're speaking smoothly. What's one English topic you really enjoy talking about with friends?",
    ],
  },
  {
    id: 'study-abroad-interview',
    title: 'Scholarship Interview: Why Choose You?',
    titleVi: 'Phỏng vấn Học bổng Du học: Giá trị bạn mang lại',
    motion: 'Convince the admissions committee of your unique leadership potential and future impact.',
    category: 'Phỏng vấn Du học',
    level: 'C1',
    isPro: true,
    durationMin: 15,
    keyVocab: [
      { word: 'resilience', ipa: '/rɪˈzɪliəns/', meaningVi: 'sự kiên cường, khả năng phục hồi' },
      { word: 'initiative', ipa: '/ɪˈnɪʃətɪv/', meaningVi: 'sáng kiến, tinh thần chủ động' },
      { word: 'interdisciplinary', ipa: '/ˌɪntərˈdɪsəplɪneri/', meaningVi: 'liên ngành' },
      { word: 'tangible impact', ipa: '/ˈtændʒəbəl ˈɪmpækt/', meaningVi: 'tác động hữu hình' },
    ],
    openingQuestionJudge:
      'Good afternoon. We receive thousands of applications from straight-A students every year. Beyond your academic grades, why should our scholarship committee invest in you?',
    openingQuestionBuddy:
      "Let's practice for your dream scholarship interview! Imagine I'm a friendly admissions officer: tell me about a project or challenge you're proud of and what it taught you.",
    sampleHints: [
      'Beyond academics, I founded a peer-mentoring club that helped 60 students improve their English confidence.',
      'Facing a major setback during a competition taught me resilience and how to collaborate under pressure.',
      'I plan to combine technology and education to bridge learning gaps in my local community.',
    ],
    followUpsJudge: [
      'That sounds ambitious, yet committees hear similar goals frequently. Tell me about a specific moment when your leadership failed—what went wrong, and how did you recover?',
      'How will studying in our international environment uniquely enable your career plan in a way that studying locally could not?',
      'In five years, what single measurable outcome will prove that awarding you this scholarship was the right decision?',
    ],
    followUpsBuddy: [
      "What a strong story! Admissions officers love specific examples like that. Can you highlight one personal skill you developed from that experience?",
      "That's super inspiring! Let's polish your ending—how do you plan to give back to your community after graduation?",
      "Great delivery! You sound genuinely passionate. Would you like to practice answering a tricky question about overcoming a weakness?",
    ],
  },
  {
    id: 'wsdc-four-day-school',
    title: 'Should High Schools Adopt a 4-Day Week?',
    titleVi: 'Trường THPT có nên áp dụng tuần học 4 ngày?',
    motion: 'This House would transition all high schools to a four-day instructional week.',
    category: 'Hùng biện WSDC',
    level: 'B2',
    isPro: true,
    durationMin: 15,
    keyVocab: [
      { word: 'burnout', ipa: '/ˈbɜːrnaʊt/', meaningVi: 'kiệt sức' },
      { word: 'productivity', ipa: '/ˌproʊdʌkˈtɪvəti/', meaningVi: 'năng suất' },
      { word: 'extracurricular', ipa: '/ˌekstrəkəˈrɪkjələr/', meaningVi: 'ngoại khóa' },
      { word: 'curriculum', ipa: '/kəˈrɪkjələm/', meaningVi: 'chương trình học' },
    ],
    openingQuestionJudge:
      'As First Speaker, present your core argument on the motion: "High schools should transition to a four-day school week." Define your key stakeholders clearly.',
    openingQuestionBuddy:
      'Imagine having a three-day weekend every single week! Do you think a 4-day school week would make students happier and more productive, or would it cause problems?',
    sampleHints: [
      'A four-day week would significantly reduce student burnout and leave time for extracurricular projects.',
      'However, compressing the same curriculum into four longer days might exhaust younger students.',
      'Working parents might also struggle to arrange supervision on the extra day off.',
    ],
    followUpsJudge: [
      'Point of Information: if we shorten the week to four days without cutting the curriculum, longer daily hours could decrease afternoon focus. How does your side solve that trade-off?',
      'What evidence suggests students would actually use the fifth day for productive self-study rather than passive entertainment?',
      'How do you address the economic burden on low-income working families who rely on schools for structured daytime care?',
    ],
    followUpsBuddy: [
      'Ooh, that is a really smart point! If you had Fridays off every week, how would you personally spend that extra day?',
      'Nice balance of pros and cons! What do you think teachers would say about this idea?',
      'You are building great arguments! Try summarizing your final stance in one punchy sentence.',
    ],
  },
  {
    id: 'ielts-climate-tech',
    title: 'Individual Action vs. Government Policy on Climate',
    titleVi: 'Hành động cá nhân hay Chính sách Nhà nước cho khí hậu?',
    motion: 'Can individual lifestyle changes meaningfully combat climate change without strict government regulation?',
    category: 'IELTS Speaking',
    level: 'C1',
    isPro: true,
    durationMin: 15,
    keyVocab: [
      { word: 'carbon footprint', ipa: '/ˈkɑːrbən ˈfʊtprɪnt/', meaningVi: 'dấu chân carbon' },
      { word: 'legislation', ipa: '/ˌledʒɪsˈleɪʃən/', meaningVi: 'luật pháp, quy định' },
      { word: 'sustainable', ipa: '/səˈsteɪnəbəl/', meaningVi: 'bền vững' },
      { word: 'accountability', ipa: '/əˌkaʊntəˈbɪləti/', meaningVi: 'trách nhiệm giải trình' },
    ],
    openingQuestionJudge:
      'In IELTS Speaking Part 3, candidates often say "everyone should recycle." Go deeper: are individual habits truly enough to fight climate change, or is systemic legislation the only real solution?',
    openingQuestionBuddy:
      "Let's tackle a classic Band 7+ IELTS topic: climate change! Do you think small daily habits like using reusable bottles matter, or should governments force big corporations to change first?",
    sampleHints: [
      'While individual choices raise awareness, strict government legislation is essential to regulate industrial emissions.',
      'Consumer demand can push companies to adopt sustainable practices faster than expected.',
      'Both top-down policies and bottom-up habits must work hand in hand for lasting environmental change.',
    ],
    followUpsJudge: [
      'If strict environmental taxes raise electricity and food prices for ordinary citizens, how should governments justify that policy politically?',
      'Do you think developing nations should face the same emissions targets as industrialized countries that polluted for centuries?',
      'Give me one concrete policy a city like Ho Chi Minh City or Hanoi could implement next year with high impact.',
    ],
    followUpsBuddy: [
      'Super well said! You used great ideas there. What is one eco-friendly habit that is actually easy for students to maintain?',
      'I love how you connected policies with everyday life. Can you think of a green technology that excites you?',
      'Fantastic answer—that sounded very natural and fluent!',
    ],
  },
];
