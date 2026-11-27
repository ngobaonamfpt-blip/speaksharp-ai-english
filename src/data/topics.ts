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
  {
    id: 'thcs-smartphones-school',
    title: 'Should Smartphones Be Allowed at School?',
    titleVi: 'Có nên cho học sinh mang điện thoại đến trường?',
    motion: 'Should middle school students be allowed to bring and use smartphones during school hours?',
    category: 'THCS & Đời sống',
    level: 'A2',
    isPro: false,
    durationMin: 10,
    keyVocab: [
      { word: 'distraction', ipa: '/dɪˈstrækʃən/', meaningVi: 'sự xao nhãng' },
      { word: 'emergency', ipa: '/ɪˈmɜːrdʒənsi/', meaningVi: 'tình huống khẩn cấp' },
      { word: 'research', ipa: '/rɪˈsɜːrtʃ/', meaningVi: 'tra cứu, nghiên cứu' },
      { word: 'responsibility', ipa: '/rɪˌspɒnsəˈbɪləti/', meaningVi: 'trách nhiệm' },
    ],
    openingQuestionJudge:
      'Many schools ban smartphones completely, while others use them for digital learning. Should middle schoolers be allowed to bring phones to school? Give one clear reason.',
    openingQuestionBuddy:
      "Hey! Here's a hot school topic: do you think students should be allowed to bring smartphones to school, or should phones stay at home? Tell me what you think!",
    sampleHints: [
      'Smartphones are helpful for contacting parents in an emergency and looking up English vocabulary quickly.',
      'However, phones can be a huge distraction during class if students play games or text friends.',
      'I think students should bring phones but keep them in a locker until break time.',
    ],
    followUpsJudge: [
      'If students keep phones in lockers, how should teachers handle students who secretly use them during lessons?',
      'Do you think banning phones helps students talk more to their friends face-to-face during recess?',
      'What is one clear rule you would design as class president to balance safety and focus?',
    ],
    followUpsBuddy: [
      'That is a super practical idea! Have you ever used your phone to look up a tough word or homework question?',
      'Nice point! What do your classmates usually do during break time without phones?',
      'Great job speaking so clearly! Try summing up your rule in one short sentence.',
    ],
  },
  {
    id: 'thcs-video-games',
    title: 'Video Games: Brain Training or Time Waster?',
    titleVi: 'Chơi game: Rèn luyện tư duy hay lãng phí thời gian?',
    motion: 'Do video games help teenagers develop problem-solving skills, or do they mostly waste study time?',
    category: 'THCS & Đời sống',
    level: 'B1',
    isPro: false,
    durationMin: 12,
    keyVocab: [
      { word: 'teamwork', ipa: '/ˈtiːmwɜːrk/', meaningVi: 'làm việc nhóm' },
      { word: 'addiction', ipa: '/əˈdɪkʃən/', meaningVi: 'sự nghiện' },
      { word: 'strategy', ipa: '/ˈstrætədʒi/', meaningVi: 'chiến lược' },
      { word: 'time management', ipa: '/taɪm ˈmænɪdʒmənt/', meaningVi: 'quản lý thời gian' },
    ],
    openingQuestionJudge:
      'Parents often worry that video games ruin grades, yet gamers argue games teach strategy and English. Which side has the stronger argument?',
    openingQuestionBuddy:
      "Let's talk about video games! Do you think playing games helps you learn teamwork and English, or is it mostly a distraction from homework?",
    sampleHints: [
      'Strategy and 3D adventure games can improve quick thinking, teamwork, and even English vocabulary.',
      'On the other hand, playing too late at night leads to addiction and poor sleep before school.',
      'With good time management, playing for 30 to 45 minutes after finishing homework is healthy.',
    ],
    followUpsJudge: [
      'How can a 7th-grade student prove to their parents that gaming is actually helping their English or logic?',
      'Should game companies add mandatory daily time limits for players under 16?',
      'Can educational 3D games like SpeakSharp replace traditional flashcards? Why or why not?',
    ],
    followUpsBuddy: [
      'Love that perspective! Have you ever learned a cool new English word from a game?',
      'That makes total sense! What is a fair daily screen-time limit on school days vs. weekends?',
      'Awesome fluency! You balanced both sides really well.',
    ],
  },
  {
    id: 'hue-heritage-tourists',
    title: 'Introducing Hue Heritage to Foreign Tourists',
    titleVi: 'Giới thiệu Di sản Cố Đô Huế cho du khách nước ngoài',
    motion: 'Act as a young student ambassador introducing Hue Imperial City, Perfume River, and local food to a foreign visitor.',
    category: 'Giao tiếp hằng ngày',
    level: 'A2',
    isPro: false,
    durationMin: 10,
    keyVocab: [
      { word: 'heritage', ipa: '/ˈherɪtɪdʒ/', meaningVi: 'di sản văn hóa' },
      { word: 'imperial', ipa: '/ɪmˈpɪəriəl/', meaningVi: 'hoàng gia, cố đô' },
      { word: 'cuisine', ipa: '/kwɪˈziːn/', meaningVi: 'ẩm thực' },
      { word: 'peaceful', ipa: '/ˈpiːsfəl/', meaningVi: 'yên bình' },
    ],
    openingQuestionJudge:
      'Welcome! Imagine I am visiting Hue for the very first time and only have one day. Convince me which landmark and local dish I must not miss.',
    openingQuestionBuddy:
      "Hi! I just arrived in Hue and I'm so excited to explore! As a local student, where should I go first and what delicious Hue food should I try?",
    sampleHints: [
      'You should definitely visit the Hue Imperial City to learn about Vietnamese royal history and architecture.',
      'In the evening, taking a boat ride along the peaceful Perfume River is unforgettable.',
      'For local cuisine, you must try Bun Bo Hue and sweet Hue desserts!',
    ],
    followUpsJudge: [
      'Why do you think Hue feels more peaceful than bigger cities like Hanoi or Ho Chi Minh City?',
      'How can young students use technology or English apps to promote Hue tourism worldwide?',
      'If I do not eat spicy food, how would you recommend a Hue dish for me politely?',
    ],
    followUpsBuddy: [
      'Ooh, that sounds amazing! How would you describe the taste of Bun Bo Hue to someone who has never tried it?',
      'You make a great tour guide! What is your personal favorite spot in Hue to hang out with friends?',
      'Super natural English! Any tourist would love chatting with you.',
    ],
  },
  {
    id: 'wsdc-school-uniforms',
    title: 'Should Students Wear School Uniforms?',
    titleVi: 'Học sinh có nên mặc đồng phục khi đến trường?',
    motion: 'This House believes that mandatory school uniforms promote equality better than free dress codes.',
    category: 'Hùng biện WSDC',
    level: 'B1',
    isPro: false,
    durationMin: 12,
    keyVocab: [
      { word: 'equality', ipa: '/ɪˈkwɒləti/', meaningVi: 'sự bình đẳng' },
      { word: 'self-expression', ipa: '/ˌself ɪkˈspreʃən/', meaningVi: 'thể hiện cá tính' },
      { word: 'belonging', ipa: '/bɪˈlɒŋɪŋ/', meaningVi: 'cảm giác thuộc về tập thể' },
      { word: 'comfort', ipa: '/ˈkʌmfərt/', meaningVi: 'sự thoải mái' },
    ],
    openingQuestionJudge:
      'Welcome to the debate. Motion: "Schools should require all students to wear uniforms." Present your opening claim and explain who benefits most.',
    openingQuestionBuddy:
      'What do you think about school uniforms? Do they make mornings easier and fairer for everyone, or do they limit your personal style?',
    sampleHints: [
      'Uniforms promote equality so students are not judged by expensive brands or clothes.',
      'They also save time every morning and create a proud sense of belonging at school.',
      'However, having one free-dress day per week could still let students enjoy self-expression.',
    ],
    followUpsJudge: [
      'Critics argue uniforms suppress creativity. Does wearing the same shirt really stop students from thinking creatively?',
      'What if a uniform is uncomfortable in hot summer weather—should students help design their own school uniform?',
      'Summarize why your side wins the equality vs. freedom trade-off.',
    ],
    followUpsBuddy: [
      'Great argument! If you could redesign your school uniform, what color or style would you pick?',
      'Very clear explanation! Do you think sports uniforms are more comfortable than formal ones?',
      'Nice job—you sounded just like a debate team captain!',
    ],
  },
  {
    id: 'wsdc-student-shark-tank',
    title: 'Pitching a Student Startup Idea to Sharks',
    titleVi: 'Thuyết trình gọi vốn Startup học sinh trước Shark Tank',
    motion: 'Convince a panel of Shark Tank investors why your student-built app deserves their investment.',
    category: 'Hùng biện WSDC',
    level: 'B2',
    isPro: true,
    durationMin: 15,
    keyVocab: [
      { word: 'target market', ipa: '/ˈtɑːrɡɪt ˈmɑːrkɪt/', meaningVi: 'thị trường mục tiêu' },
      { word: 'competitive advantage', ipa: '/kəmˈpetətɪv ədˈvæntɪdʒ/', meaningVi: 'lợi thế cạnh tranh' },
      { word: 'scalable', ipa: '/ˈskeɪləbəl/', meaningVi: 'có khả năng mở rộng' },
      { word: 'investment', ipa: '/ɪnˈvestmənt/', meaningVi: 'khoản đầu tư' },
    ],
    openingQuestionJudge:
      'Hello young founders! Welcome to Shark Tank. You have 60 seconds: what problem does your product solve, and why should I invest in your team today?',
    openingQuestionBuddy:
      "Let's rehearse your Shark Tank pitch! Pretend I'm a friendly investor—introduce your project name, your target market, and what makes it special!",
    sampleHints: [
      'Our target market is Vietnamese secondary students in Grades 6 to 9 who feel shy speaking English.',
      'Our competitive advantage is combining an online 3D anime world with an AI debate coach.',
      'We will use the investment for cloud servers, AI APIs, a custom domain, and our school launch event.',
    ],
    followUpsJudge: [
      'Why would a student choose your app instead of giant free apps like Duolingo or ELSA Speak?',
      'How do you plan to earn money and break even if middle school students do not have their own credit cards?',
      'What is the biggest risk for a 7th-grade founding team, and how will you overcome it?',
    ],
    followUpsBuddy: [
      'Whoa, that pitch was super confident! Try emphasizing one real feature you already built and can demo live.',
      'Awesome answer! Remember to smile and pause for one second before stating your investment ask.',
      'You are 100% ready for the Shark Tank stage!',
    ],
  },
  {
    id: 'thcs-online-vs-real-friends',
    title: 'Online Friends vs. Real-Life Friends',
    titleVi: 'Bạn bè trên mạng hay Bạn bè ngoài đời thực?',
    motion: 'Can online friendships formed through games and study apps be just as meaningful as real-life friendships?',
    category: 'THCS & Đời sống',
    level: 'B1',
    isPro: true,
    durationMin: 12,
    keyVocab: [
      { word: 'trustworthy', ipa: '/ˈtrʌstwɜːrði/', meaningVi: 'đáng tin cậy' },
      { word: 'common interest', ipa: '/ˈkɒmən ˈɪntrəst/', meaningVi: 'sở thích chung' },
      { word: 'privacy', ipa: '/ˈprɪvəsi/', meaningVi: 'quyền riêng tư' },
      { word: 'genuine', ipa: '/ˈdʒenjuɪn/', meaningVi: 'chân thành, thật lòng' },
    ],
    openingQuestionJudge:
      'Many teenagers today make friends across the world through online games and learning communities. Can an online friend ever truly replace a real-life classmate?',
    openingQuestionBuddy:
      "Here's a thoughtful question: do you think making friends online through games or English clubs is a great way to connect, or are real-life friends always better?",
    sampleHints: [
      'Online friends who share a common interest like learning English can be very supportive and inspiring.',
      'However, we must protect our privacy online because it is harder to know who is truly trustworthy.',
      'In my view, online communities are wonderful as long as we still spend quality time with real-life friends.',
    ],
    followUpsJudge: [
      'What are two safety rules every middle schooler should follow when chatting with new people online?',
      'Why do some shy students find it easier to open up and speak English with online friends first?',
      'How can schools create safe online spaces where classmates collaborate positively?',
    ],
    followUpsBuddy: [
      'That is a very mature answer! Have you ever practiced a hobby or language with someone you met online?',
      'Great point about online safety! Try using the word "genuine" in your next sentence.',
      'Super clear and thoughtful—well done!',
    ],
  },
];
