import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Crown,
  Flame,
  Gift,
  Globe,
  Heart,
  Lock,
  Mic,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { DebateTopic } from '../types';

interface LearningPathProps {
  topics: DebateTopic[];
  completedTopicIds: string[];
  activeTopicId: string;
  isPro: boolean;
  totalXp: number;
  streakDays: number;
  onStartTopic: (topic: DebateTopic) => void;
  onEarnXp?: (xp: number) => void;
  onOpenWorld3D?: () => void;
  onOpenStore: () => void;
  onOpenSurvey: () => void;
}

interface CurriculumUnit {
  id: string;
  partLabel: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  cefr: string;
  bg: string;
  text: string;
  accent: string;
  topicIds: string[];
  has3DNode?: boolean;
  chestId: string;
  chestLabel: string;
  chestXp: number;
  chestMinDone: number;
  guideTipVi: string;
  guidePhrases: Array<{ en: string; vi: string }>;
}

const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: 'unit-1',
    partLabel: 'Phần 1 · Cửa 1',
    shortLabel: 'Phần 1',
    title: 'Phản xạ Tự tin & Giao tiếp Hằng ngày',
    subtitle: 'Xóa nỗi sợ nói sai, làm chủ phát âm IPA và giao tiếp tự tin trong đời sống.',
    cefr: 'A2',
    bg: '#141517',
    text: '#ffffff',
    accent: '#f5bd33',
    topicIds: ['daily-english-fear', 'hue-heritage-tourists', 'daily-smart-shopping'],
    chestId: 'chest-unit-1',
    chestLabel: 'Rương Khởi Đầu (+50 XP)',
    chestXp: 50,
    chestMinDone: 0,
    guideTipVi:
      'Mẹo Phần 1: Đừng sợ sai ngữ pháp khi mới bắt đầu! Hãy nói chậm, nhấn rõ trọng âm từ khóa và luôn kết thúc yêu cầu bằng "please" để nghe thật lịch sự.',
    guidePhrases: [
      { en: 'Excuse me, could you help me find...?', vi: 'Xin lỗi, bạn có thể giúp tôi tìm...?' },
      { en: 'You should definitely visit the Hue Imperial City!', vi: 'Bạn nhất định nên ghé thăm Đại Nội Huế!' },
      { en: 'I would like one kilogram of organic apples, please.', vi: 'Cho tôi mua 1 ký táo hữu cơ nhé.' },
    ],
  },
  {
    id: 'unit-2',
    partLabel: 'Phần 2 · Cửa 2',
    shortLabel: 'Phần 2',
    title: 'Đời sống Học đường THCS & Kỹ năng Số',
    subtitle: 'Thảo luận các chủ đề gần gũi lớp 6–9: điện thoại, game, bạn bè trực tuyến.',
    cefr: 'A2–B1',
    bg: '#065f46',
    text: '#ffffff',
    accent: '#6ee7b7',
    topicIds: ['thcs-smartphones-school', 'thcs-video-games', 'thcs-online-vs-real-friends'],
    chestId: 'chest-unit-2',
    chestLabel: 'Rương Học Đường (+60 XP)',
    chestXp: 60,
    chestMinDone: 1,
    guideTipVi:
      'Mẹo Phần 2: Khi trình bày 2 mặt của vấn đề học đường, hãy dùng cặp từ nối "On the one hand... / On the other hand..." để câu nói mạch lạc ngay lập tức.',
    guidePhrases: [
      { en: 'Smartphones are useful in an emergency, but can be a distraction.', vi: 'Điện thoại hữu ích khi khẩn cấp nhưng dễ gây xao nhãng.' },
      { en: 'With good time management, strategy games can train quick thinking.', vi: 'Nếu quản lý thời gian tốt, game chiến thuật giúp rèn tư duy nhanh.' },
      { en: 'We must protect our privacy when making friends online.', vi: 'Chúng ta cần bảo vệ quyền riêng tư khi kết bạn trực tuyến.' },
    ],
  },
  {
    id: 'unit-3',
    partLabel: 'Phần 3 · Cửa 3',
    shortLabel: 'Phần 3',
    title: 'Nhập vai Thực tế & Thế giới 3D Online',
    subtitle: 'Thực hành tiếng Anh tại Sân bay Quốc tế, Siêu thị Fresh Mart & Thị trấn 3D.',
    cefr: 'A2–B1',
    bg: '#1e3a8a',
    text: '#ffffff',
    accent: '#7dd3fc',
    topicIds: ['travel-airport-checkin', 'wsdc-school-uniforms'],
    has3DNode: true,
    chestId: 'chest-unit-3',
    chestLabel: 'Rương Thám Hiểm 3D (+75 XP)',
    chestXp: 75,
    chestMinDone: 1,
    guideTipVi:
      'Mẹo Phần 3: Sau khi luyện mẫu câu ở đây, hãy bấm vào nút Thế giới 3D để đi bộ tới quầy Check-in, Cổng An ninh & Thu ngân và nói trực tiếp bằng micro với NPC!',
    guidePhrases: [
      { en: 'Here is my passport. Could I have a window seat, please?', vi: 'Đây là hộ chiếu của tôi. Cho tôi ghế cửa sổ nhé.' },
      { en: 'Should I place my laptop in a separate tray?', vi: 'Tôi có cần để riêng laptop ra khay không?' },
      { en: 'What time does boarding start at Gate B12?', vi: 'Mấy giờ bắt đầu lên máy bay ở Cổng B12 ạ?' },
    ],
  },
  {
    id: 'unit-4',
    partLabel: 'Phần 4 · Cửa 4',
    shortLabel: 'Phần 4',
    title: 'Phản biện IELTS Speaking & Hùng biện WSDC',
    subtitle: 'Xây dựng lập luận sắc bén, phản bác logic & nâng cấp từ vựng Band 7.0+.',
    cefr: 'B1–B2',
    bg: '#4c1d95',
    text: '#ffffff',
    accent: '#ddd6fe',
    topicIds: ['ai-in-classrooms', 'ielts-social-media', 'wsdc-four-day-school'],
    chestId: 'chest-unit-4',
    chestLabel: 'Rương Hùng Biện (+80 XP)',
    chestXp: 80,
    chestMinDone: 1,
    guideTipVi:
      'Mẹo Phần 4: Áp dụng công thức PEEL (Point → Explain → Example → Link) để mỗi lượt phản biện dài 45–60 giây rõ ý và ghi điểm cao với Giám khảo AI.',
    guidePhrases: [
      { en: 'I strongly believe a hybrid approach is far more effective.', vi: 'Tôi tin chắc mô hình kết hợp hiệu quả hơn nhiều.' },
      { en: 'Social media is a double-edged sword for teenagers today.', vi: 'Mạng xã hội là con dao hai lưỡi với thanh thiếu niên.' },
      { en: 'A four-day school week could significantly reduce student burnout.', vi: 'Tuần học 4 ngày có thể giảm đáng kể tình trạng kiệt sức.' },
    ],
  },
  {
    id: 'unit-5',
    partLabel: 'Phần 5 · Cửa 5 (Đỉnh cao)',
    shortLabel: 'Phần 5',
    title: 'Chinh phục Shark Tank, IELTS 8.0 & Du học',
    subtitle: 'Gọi vốn Startup bằng tiếng Anh, tranh biện toàn cầu & phỏng vấn học bổng C1.',
    cefr: 'B2–C1',
    bg: '#f5bd33',
    text: '#141517',
    accent: '#141517',
    topicIds: [
      'wsdc-student-shark-tank',
      'ielts-future-careers-ai',
      'ielts-climate-tech',
      'study-abroad-interview',
    ],
    chestId: 'chest-unit-5',
    chestLabel: '🏆 Rương Quán Quân (+120 XP)',
    chestXp: 120,
    chestMinDone: 1,
    guideTipVi:
      'Mẹo Phần 5: Khi thuyết trình Shark Tank hoặc phỏng vấn học bổng, hãy nêu con số cụ thể (ví dụ: 60 học sinh, 4 bản đồ 3D) và kết thúc bằng lời kêu gọi tự tin!',
    guidePhrases: [
      { en: 'Our competitive advantage combines a 3D anime world with an AI coach.', vi: 'Lợi thế cạnh tranh của chúng tôi là kết hợp thế giới 3D và gia sư AI.' },
      { en: 'Human empathy and adaptability will remain priceless in the AI era.', vi: 'Sự thấu cảm và khả năng thích nghi vẫn vô giá trong kỷ nguyên AI.' },
      { en: 'Facing a major setback taught me resilience and teamwork.', vi: 'Đối mặt thất bại lớn đã dạy tôi sự kiên cường và làm việc nhóm.' },
    ],
  },
];

