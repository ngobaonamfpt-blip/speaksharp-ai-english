import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  Play,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  Star,
  Unlock,
  Volume2,
  X,
} from 'lucide-react';
import { CEFRLevel, DebateTopic, TopicCategory } from '../types';
import { Reveal } from './Reveal';

interface TopicLibraryProps {
  topics: DebateTopic[];
  activeTopicId: string;
  completedTopicIds?: string[];
  isPro: boolean;
  initialCategory?: 'Tất cả' | TopicCategory;
  onSelectTopic: (topic: DebateTopic) => void;
  onCreateCustomTopic: (topic: DebateTopic) => void;
  onUnlockPro: () => void;
}

const CATEGORIES: Array<'Tất cả' | TopicCategory> = [
  'Tất cả',
  'THCS & Đời sống',
  'IELTS Speaking',
  'Hùng biện WSDC',
  'Phỏng vấn Du học',
  'Giao tiếp hằng ngày',
];

const LEVELS: Array<'Tất cả' | CEFRLevel> = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

const TOPIC_CATEGORY_IMAGES: Record<TopicCategory, string> = {
  'THCS & Đời sống':
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  'IELTS Speaking':
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  'Hùng biện WSDC':
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  'Phỏng vấn Du học':
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'Giao tiếp hằng ngày':
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
};

