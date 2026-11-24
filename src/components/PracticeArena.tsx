import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  RotateCcw,
  Bookmark,
  Settings,
  Clock,
  Gavel,
  HeartHandshake,
  Flame,
  Zap,
  Target,
  Trophy,
  X,
  Heart,
  CheckCircle2,
  XCircle,
  Bot,
  Sparkles,
} from 'lucide-react';
import {
  CEFRLevel,
  ChatMessage,
  DebateTopic,
  Persona,
  SavedExpression,
  TurnAnalysis,
} from '../types';
import {
  analyzeUtteranceLocal,
  generateLiveGeminiTurn,
  generateLocalReply,
  getSpeechRateForLevel,
} from '../engine/debateEngine';
import { getQuestionsForTopic, LessonQuestion } from '../data/lessonQuestions';

interface PracticeArenaProps {
  topic: DebateTopic;
  persona: Persona;
  onPersonaChange: (p: Persona) => void;
  onOpenTopics: () => void;
  isPro: boolean;
  remainingSeconds: number;
  onConsumeSecond: () => void;
  geminiApiKey: string;
  savedExpressions: SavedExpression[];
  onSaveExpression: (phrase: string, level: string, contextVi: string) => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
  onRetakeSurvey?: () => void;
  surveyGoal?: string;
  onTurnCompleted?: (analysis: TurnAnalysis, xpGained: number) => void;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

function shuffleStable(words: string[]): string[] {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  topic,
  persona,
  onPersonaChange,
  onOpenTopics,
  isPro,
  remainingSeconds,
  onConsumeSecond,
  geminiApiKey,
  savedExpressions,
  onSaveExpression,
  onOpenSaved,
  onOpenSettings,
  onOpenPricing,
  onRetakeSurvey,
  surveyGoal,
  onTurnCompleted,
}) => {
  // === DUOLINGO LESSON STATE ===
  const questions = useMemo(() => getQuestionsForTopic(topic), [topic]);
  const [qIndex, setQIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [builtWords, setBuiltWords] = useState<number[]>([]);
  const [speakingText, setSpeakingText] = useState('');
  const [speakingAnalysis, setSpeakingAnalysis] = useState<TurnAnalysis | null>(null);
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Voice recording for Speaking Question
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const recognitionRef = useRef<any>(null);

  // === SIDEBAR AI CHATBOT STATE ===
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>(topic.level);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentQ: LessonQuestion = questions[qIndex] ?? questions[0];
  const shuffledBank = useMemo(
    () => (currentQ.wordBank ? shuffleStable(currentQ.wordBank) : []),
    [currentQ]
  );

  const progressPct = Math.round(((qIndex + (checkState !== 'idle' ? 1 : 0)) / questions.length) * 100);
  const speechRate = getSpeechRateForLevel(cefrLevel, persona);

  // Reset lesson when topic changes
  useEffect(() => {
    setQIndex(0);
    setHearts(5);
    setCorrectCount(0);
    setSelectedOption('');
    setBuiltWords([]);
    setSpeakingText('');
    setSpeakingAnalysis(null);
    setCheckState('idle');
    setShowCompleteModal(false);
    setCefrLevel(topic.level);
    setChatMessages([
      {
        id: `bot-welcome-${Date.now()}`,
        role: 'ai',
        persona,
        text: `Chào bạn! Mình là Trợ lý AI SpeakSharp. Bạn cứ làm các câu hỏi bên trái — gặp câu nào khó về ngữ pháp, phát âm IPA hay cách phản biện thì nhắn hỏi mình ngay nhé!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [topic.id]);

  // Free quota timer
  useEffect(() => {
    if (isPro || remainingSeconds <= 0) return;
    const timer = setInterval(() => onConsumeSecond(), 1000);
    return () => clearInterval(timer);
  }, [isPro, remainingSeconds, onConsumeSecond]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordingSec(0);
      return;
    }
    const t = setInterval(() => setRecordingSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatThinking]);

  const speakText = (text: string, customRate?: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = customRate ?? speechRate;
    window.speechSynthesis.speak(u);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Trình duyệt chưa hỗ trợ Web Speech API. Bạn hãy dùng Chrome/Edge hoặc nhập câu trả lời trực tiếp!');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    let finalTxt = speakingText ? speakingText + ' ' : '';
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += t + ' ';
        else interim += t;
      }
      setSpeakingText((finalTxt + interim).trimStart());
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  // === CHECK DUOLINGO ANSWER ===
  const canCheck =
    currentQ.type === 'word_bank'
      ? builtWords.length > 0
      : currentQ.type === 'speaking'
      ? speakingText.trim().length >= 3
      : selectedOption.length > 0;

  const handleCheckAnswer = () => {
    if (!canCheck || checkState !== 'idle') return;

    if (currentQ.type === 'speaking') {
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
      }
      const analysis = analyzeUtteranceLocal(speakingText.trim(), topic, cefrLevel);
      setSpeakingAnalysis(analysis);
      setCefrLevel(analysis.detectedLevel);
      const gained = analysis.overallScore >= 80 ? 35 : 25;
      setXpEarned((x) => x + gained);
      setCorrectCount((c) => c + 1);
      setCheckState('correct');
      onTurnCompleted?.(analysis, gained);
      return;
    }

    const userAnswer =
      currentQ.type === 'word_bank'
        ? builtWords.map((idx) => shuffledBank[idx]).join(' ')
        : selectedOption;

    const isRight = userAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isRight) {
      setCheckState('correct');
      setXpEarned((x) => x + 25);
      setCorrectCount((c) => c + 1);
    } else {
      setCheckState('wrong');
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const handleNextQuestion = () => {
    if (qIndex + 1 >= questions.length) {
      setShowCompleteModal(true);
      return;
    }
    setQIndex((i) => i + 1);
    setSelectedOption('');
    setBuiltWords([]);
    setSpeakingText('');
    setSpeakingAnalysis(null);
    setCheckState('idle');
  };

  const handleRestartLesson = () => {
    setQIndex(0);
    setHearts(5);
    setCorrectCount(0);
    setSelectedOption('');
    setBuiltWords([]);
    setSpeakingText('');
    setSpeakingAnalysis(null);
    setCheckState('idle');
    setShowCompleteModal(false);
  };

  // Keyboard shortcuts (1-4 to select, Enter to check/next) like Duolingo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (showCompleteModal) return;

      if (
        checkState === 'idle' &&
        (currentQ.type === 'mcq' || currentQ.type === 'grammar_fix' || currentQ.type === 'listening') &&
        currentQ.options
      ) {
        const num = Number(e.key);
        if (num >= 1 && num <= currentQ.options.length) {
          setSelectedOption(currentQ.options[num - 1]);
        }
      }

      if (e.key === 'Enter') {
        if (checkState === 'idle' && canCheck) {
          e.preventDefault();
          handleCheckAnswer();
        } else if (checkState !== 'idle') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // === AI CHATBOT HELPER ===
  const handleAskChatbot = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text || isChatThinking) return;

    const userMsg: ChatMessage = {
      id: `chat-u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    setChatInput('');
    setIsChatThinking(true);

    let reply = '';
    const lower = text.toLowerCase();

    if (geminiApiKey.trim()) {
      const live = await generateLiveGeminiTurn({
        apiKey: geminiApiKey.trim(),
        userText: `[Học sinh đang làm câu hỏi "${currentQ.promptVi}" trong chủ đề "${topic.title}"] Câu hỏi của học sinh: ${text}`,
        topic,
        persona,
        stance: 'for',
        history: nextHistory,
        currentLevel: cefrLevel,
      });
      if (live) reply = live.reply;
    }

    if (!reply) {
      await new Promise((r) => setTimeout(r, 400));
      if (lower.includes('giải thích') || lower.includes('tại sao') || lower.includes('hướng dẫn')) {
        reply = `📌 Gợi ý cho Câu ${qIndex + 1} (${currentQ.badge}): ${currentQ.explanationVi}`;
      } else if (lower.includes('ipa') || lower.includes('phát âm') || lower.includes('đọc')) {
        const vocabList = topic.keyVocab
          .slice(0, 3)
          .map((v) => `• ${v.word} ${v.ipa}: ${v.meaningVi}`)
          .join('\n');
        reply = `🔊 Phiên âm IPA quan trọng của chủ đề này:\n${vocabList}\nBạn có thể bấm nút loa để nghe và đọc theo nhé!`;
      } else if (lower.includes('phản biện') || lower.includes('gợi ý') || lower.includes('diễn đạt')) {
        reply = `💡 Mẫu câu tự nhiên (Band 7.5+) bạn có thể dùng:\n“${topic.sampleHints[0]}”\nHoặc mở đầu bằng “From my perspective, ...” để câu lập luận sắc bén hơn!`;
      } else {
        const localEval = analyzeUtteranceLocal(text, topic, cefrLevel);
        reply = generateLocalReply(text, topic, persona, 'for', chatMessages.length, localEval.detectedLevel);
      }
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `chat-ai-${Date.now()}`,
        role: 'ai',
        persona,
        text: reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsChatThinking(false);
  };

  return (
    <div>
      {/* Clean Duolingo-style Top Progress Bar (Uncluttered) */}
      <div className="duo-progress-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="duo-stat-pill tabular" style={{ background: '#fef2f2', color: '#dc2626' }} title="Số tim còn lại">
            <Heart size={15} fill="#dc2626" /> {hearts}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }} className="tabular">
            Câu {qIndex + 1}/{questions.length}
          </span>
        </div>

        <div className="duo-progress-track">
          <div className="duo-progress-fill" style={{ width: `${Math.max(12, progressPct)}%` }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="duo-stat-pill tabular" style={{ background: '#fef6df', color: '#b45309' }}>
            <Flame size={15} fill="#f59e0b" color="#f59e0b" /> 7
          </span>

          <span className="duo-stat-pill tabular" style={{ background: '#141517', color: '#f5bd33' }}>
            <Zap size={15} fill="#f5bd33" /> {xpEarned} XP
          </span>

          <button className="duo-btn-3d tabular" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onOpenPricing} title="Hạn mức mỗi ngày">
            <Clock size={13} />
            {isPro
              ? 'Pro'
              : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
                  remainingSeconds % 60
                ).padStart(2, '0')}`}
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: LEFT = Duolingo Interactive Questions | RIGHT = AI Chatbot */}
      <div className="arena-grid" style={{ gridTemplateColumns: 'minmax(0, 1.42fr) minmax(340px, 0.88fr)' }}>
        {/* LEFT: DUOLINGO INTERACTIVE QUESTION CARD */}
        <div className="duo-chat-card" style={{ justifyContent: 'space-between' }}>
          {/* Question Header with Secondary Tools */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '2px solid #f0ece4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              background: '#fcfbf8',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="badge badge-indigo">{currentQ.badge}</span>
                <span className="badge badge-slate">{topic.category} · {topic.level}</span>
              </div>
              <div className="display-font" style={{ fontSize: 15.5, fontWeight: 800, marginTop: 4 }}>
                {topic.title}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="duo-btn-3d" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onOpenTopics}>
                Đổi chủ đề
              </button>
              {onRetakeSurvey && (
                <button className="duo-btn-3d" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onRetakeSurvey}>
                  <Target size={13} /> {surveyGoal ? 'Lộ trình' : 'Khảo sát'}
                </button>
              )}
              <button className="duo-btn-3d" style={{ padding: '6px 9px', fontSize: 12 }} onClick={onOpenSaved} title="Sổ tay đã lưu">
                <Bookmark size={13} /> {savedExpressions.length}
              </button>
              <button className="duo-btn-3d" style={{ padding: '6px 9px' }} onClick={handleRestartLesson} title="Làm lại từ Câu 1">
                <RotateCcw size={13} />
              </button>
              <button className="duo-btn-3d" style={{ padding: '6px 9px' }} onClick={onOpenSettings} title="Cài đặt AI">
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* Question Interactive Body */}
          <div
            key={currentQ.id}
            className="question-enter"
            style={{ flex: 1, overflowY: 'auto', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div>
              <h2 className="display-font" style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.35 }}>
                {currentQ.promptVi}
              </h2>

              {currentQ.promptEn && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '14px 16px',
                    background: '#fcfbf8',
                    border: '2px solid #e7e2d9',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>
                      {currentQ.promptEn}
                    </div>
                    {currentQ.ipaHighlight && (
                      <span
                        className="mono"
                        style={{
                          display: 'inline-block',
                          marginTop: 6,
                          fontSize: 12,
                          background: '#fce7f3',
                          color: '#be185d',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        {currentQ.ipaHighlight.word} {currentQ.ipaHighlight.ipa}
                      </span>
                    )}
                  </div>
                  <button
                    className="duo-btn-3d soft-gold"
                    style={{ width: 38, height: 38, padding: 0, flexShrink: 0 }}
                    onClick={() => speakText(currentQ.ipaHighlight?.word || currentQ.promptEn || '')}
                    title="Nghe phát âm"
                  >
                    <Volume2 size={17} />
                  </button>
                </div>
              )}
            </div>

            {/* TYPE 1 & 4: MULTIPLE CHOICE / GRAMMAR FIX */}
            {(currentQ.type === 'mcq' || currentQ.type === 'grammar_fix') && currentQ.options && (
              <div style={{ display: 'grid', gap: 10 }}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const showCorrect = checkState !== 'idle' && opt === currentQ.correctAnswer;
                  const showWrong = checkState === 'wrong' && isSelected && opt !== currentQ.correctAnswer;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={checkState !== 'idle'}
                      className={`duo-btn-3d ${isSelected && checkState === 'idle' ? 'gold' : ''}`}
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '13px 16px',
                        gap: 12,
                        borderColor: showCorrect ? '#16a34a' : showWrong ? '#dc2626' : undefined,
                        background: showCorrect ? '#dcfce7' : showWrong ? '#fee2e2' : undefined,
                        color: showCorrect ? '#14532d' : showWrong ? '#991b1b' : undefined,
                      }}
                      onClick={() => setSelectedOption(opt)}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          border: '1.5px solid currentColor',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0,
                          opacity: 0.75,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 2: WORD BANK (TAP TO BUILD SENTENCE) */}
            {currentQ.type === 'word_bank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Answer Drop Zone */}
                <div
                  style={{
                    minHeight: 74,
                    padding: '12px 14px',
                    borderRadius: 16,
                    border: '2px dashed #d6cfc5',
                    background: '#fcfbf8',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  {builtWords.length === 0 ? (
                    <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                      Nhấn vào các thẻ từ bên dưới để ghép thành câu hoàn chỉnh...
                    </span>
                  ) : (
                    builtWords.map((wordIdx, pos) => (
                      <button
                        key={`${wordIdx}-${pos}`}
                        type="button"
                        disabled={checkState !== 'idle'}
                        className="duo-btn-3d gold"
                        style={{ padding: '7px 13px', fontSize: 14 }}
                        onClick={() => setBuiltWords((prev) => prev.filter((_, i) => i !== pos))}
                      >
                        {shuffledBank[wordIdx]}
                      </button>
                    ))
                  )}
                </div>

                {/* Word Bank Pool */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                  {shuffledBank.map((word, idx) => {
                    const used = builtWords.includes(idx);
                    return (
                      <button
                        key={`${word}-${idx}`}
                        type="button"
                        disabled={used || checkState !== 'idle'}
                        className="duo-btn-3d"
                        style={{
                          padding: '8px 14px',
                          fontSize: 14,
                          opacity: used ? 0.28 : 1,
                        }}
                        onClick={() => setBuiltWords((prev) => [...prev, idx])}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 3: LISTENING COMPREHENSION */}
            {currentQ.type === 'listening' && currentQ.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <button
                    type="button"
                    className="duo-btn-3d gold"
                    style={{ padding: '16px 28px', fontSize: 15.5, borderRadius: 18 }}
                    onClick={() => speakText(currentQ.audioText || '', 0.92)}
                  >
                    <Volume2 size={22} /> Nhấn để nghe câu tiếng Anh
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const showCorrect = checkState !== 'idle' && opt === currentQ.correctAnswer;
                    const showWrong = checkState === 'wrong' && isSelected && opt !== currentQ.correctAnswer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={checkState !== 'idle'}
                        className={`duo-btn-3d ${isSelected && checkState === 'idle' ? 'gold' : ''}`}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          padding: '12px 16px',
                          gap: 12,
                          borderColor: showCorrect ? '#16a34a' : showWrong ? '#dc2626' : undefined,
                          background: showCorrect ? '#dcfce7' : showWrong ? '#fee2e2' : undefined,
                        }}
                        onClick={() => setSelectedOption(opt)}
                      >
                        <span style={{ fontWeight: 800, opacity: 0.65 }}>{idx + 1}.</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 5: SPEAKING CHALLENGE */}
            {currentQ.type === 'speaking' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`duo-btn-3d ${isRecording ? 'recording' : 'gold'}`}
                    style={{ padding: '12px 20px', fontSize: 14.5 }}
                    onClick={toggleRecording}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    <span className="tabular">
                      {isRecording ? `Đang thu (00:${String(recordingSec).padStart(2, '0')})` : 'Nhấn để nói tiếng Anh'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="duo-btn-3d"
                    style={{ padding: '10px 14px', fontSize: 12.5 }}
                    onClick={() => setSpeakingText(currentQ.correctAnswer)}
                  >
                    Dùng câu mẫu gợi ý
                  </button>
                </div>

                <textarea
                  className="composer-input"
                  rows={3}
                  style={{ borderWidth: 2, borderRadius: 14 }}
                  placeholder="Giọng nói của bạn sẽ hiện ở đây (hoặc gõ trực tiếp câu trả lời tiếng Anh)..."
                  value={speakingText}
                  onChange={(e) => setSpeakingText(e.target.value)}
                />

                {speakingAnalysis && (
                  <div
                    style={{
                      background: '#141517',
                      color: 'white',
                      borderRadius: 14,
                      padding: '14px 16px',
                      border: '1.5px solid #f5bd33',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f5bd33' }}>
                        Kết quả chấm AI · CEFR {speakingAnalysis.detectedLevel}
                      </span>
                      <strong className="tabular" style={{ fontSize: 18, color: '#f5bd33' }}>
                        {speakingAnalysis.overallScore}/100
                      </strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {speakingAnalysis.pronunciationWords.map((w, i) => (
                        <span
                          key={i}
                          className="mono"
                          style={{
                            fontSize: 11.5,
                            background: 'rgba(255,255,255,0.1)',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {w.word} {w.ipa} ({w.score}%)
                        </span>
                      ))}
                    </div>
                    {speakingAnalysis.betterExpressions[0] && (
                      <div style={{ fontSize: 12.5, color: '#d1d5db' }}>
                        ✨ Better Expression:{' '}
                        <strong style={{ color: 'white' }}>
                          “{speakingAnalysis.betterExpressions[0].phrase}”
                        </strong>
                        <button
                          type="button"
                          className="ghost-link"
                          style={{ color: '#f5bd33', marginLeft: 8 }}
                          onClick={() =>
                            onSaveExpression(
                              speakingAnalysis.betterExpressions[0].phrase,
                              speakingAnalysis.betterExpressions[0].level,
                              speakingAnalysis.betterExpressions[0].contextVi
                            )
                          }
                        >
                          + Lưu sổ tay
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DUOLINGO BOTTOM CHECK / RESULT BANNER */}
          <div
            key={checkState}
            className={checkState !== 'idle' ? 'banner-pop' : ''}
            style={{
              padding: '16px 22px',
              borderTop: '2px solid #f0ece4',
              background:
                checkState === 'correct'
                  ? '#dcfce7'
                  : checkState === 'wrong'
                  ? '#fee2e2'
                  : '#fcfbf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            {checkState === 'idle' ? (
              <>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Mẹo: Bấm phím <strong>1–4</strong> để chọn nhanh, <strong>Enter</strong> để kiểm tra
                </span>
                {hearts === 0 ? (
                  <button
                    type="button"
                    className="duo-btn-3d gold"
                    style={{ padding: '10px 22px', fontSize: 14 }}
                    onClick={() => setHearts(5)}
                  >
                    ❤️ Hồi phục 5 tim miễn phí
                  </button>
                ) : (
                  <button
                    type="button"
                    className="duo-btn-3d dark"
                    style={{ padding: '11px 28px', fontSize: 14.5 }}
                    disabled={!canCheck}
                    onClick={handleCheckAnswer}
                  >
                    Kiểm tra
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 460 }}>
                  {checkState === 'correct' ? (
                    <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <XCircle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div>
                    <div
                      className="display-font"
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: checkState === 'correct' ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {checkState === 'correct' ? 'Chính xác! +25 XP' : 'Chưa đúng rồi!'}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#374151', marginTop: 2 }}>
                      {checkState === 'wrong' && (
                        <div>
                          Đáp án đúng: <strong>{currentQ.correctAnswer}</strong>
                        </div>
                      )}
                      {currentQ.explanationVi}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`duo-btn-3d ${checkState === 'correct' ? 'dark' : 'gold'}`}
                  style={{ padding: '11px 26px', fontSize: 14.5 }}
                  onClick={handleNextQuestion}
                >
                  {qIndex + 1 >= questions.length ? 'Xem tổng kết' : 'Tiếp tục →'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: AI CHATBOT HELPER (ASK ANYTHING ABOUT THE LESSON OR DEBATE) */}
        <div
          className="duo-feedback-card"
          style={{ padding: 0, overflow: 'hidden', gap: 0, height: 'calc(100vh - 210px)', minHeight: 540 }}
        >
          {/* Chatbot Dark Header */}
          <div
            style={{
              background: '#141517',
              color: 'white',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#f5bd33',
                  color: '#141517',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={19} />
              </div>
              <div>
                <div className="display-font" style={{ fontSize: 14, fontWeight: 800 }}>
                  Chatbot AI SpeakSharp
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
                  Hỏi ngữ pháp, IPA & luyện phản biện
                </div>
              </div>
            </div>

            <div className="dark-segmented">
              <button
                type="button"
                className={`dark-seg-btn ${persona === 'buddy' ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: 11 }}
                onClick={() => onPersonaChange('buddy')}
                title="Bạn đồng hành"
              >
                <HeartHandshake size={12} />
              </button>
              <button
                type="button"
                className={`dark-seg-btn ${persona === 'judge' ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: 11 }}
                onClick={() => onPersonaChange('judge')}
                title="Giám khảo"
              >
                <Gavel size={12} />
              </button>
            </div>
          </div>

          {/* Chatbot Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#ffffff' }}>
            {chatMessages.map((m) => (
              <div key={m.id} className={`msg-row ${m.role}`} style={{ maxWidth: '92%' }}>
                <div
                  className={m.role === 'ai' ? 'duo-bubble-ai' : 'duo-bubble-user'}
                  style={{ padding: '10px 13px', fontSize: 13.5, whiteSpace: 'pre-line' }}
                >
                  {m.text}
                </div>
                <div className="msg-meta">
                  <span>{m.timestamp}</span>
                  {m.role === 'ai' && (
                    <button className="ghost-link" onClick={() => speakText(m.text)}>
                      <Volume2 size={12} /> Nghe
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isChatThinking && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} color="#f5bd33" /> Trợ lý AI đang trả lời...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Ask Pills + Chatbot Input */}
          <div style={{ borderTop: '2px solid #f0ece4', padding: '10px 12px 12px', background: '#fcfbf8' }}>
            <div className="hints-strip" style={{ paddingBottom: 8 }}>
              {[
                'Giải thích câu hiện tại',
                'Phiên âm IPA chủ đề này',
                'Gợi ý cách phản biện hay',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="duo-tile"
                  style={{ padding: '5px 10px', fontSize: 11.5 }}
                  onClick={() => handleAskChatbot(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <input
                className="composer-input"
                style={{ minHeight: 40, padding: '8px 12px', fontSize: 13 }}
                placeholder="Hỏi Chatbot AI bất kỳ điều gì..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskChatbot();
                  }
                }}
              />
              <button
                type="button"
                className="duo-btn-3d dark"
                style={{ height: 40, padding: '0 13px' }}
                disabled={!chatInput.trim() || isChatThinking}
                onClick={() => handleAskChatbot()}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Celebration Modal */}
      {showCompleteModal && (
        <div className="modal-backdrop" onClick={() => setShowCompleteModal(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: 440, textAlign: 'center', borderRadius: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="icon-btn" onClick={() => setShowCompleteModal(false)}>
                <X size={14} />
              </button>
            </div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#141517',
                color: '#f5bd33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                border: '3px solid #f5bd33',
              }}
            >
              <Trophy size={30} />
            </div>
            <h3 className="display-font" style={{ fontSize: 22, fontWeight: 800 }}>
              Hoàn thành bài luyện!
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              Chủ đề: <strong>{topic.titleVi}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '18px 0' }}>
              <div style={{ background: '#141517', color: '#f5bd33', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Tổng XP</div>
                <div className="display-font tabular" style={{ fontSize: 26, fontWeight: 800 }}>+{xpEarned} XP</div>
              </div>
              <div style={{ background: '#fef6df', color: '#141517', borderRadius: 14, padding: 14, border: '1.5px solid #f5bd33' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Độ chính xác</div>
                <div className="display-font tabular" style={{ fontSize: 26, fontWeight: 800 }}>
                  {Math.round((correctCount / questions.length) * 100)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="duo-btn-3d" style={{ flex: 1, padding: '10px' }} onClick={handleRestartLesson}>
                Làm lại bài này
              </button>
              <button
                className="duo-btn-3d gold"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => {
                  setShowCompleteModal(false);
                  onOpenTopics();
                }}
              >
                Chọn chủ đề mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