const QUICK_QUIZ_ITEMS = [
  {
    q: 'Từ nào phát âm với âm "p" câm (/rɪˈsiːt/) nghĩa là "hóa đơn"?',
    opts: ['receipt', 'recipe', 'repeat'],
    ans: 'receipt',
    tip: '"Receipt" (/rɪˈsiːt/) = hóa đơn thanh toán (chữ p không đọc!).',
  },
  {
    q: 'Chọn câu ĐÚNG ngữ pháp khi bày tỏ sự đồng ý trong tranh biện:',
    opts: ['I strongly agree that...', 'I am agree that...', 'I very agree that...'],
    ans: 'I strongly agree that...',
    tip: 'Không dùng "am" trước động từ "agree" — dùng "strongly agree" để ăn điểm IELTS!',
  },
  {
    q: 'Tại quầy Check-in sân bay, muốn xin ghế cạnh cửa sổ bạn nói sao?',
    opts: ['Could I have a window seat, please?', 'Give me window.', 'I want sit window.'],
    ans: 'Could I have a window seat, please?',
    tip: 'Mẫu "Could I have..., please?" lịch sự và chuẩn tự nhiên nhất!',
  },
  {
    q: 'Cụm từ "double-edged sword" có nghĩa là gì?',
    opts: ['Con dao hai lưỡi (có cả lợi và hại)', 'Thanh kiếm sắc bén', 'Lợi thế tuyệt đối'],
    ans: 'Con dao hai lưỡi (có cả lợi và hại)',
    tip: 'Cực kỳ hay dùng khi nói về mạng xã hội, AI hoặc chơi game!',
  },
  {
    q: 'Trong Shark Tank, "competitive advantage" nghĩa là gì?',
    opts: ['Lợi thế cạnh tranh', 'Thị trường mục tiêu', 'Chi phí vận hành'],
    ans: 'Lợi thế cạnh tranh',
    tip: 'Dùng để nhấn mạnh điểm khác biệt độc đáo của dự án SpeakSharp!',
  },
];