const FAV_STORAGE_KEY = 'speaksharp_fav_topics_v1';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function speakWord(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export const TopicLibrary: React.FC<TopicLibraryProps> = ({
  topics,
  activeTopicId,
  completedTopicIds = [],
  isPro,
  initialCategory = 'Tất cả',
  onSelectTopic,
  onCreateCustomTopic,
  onUnlockPro,
}) => {
  const [selectedCat, setSelectedCat] = useState<'Tất cả' | TopicCategory>(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState<'Tất cả' | CEFRLevel>('Tất cả');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [previewTopic, setPreviewTopic] = useState<DebateTopic | null>(null);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTitleVi, setCustomTitleVi] = useState('');
  const [customCat, setCustomCat] = useState<TopicCategory>('THCS & Đời sống');
  const [customLevel, setCustomLevel] = useState<CEFRLevel>('B1');

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleRandomTopic = () => {
    const unlocked = topics.filter((t) => !t.isPro || isPro);
    if (unlocked.length === 0) return;
    const pool = unlocked.length > 1 ? unlocked.filter((t) => t.id !== activeTopicId) : unlocked;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) setPreviewTopic(pick);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = customTitle.trim();
    if (!title) return;
    const newTopic: DebateTopic = {
      id: `custom-${Date.now()}`,
      title,
      titleVi: customTitleVi.trim() || 'Chủ đề phản biện tự tạo',
      motion: title,
      category: customCat,
      level: customLevel,
      isPro: false,
      durationMin: 15,
      keyVocab: [
        { word: 'perspective', ipa: '/pərˈspektɪv/', meaningVi: 'góc nhìn, quan điểm' },
        { word: 'evidence', ipa: '/ˈevɪdəns/', meaningVi: 'bằng chứng thuyết phục' },
        { word: 'impact', ipa: '/ˈɪmpækt/', meaningVi: 'tác động' },
      ],
      openingQuestionJudge: `Let us debate your custom motion: "${title}". State your opening claim clearly and back it up with one concrete example.`,
      openingQuestionBuddy: `Awesome topic! Let's practice talking about: "${title}". What is your first honest thought about this?`,
      sampleHints: [
        'From my perspective, this issue has both clear benefits and hidden challenges.',
        'One strong example that supports my argument is how students experience this daily.',
        'However, we should also consider the long-term impact on society.',
      ],
      followUpsJudge: [
        'That is an interesting point. How would you respond to someone who strongly disagrees with your assumption?',
        'Can you strengthen that claim with a specific real-world example or measurable outcome?',
        'If we adopt your stance completely, what unintended consequence might arise?',
      ],
      followUpsBuddy: [
        'You explained that really clearly! What personal experience made you think that way?',
        'Nice idea! Try adding a linking phrase like "On the other hand" to explore the opposite view too.',
        'Great progress! How would you summarize your final opinion in one memorable sentence?',
      ],
    };
    onCreateCustomTopic(newTopic);
    setCustomTitle('');
    setCustomTitleVi('');
    setShowCustomModal(false);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topics.filter((t) => {
      const catOk = selectedCat === 'Tất cả' || t.category === selectedCat;
      const lvlOk = selectedLevel === 'Tất cả' || t.level === selectedLevel;
      const favOk = !onlyFavorites || favorites.includes(t.id);
      const searchOk =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.titleVi.toLowerCase().includes(q) ||
        t.motion.toLowerCase().includes(q) ||
        t.keyVocab.some(
          (v) => v.word.toLowerCase().includes(q) || v.meaningVi.toLowerCase().includes(q)
        );
      return catOk && lvlOk && favOk && searchOk;
    });
  }, [topics, selectedCat, selectedLevel, onlyFavorites, favorites, searchQuery]);

  const completedCount = topics.filter((t) => completedTopicIds.includes(t.id)).length;
  const freeCount = topics.filter((t) => !t.isPro).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kho Chủ Đề Luyện Nói & Phản Biện</h1>
          <p className="page-sub">
            {topics.length} chủ đề thực tế từ THCS lớp 6–9, Di sản Huế đến IELTS & Shark Tank (CEFR A2 – C1).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleRandomTopic} title="Gợi ý ngẫu nhiên 1 chủ đề miễn phí">
            <Shuffle size={14} /> Chọn ngẫu nhiên
          </button>
          <button className="duo-btn-3d gold" onClick={() => setShowCustomModal(true)}>
            <Plus size={15} /> Tạo chủ đề riêng
          </button>
          {!isPro && (
            <button className="btn-secondary" onClick={onUnlockPro}>
              <Unlock size={14} /> Mở khóa Pro (Demo)
            </button>
          )}
        </div>
      </div>

      {/* Compact Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={18} style={{ color: '#4f46e5', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{topics.length} chủ đề</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{freeCount} miễn phí · {topics.length - freeCount} Pro</div>
          </div>
        </div>
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>
              {completedCount}/{topics.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chủ đề đã hoàn thành</div>
          </div>
        </div>
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star size={18} style={{ color: '#eab308', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{favorites.length} đã lưu</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Danh sách yêu thích</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div className="segmented" style={{ flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`seg-btn ${selectedCat === c ? 'active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`seg-btn ${onlyFavorites ? 'active' : ''}`}
            onClick={() => setOnlyFavorites((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: onlyFavorites ? '#fef3c7' : 'var(--surface)',
              color: onlyFavorites ? '#92400e' : 'var(--text)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Star size={13} fill={onlyFavorites ? '#eab308' : 'none'} color="#eab308" />
            Yêu thích
          </button>

          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              className="composer-input"
              style={{ minHeight: 32, padding: '5px 10px 5px 29px', width: 210, fontSize: 12.5 }}
              placeholder="Tìm chủ đề, từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="segmented">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className={`seg-btn ${selectedLevel === l ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '42px 20px', marginTop: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            Không tìm thấy chủ đề phù hợp với bộ lọc hiện tại.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Thử đổi danh mục, trình độ hoặc tạo ngay chủ đề tiếng Anh riêng của bạn!
          </p>
          <button
            className="btn-secondary"
            onClick={() => {
              setSelectedCat('Tất cả');
              setSelectedLevel('Tất cả');
              setOnlyFavorites(false);
              setSearchQuery('');
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="topics-grid">
          {filtered.map((topic, idx) => {
            const locked = topic.isPro && !isPro;
            const isCurrent = topic.id === activeTopicId;
            const isDone = completedTopicIds.includes(topic.id);
            const isFav = favorites.includes(topic.id);
            return (
              <Reveal key={topic.id} variant="fade-up" delay={(idx % 3) * 75}>
                <div
                  className="card topic-card"
                  style={{
                    borderColor: isCurrent ? 'var(--text)' : undefined,
                    padding: 16,
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <div className="img-cover-wrap" style={{ height: 138, position: 'relative' }}>
                    <img src={TOPIC_CATEGORY_IMAGES[topic.category]} alt={topic.title} loading="lazy" />

                    {/* Top-left Done badge */}
                    {isDone && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'rgba(22, 163, 74, 0.94)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 999,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={12} /> Đã luyện
                      </span>
                    )}

                    {/* Top-right Favorite button */}
                    <button
                      onClick={(e) => toggleFavorite(topic.id, e)}
                      title={isFav ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.92)',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                      }}
                    >
                      <Star size={15} color="#eab308" fill={isFav ? '#eab308' : 'none'} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {topic.category}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="badge badge-slate">{topic.level}</span>
                      {topic.isPro && <span className="badge badge-indigo">Pro</span>}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3 }}>{topic.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                      {topic.titleVi}
                    </p>
                  </div>

                  {/* Interactive Key Vocabulary Chips (click to hear pronunciation!) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                    {topic.keyVocab.slice(0, 3).map((v) => (
                      <button
                        key={v.word}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(v.word);
                        }}
                        title={`${v.word} ${v.ipa} — ${v.meaningVi} (Nhấn để nghe phát âm)`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 999,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-subtle, #f8fafc)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Volume2 size={11} style={{ color: '#4f46e5' }} />
                        {v.word}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={12} /> {topic.durationMin}p
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => setPreviewTopic(topic)}
                        title="Xem trước từ vựng IPA & câu gợi ý"
                      >
                        <Eye size={13} /> Xem
                      </button>

                      {locked ? (
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 11px', fontSize: 12 }}
                          onClick={onUnlockPro}
                        >
                          <Lock size={13} /> Mở khóa
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => onSelectTopic(topic)}
                        >
                          <Play size={13} /> {isCurrent ? 'Tiếp tục' : 'Luyện tập'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Quick Warm-up Preview Modal */}
      {previewTopic && (
        <div className="modal-backdrop" onClick={() => setPreviewTopic(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge badge-slate">{previewTopic.category}</span>
                  <span className="badge badge-slate">CEFR {previewTopic.level}</span>
                  {previewTopic.isPro && <span className="badge badge-indigo">Pro</span>}
                </div>
                <h3 className="display-font" style={{ fontSize: 18, fontWeight: 800 }}>
                  {previewTopic.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {previewTopic.titleVi}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setPreviewTopic(null)}>
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: 14,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 11.5, color: '#4f46e5', marginBottom: 4 }}>
                ĐỀ BÀI PHẢN BIỆN (MOTION)
              </div>
              <div>{previewTopic.motion}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Volume2 size={14} color="#4f46e5" /> Từ vựng trọng tâm (nhấn để nghe phát âm chuẩn)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                {previewTopic.keyVocab.map((v) => (
                  <button
                    key={v.word}
                    type="button"
                    onClick={() => speakWord(v.word)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13.5, color: '#111827' }}>{v.word}</strong>
                      <Volume2 size={13} color="#4f46e5" />
                    </div>
                    <div className="mono" style={{ fontSize: 11.5, color: '#be185d' }}>
                      {v.ipa}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{v.meaningVi}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={14} color="#d97706" /> Gợi ý mở đầu câu trả lời
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {previewTopic.sampleHints.map((hint, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12.5,
                      padding: '7px 10px',
                      borderRadius: 9,
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      color: '#78350f',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>“{hint}”</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => speakWord(hint)}
                      title="Nghe đọc mẫu"
                      style={{ flexShrink: 0 }}
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setPreviewTopic(null)}>
                Đóng
              </button>
              {previewTopic.isPro && !isPro ? (
                <button
                  className="duo-btn-3d gold"
                  onClick={() => {
                    onUnlockPro();
                    setPreviewTopic(null);
                  }}
                >
                  <Unlock size={14} /> Mở khóa Pro để luyện
                </button>
              ) : (
                <button
                  className="duo-btn-3d gold"
                  onClick={() => {
                    const chosen = previewTopic;
                    setPreviewTopic(null);
                    onSelectTopic(chosen);
                  }}
                >
                  <Play size={14} /> Bắt đầu luyện nói ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Topic Modal */}
      {showCustomModal && (
        <div className="modal-backdrop" onClick={() => setShowCustomModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 className="display-font" style={{ fontSize: 18, fontWeight: 800 }}>
                Tạo Chủ Đề Phản Biện Riêng
              </h3>
              <button className="icon-btn" onClick={() => setShowCustomModal(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Đề bài / Câu hỏi bằng tiếng Anh *
                </label>
                <input
                  className="composer-input"
                  style={{ width: '100%' }}
                  placeholder="VD: Should students have less homework on weekends?"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Mô tả ngắn tiếng Việt (tùy chọn)
                </label>
                <input
                  className="composer-input"
                  style={{ width: '100%' }}
                  placeholder="VD: Học sinh có nên có ít bài tập cuối tuần hơn?"
                  value={customTitleVi}
                  onChange={(e) => setCustomTitleVi(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Danh mục
                  </label>
                  <select
                    className="composer-input"
                    style={{ width: '100%' }}
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value as TopicCategory)}
                  >
                    <option value="THCS & Đời sống">THCS & Đời sống</option>
                    <option value="IELTS Speaking">IELTS Speaking</option>
                    <option value="Hùng biện WSDC">Hùng biện WSDC</option>
                    <option value="Phỏng vấn Du học">Phỏng vấn Du học</option>
                    <option value="Giao tiếp hằng ngày">Giao tiếp hằng ngày</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Trình độ CEFR
                  </label>
                  <select
                    className="composer-input"
                    style={{ width: '100%' }}
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value as CEFRLevel)}
                  >
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCustomModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="duo-btn-3d gold">
                  Tạo & Vào luyện ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
