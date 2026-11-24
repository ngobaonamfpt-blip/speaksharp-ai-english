import React, { useState } from 'react';
import { Lock, Play, Plus, Search, Unlock, X } from 'lucide-react';
import { CEFRLevel, DebateTopic, TopicCategory } from '../types';
import { Reveal } from './Reveal';

interface TopicLibraryProps {
  topics: DebateTopic[];
  activeTopicId: string;
  isPro: boolean;
  initialCategory?: 'Tất cả' | TopicCategory;
  onSelectTopic: (topic: DebateTopic) => void;
  onCreateCustomTopic: (topic: DebateTopic) => void;
  onUnlockPro: () => void;
}

const CATEGORIES: Array<'Tất cả' | TopicCategory> = [
  'Tất cả',
  'IELTS Speaking',
  'Hùng biện WSDC',
  'Phỏng vấn Du học',
  'Giao tiếp hằng ngày',
];

const LEVELS: Array<'Tất cả' | CEFRLevel> = ['Tất cả', 'A2', 'B1', 'B2', 'C1'];

const TOPIC_CATEGORY_IMAGES: Record<TopicCategory, string> = {
  'IELTS Speaking': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  'Hùng biện WSDC': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  'Phỏng vấn Du học': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'Giao tiếp hằng ngày': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
};

export const TopicLibrary: React.FC<TopicLibraryProps> = ({
  topics,
  activeTopicId,
  isPro,
  initialCategory = 'Tất cả',
  onSelectTopic,
  onCreateCustomTopic,
  onUnlockPro,
}) => {
  const [selectedCat, setSelectedCat] = useState<'Tất cả' | TopicCategory>(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState<'Tất cả' | CEFRLevel>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTitleVi, setCustomTitleVi] = useState('');
  const [customCat, setCustomCat] = useState<TopicCategory>('IELTS Speaking');
  const [customLevel, setCustomLevel] = useState<CEFRLevel>('B2');

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

  const filtered = topics.filter((t) => {
    const catOk = selectedCat === 'Tất cả' || t.category === selectedCat;
    const lvlOk = selectedLevel === 'Tất cả' || t.level === selectedLevel;
    const q = searchQuery.trim().toLowerCase();
    const searchOk =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.titleVi.toLowerCase().includes(q);
    return catOk && lvlOk && searchOk;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kho Chủ Đề</h1>
          <p className="page-sub">Chọn chủ đề theo mục tiêu luyện thi và trình độ CEFR (A2 – C1).</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              style={{ minHeight: 32, padding: '5px 10px 5px 29px', width: 190, fontSize: 12.5 }}
              placeholder="Tìm chủ đề..."
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
      <div className="topics-grid">
        {filtered.map((topic, idx) => {
          const locked = topic.isPro && !isPro;
          const isCurrent = topic.id === activeTopicId;
          return (
            <Reveal key={topic.id} variant="fade-up" delay={(idx % 3) * 90}>
              <div
                className="card topic-card"
                style={{ borderColor: isCurrent ? 'var(--text)' : undefined, padding: 16, height: '100%' }}
              >
              <div className="img-cover-wrap" style={{ height: 140 }}>
                <img src={TOPIC_CATEGORY_IMAGES[topic.category]} alt={topic.title} loading="lazy" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {topic.category}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-slate">{topic.level}</span>
                  {topic.isPro && <span className="badge badge-indigo">Pro</span>}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700 }}>{topic.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {topic.titleVi}
                </p>
              </div>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {topic.durationMin} phút
                </span>

                {locked ? (
                  <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={onUnlockPro}>
                    <Lock size={13} /> Mở khóa
                  </button>
                ) : (
                  <button className="btn-primary" style={{ padding: '6px 12px' }} onClick={() => onSelectTopic(topic)}>
                    <Play size={13} /> {isCurrent ? 'Tiếp tục' : 'Luyện tập'}
                  </button>
                )}
              </div>
              </div>
            </Reveal>
          );
        })}
      </div>
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
                  placeholder="VD: Should universities abolish traditional written exams?"
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
                  placeholder="VD: Đại học có nên bỏ kỳ thi viết truyền thống?"
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