const NODE_OFFSETS = [0, -58, 48, -36, 56];
const CHEST_STORAGE_KEY = 'speaksharp_claimed_chests_v1';

function readLocalArrayLen(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

export const LearningPath: React.FC<LearningPathProps> = ({
  topics,
  completedTopicIds,
  activeTopicId,
  isPro,
  totalXp,
  streakDays,
  onStartTopic,
  onEarnXp,
  onOpenWorld3D,
  onOpenStore,
  onOpenSurvey,
}) => {
  const [claimedChests, setClaimedChests] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CHEST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [guideUnit, setGuideUnit] = useState<CurriculumUnit | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizPick, setQuizPick] = useState<string | null>(null);

  const topicMap = useMemo(() => {
    const m = new Map<string, DebateTopic>();
    topics.forEach((t) => m.set(t.id, t));
    return m;
  }, [topics]);

  // Any custom user-created topics not in the 5 preset units get appended to Unit 5!
  const assignedIds = useMemo(
    () => new Set(CURRICULUM_UNITS.flatMap((u) => u.topicIds)),
    []
  );
  const customTopics = useMemo(
    () => topics.filter((t) => !assignedIds.has(t.id)),
    [topics, assignedIds]
  );

  const world3DDone =
    readLocalArrayLen('speaksharp_courier_quests_v1') +
    readLocalArrayLen('speaksharp_roleplay_airport_v1') +
    readLocalArrayLen('speaksharp_roleplay_supermarket_v1');

  const dailyXpProgress = Math.min(50, Math.max(0, totalXp - 120));
  const dailyLessonsDone = completedTopicIds.length;
  const totalLessonsCount = topics.length;
  const overallPct = Math.min(100, Math.round((completedTopicIds.length / Math.max(1, totalLessonsCount)) * 100));

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(''), 3200);
  };

  const handleClaimChest = (unit: CurriculumUnit, unitDoneCount: number) => {
    if (claimedChests.includes(unit.chestId)) {
      showNotice('✅ Bạn đã mở rương này rồi!');
      return;
    }
    if (unitDoneCount < unit.chestMinDone) {
      showNotice(`🔒 Hãy hoàn thành ít nhất ${unit.chestMinDone} bài trong ${unit.shortLabel} để mở rương!`);
      return;
    }
    const next = [...claimedChests, unit.chestId];
    setClaimedChests(next);
    try {
      localStorage.setItem(CHEST_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    onEarnXp?.(unit.chestXp);
    showNotice(`🎁 Chúc mừng! Bạn vừa mở ${unit.chestLabel}!`);
  };

  const scrollToUnit = (unitId: string) => {
    const el = document.getElementById(unitId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const curQuiz = QUICK_QUIZ_ITEMS[quizIdx % QUICK_QUIZ_ITEMS.length];

  const handleQuizAnswer = (opt: string) => {
    if (quizPick) return;
    setQuizPick(opt);
    if (opt === curQuiz.ans) {
      onEarnXp?.(10);
      showNotice('⚡ Chính xác! +10 XP phản xạ nhanh!');
    }
  };

  const renderTopicNode = (topic: DebateTopic, idx: number, accentHex: string) => {
    const isDone = completedTopicIds.includes(topic.id);
    const locked = topic.isPro && !isPro;
    const isActive = !locked && topic.id === activeTopicId;
    const offset = NODE_OFFSETS[idx % NODE_OFFSETS.length];

    return (
      <div key={topic.id} className="path-node-wrap" style={{ transform: `translateX(${offset}px)` }}>
        {isActive && <div className="path-start-bubble">BẮT ĐẦU</div>}

        <button
          type="button"
          className={`path-node-btn ${locked ? 'locked' : isDone ? 'done' : isActive ? 'active' : ''}`}
          style={{
            background: locked
              ? undefined
              : isDone
              ? '#16a34a'
              : isActive
              ? '#f5bd33'
              : '#141517',
            color: locked ? undefined : isActive ? '#141517' : '#ffffff',
            boxShadow: locked
              ? undefined
              : isDone
              ? '0 7px 0 #14532d'
              : isActive
              ? '0 7px 0 #b45309'
              : `0 7px 0 ${accentHex === '#141517' ? '#b45309' : '#2d3748'}`,
          }}
          onClick={() => (locked ? onOpenStore() : onStartTopic(topic))}
          title={locked ? 'Mở khóa Pro để học chủ đề này' : topic.title}
        >
          {locked ? (
            <Lock size={23} />
          ) : isDone ? (
            <Check size={28} strokeWidth={3} />
          ) : isActive ? (
            <Star size={28} fill="#141517" />
          ) : (
            <Mic size={24} />
          )}
        </button>

        <div className="path-node-label">{topic.titleVi}</div>
        <span className="badge badge-slate" style={{ fontSize: 10.5 }}>
          {topic.category} · {topic.level} · {topic.durationMin}p
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Floating Reward Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            background: '#141517',
            color: '#f5bd33',
            border: '2px solid #f5bd33',
            borderRadius: 999,
            padding: '9px 20px',
            fontSize: 13.5,
            fontWeight: 800,
            boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* TOP CURRICULUM OVERVIEW + 5-UNIT QUICK-JUMP BAR */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-indigo">5 Phần · {totalLessonsCount} Bài học + 4 Bản đồ 3D</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                Lộ trình chuẩn CEFR A2 → C1
              </span>
            </div>
            <h1 className="display-font" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
              Lộ trình Luyện nói & Phản biện SpeakSharp
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div className="tabular" style={{ fontSize: 13.5, fontWeight: 800, color: '#141517' }}>
                {completedTopicIds.length}/{totalLessonsCount} bài ({overallPct}%)
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Thế giới 3D: {world3DDone}/13 nhiệm vụ
              </div>
            </div>
            <button className="duo-btn-3d" style={{ padding: '7px 12px', fontSize: 12 }} onClick={onOpenSurvey}>
              <Target size={14} /> Cá nhân hóa
            </button>
          </div>
        </div>

        {/* Overall CEFR Progress Track */}
        <div className="duo-progress-track" style={{ height: 9 }}>
          <div className="duo-progress-fill" style={{ width: `${Math.max(6, overallPct)}%` }} />
        </div>

        {/* 5-Unit Quick-Jump Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CURRICULUM_UNITS.map((u) => {
            const uTopics = u.topicIds.map((id) => topicMap.get(id)).filter(Boolean) as DebateTopic[];
            const doneInU = uTopics.filter((t) => completedTopicIds.includes(t.id)).length;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => scrollToUnit(u.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#141517',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: u.bg === '#f5bd33' ? '#f59e0b' : u.bg,
                    display: 'inline-block',
                  }}
                />
                <span>{u.shortLabel}</span>
                <span className="tabular" style={{ fontSize: 11, color: '#64748b' }}>
                  {doneInU}/{uTopics.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="learn-path-grid">
        {/* CENTER: 5-UNIT WINDING DUOLINGO LEARNING PATH */}
        <div>
          {CURRICULUM_UNITS.map((unit, uIdx) => {
            const unitTopics = [
              ...(unit.topicIds.map((id) => topicMap.get(id)).filter(Boolean) as DebateTopic[]),
              ...(uIdx === CURRICULUM_UNITS.length - 1 ? customTopics : []),
            ];
            const unitDoneCount = unitTopics.filter((t) => completedTopicIds.includes(t.id)).length;
            const chestClaimed = claimedChests.includes(unit.chestId);
            const chestUnlocked = unitDoneCount >= unit.chestMinDone;
            const isGoldUnit = unit.bg === '#f5bd33';

            return (
              <section key={unit.id} id={unit.id} style={{ scrollMarginTop: 20, marginBottom: 18 }}>
                <div
                  className={`unit-banner ${isGoldUnit ? 'gold' : ''}`}
                  style={
                    isGoldUnit
                      ? undefined
                      : {
                          background: unit.bg,
                          color: unit.text,
                          border: `1.5px solid ${unit.accent}44`,
                        }
                  }
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: unit.accent,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span>{unit.partLabel}</span>
                      <span
                        style={{
                          padding: '1px 7px',
                          borderRadius: 999,
                          background: isGoldUnit ? 'rgba(20,21,23,0.14)' : 'rgba(255,255,255,0.14)',
                          fontSize: 10.5,
                        }}
                      >
                        CEFR {unit.cefr} · {unitDoneCount}/{unitTopics.length}
                      </span>
                    </div>
                    <h2 className="display-font" style={{ fontSize: 19.5, fontWeight: 800, marginTop: 3 }}>
                      {unit.title}
                    </h2>
                    <p
                      style={{
                        fontSize: 13,
                        opacity: isGoldUnit ? 0.86 : 0.82,
                        marginTop: 2,
                      }}
                    >
                      {unit.subtitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`duo-btn-3d ${isGoldUnit ? 'dark' : 'gold'}`}
                    style={{ padding: '8px 13px', fontSize: 12.5, flexShrink: 0 }}
                    onClick={() => setGuideUnit(unit)}
                  >
                    <BookOpen size={14} /> Sổ tay
                  </button>
                </div>

                <div className="path-nodes-col" style={{ paddingTop: 22, gap: 34 }}>
                  {unitTopics.map((t, idx) => renderTopicNode(t, idx, unit.accent))}

                  {/* Special Interactive 3D World Node inside Unit 3 */}
                  {unit.has3DNode && onOpenWorld3D && (
                    <div className="path-node-wrap" style={{ transform: 'translateX(-46px)' }}>
                      <div
                        className="path-start-bubble"
                        style={{ background: '#0284c7', color: '#ffffff' }}
                      >
                        3D ONLINE
                      </div>
                      <button
                        type="button"
                        className="path-node-btn"
                        style={{
                          background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                          color: '#ffffff',
                          boxShadow: '0 7px 0 #1e3a8a',
                        }}
                        onClick={onOpenWorld3D}
                        title="Mở 4 Bản đồ Thế giới 3D Online"
                      >
                        <Globe size={27} />
                      </button>
                      <div className="path-node-label" style={{ color: '#1e3a8a' }}>
                        Thực hành 4 Bản đồ 3D Online
                      </div>
                      <span className="badge badge-indigo" style={{ fontSize: 10.5 }}>
                        Sân bay · Siêu thị · Thị trấn ({world3DDone}/13)
                      </span>
                    </div>
                  )}

                  {/* Claimable Unit Treasure Chest */}
                  <div className="path-node-wrap" style={{ transform: 'translateX(44px)' }}>
                    <button
                      type="button"
                      className="path-node-btn"
                      style={{
                        background: chestClaimed
                          ? '#dcfce7'
                          : chestUnlocked
                          ? '#fef6df'
                          : '#f1f5f9',
                        color: chestClaimed ? '#15803d' : chestUnlocked ? '#b45309' : '#94a3b8',
                        boxShadow: chestClaimed
                          ? '0 7px 0 #86efac'
                          : chestUnlocked
                          ? '0 7px 0 #e2bc58'
                          : '0 7px 0 #cbd5e1',
                      }}
                      onClick={() => handleClaimChest(unit, unitDoneCount)}
                      title={
                        chestClaimed
                          ? 'Đã nhận thưởng rương này'
                          : chestUnlocked
                          ? `Nhấn để mở ${unit.chestLabel}`
                          : `Hoàn thành ${unit.chestMinDone} bài trong ${unit.shortLabel} để mở`
                      }
                    >
                      {chestClaimed ? (
                        <Check size={26} strokeWidth={3} />
                      ) : uIdx === CURRICULUM_UNITS.length - 1 ? (
                        <Trophy size={26} />
                      ) : (
                        <Gift size={26} />
                      )}
                    </button>
                    <div
                      className="path-node-label"
                      style={{ color: chestClaimed ? '#15803d' : '#9a6b00' }}
                    >
                      {chestClaimed ? `Đã nhận +${unit.chestXp} XP` : unit.chestLabel}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* RIGHT RAIL: STATS, 3 DAILY QUESTS, QUICK REFLEX QUIZ & PRO CARD */}
        <aside className="learn-right-rail">
          {/* Top Stats Row */}
          <div
            className="rail-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}
          >
            <span className="duo-stat-pill tabular" style={{ background: '#fef6df', color: '#b45309' }}>
              <Flame size={16} fill="#f59e0b" color="#f59e0b" /> {streakDays}
            </span>
            <span className="duo-stat-pill tabular" style={{ background: '#141517', color: '#f5bd33' }}>
              <Zap size={16} fill="#f5bd33" /> {totalXp} XP
            </span>
            <span className="duo-stat-pill tabular" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <Heart size={16} fill="#dc2626" /> 5
            </span>
          </div>

          {/* 3 Daily Quests Widget */}
          <div className="rail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 className="display-font" style={{ fontSize: 15.5, fontWeight: 800 }}>
                Nhiệm vụ hằng ngày
              </h3>
              <Target size={17} color="#b45309" />
            </div>

            <div style={{ display: 'grid', gap: 13 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                  <span>Kiếm 50 XP hôm nay</span>
                  <span className="tabular" style={{ color: '#b45309' }}>{dailyXpProgress}/50</span>
                </div>
                <div className="duo-progress-track" style={{ height: 10 }}>
                  <div className="duo-progress-fill" style={{ width: `${Math.max(8, (dailyXpProgress / 50) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                  <span>Hoàn thành 1 bài luyện nói</span>
                  <span className="tabular" style={{ color: '#b45309' }}>{Math.min(1, dailyLessonsDone)}/1</span>
                </div>
                <div className="duo-progress-track" style={{ height: 10 }}>
                  <div className="duo-progress-fill" style={{ width: `${Math.min(1, dailyLessonsDone) * 100}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                  <span>Nhập vai 1 nhiệm vụ Thế giới 3D</span>
                  <span className="tabular" style={{ color: '#0284c7' }}>{Math.min(1, world3DDone)}/1</span>
                </div>
                <div className="duo-progress-track" style={{ height: 10 }}>
                  <div
                    className="duo-progress-fill"
                    style={{
                      width: `${Math.min(1, world3DDone) * 100}%`,
                      background: '#0284c7',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 60s Quick-Reflex Mini-Quiz Widget */}
          <div className="rail-card" style={{ borderColor: '#fde68a', background: '#fffdf7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: '#92400e' }}>
                <Sparkles size={15} color="#f59e0b" /> Phản xạ nhanh (+10 XP)
              </span>
              <span className="tabular" style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                {(quizIdx % QUICK_QUIZ_ITEMS.length) + 1}/{QUICK_QUIZ_ITEMS.length}
              </span>
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#141517', marginBottom: 10 }}>
              {curQuiz.q}
            </p>
            <div style={{ display: 'grid', gap: 6 }}>
              {curQuiz.opts.map((opt) => {
                const picked = quizPick === opt;
                const isCorrect = opt === curQuiz.ans;
                let bg = '#ffffff';
                let border = '#e2e8f0';
                if (quizPick) {
                  if (isCorrect) {
                    bg = '#dcfce7';
                    border = '#16a34a';
                  } else if (picked) {
                    bg = '#fee2e2';
                    border = '#ef4444';
                  }
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleQuizAnswer(opt)}
                    style={{
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: 9,
                      border: `1.5px solid ${border}`,
                      background: bg,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#141517',
                      cursor: quizPick ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {quizPick && (
              <div style={{ marginTop: 9, display: 'grid', gap: 7 }}>
                <div style={{ fontSize: 11.5, color: '#475569', background: '#f8fafc', padding: '7px 9px', borderRadius: 8 }}>
                  💡 {curQuiz.tip}
                </div>
                <button
                  type="button"
                  className="duo-btn-3d gold"
                  style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                  onClick={() => {
                    setQuizPick(null);
                    setQuizIdx((i) => i + 1);
                  }}
                >
                  Câu tiếp theo →
                </button>
              </div>
            )}
          </div>

          {/* Pro Upgrade Card */}
          {!isPro && (
            <div
              className="rail-card"
              style={{ background: '#141517', color: 'white', borderColor: '#f5bd33' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f5bd33', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
                <Crown size={16} /> SPEAKSHARP PRO · 69K/THÁNG
              </div>
              <p style={{ fontSize: 12.5, color: '#d1d5db', marginBottom: 14 }}>
                Mở khóa trọn bộ 5 Phần (15 bài IELTS, WSDC, Shark Tank, Du học) + không giới hạn luyện nói 24/7.
              </p>
              <button className="duo-btn-3d gold" style={{ width: '100%' }} onClick={onOpenStore}>
                Dùng thử Pro ngay
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* UNIT GUIDEBOOK MODAL (Vocab + IPA Audio + Model Phrases!) */}
      {guideUnit && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(15, 23, 42, 0.56)',
            padding: 16,
          }}
          onClick={() => setGuideUnit(null)}
        >
          <div
            className="modal-box"
            style={{ maxWidth: 560, width: '92vw', maxHeight: '88vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div>
                <span className="badge badge-indigo">{guideUnit.partLabel} · CEFR {guideUnit.cefr}</span>
                <h3 className="display-font" style={{ fontSize: 19, fontWeight: 800, marginTop: 5 }}>
                  📖 Sổ tay: {guideUnit.title}
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setGuideUnit(null)}>
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                background: '#fefce8',
                border: '1.5px solid #fde047',
                borderRadius: 12,
                padding: '10px 13px',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#713f12',
                marginBottom: 14,
              }}
            >
              💡 {guideUnit.guideTipVi}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                Từ vựng & Phát âm IPA trọng tâm (Bấm loa để nghe)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                {guideUnit.topicIds
                  .map((id) => topicMap.get(id))
                  .filter(Boolean)
                  .flatMap((t) => (t as DebateTopic).keyVocab.slice(0, 2))
                  .slice(0, 6)
                  .map((v) => (
                    <div
                      key={v.word}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1.5px solid #e2e8f0',
                        background: '#f8fafc',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#141517' }}>{v.word}</div>
                        <div style={{ fontSize: 11, color: '#0369a1', fontFamily: 'monospace' }}>{v.ipa}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{v.meaningVi}</div>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        title={`Nghe phát âm ${v.word}`}
                        onClick={() => speakText(v.word)}
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                Mẫu câu ăn điểm
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {guideUnit.guidePhrases.map((p) => (
                  <div
                    key={p.en}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#141517' }}>“{p.en}”</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{p.vi}</div>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Nghe câu mẫu"
                      onClick={() => speakText(p.en)}
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="duo-btn-3d gold"
              style={{ width: '100%' }}
              onClick={() => setGuideUnit(null)}
            >
              Đã hiểu — Quay lại Lộ trình
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
