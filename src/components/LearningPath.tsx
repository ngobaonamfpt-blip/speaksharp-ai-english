import React from 'react';
import {
  BookOpen,
  Check,
  Crown,
  Flame,
  Gift,
  Heart,
  Lock,
  Mic,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { DebateTopic } from '../types';
import { Reveal } from './Reveal';

interface LearningPathProps {
  topics: DebateTopic[];
  completedTopicIds: string[];
  activeTopicId: string;
  isPro: boolean;
  totalXp: number;
  streakDays: number;
  onStartTopic: (topic: DebateTopic) => void;
  onOpenStore: () => void;
  onOpenSurvey: () => void;
}

const NODE_OFFSETS = [0, -56, -86, -42, 34, 72, 24];

export const LearningPath: React.FC<LearningPathProps> = ({
  topics,
  completedTopicIds,
  activeTopicId,
  isPro,
  totalXp,
  streakDays,
  onStartTopic,
  onOpenStore,
  onOpenSurvey,
}) => {
  const unit1Topics = topics.slice(0, 3);
  const unit2Topics = topics.slice(3);

  const dailyXpProgress = Math.min(50, totalXp % 50 === 0 && totalXp > 120 ? 50 : Math.min(50, Math.max(0, totalXp - 120)));
  const dailyLessonsDone = completedTopicIds.length;

  const renderNode = (topic: DebateTopic, idx: number, globalIdx: number) => {
    const isDone = completedTopicIds.includes(topic.id);
    const locked = topic.isPro && !isPro;
    const isActive = !locked && (topic.id === activeTopicId || (!isDone && globalIdx === 0));
    const offset = NODE_OFFSETS[idx % NODE_OFFSETS.length];

    return (
      <Reveal key={topic.id} variant="zoom-in" delay={idx * 90}>
        <div
          className="path-node-wrap"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {isActive && <div className="path-start-bubble">BẮT ĐẦU</div>}

          <button
            type="button"
            className={`path-node-btn ${locked ? 'locked' : isDone ? 'done' : isActive ? 'active' : 'done'}`}
            style={{
              background: !locked && !isDone && !isActive ? '#141517' : undefined,
              color: !locked && !isDone && !isActive ? '#ffffff' : undefined,
            }}
            onClick={() => (locked ? onOpenStore() : onStartTopic(topic))}
            title={locked ? 'Mở khóa Pro để học chủ đề này' : topic.title}
          >
            {locked ? (
              <Lock size={24} />
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
            {topic.category} · {topic.level}
          </span>
        </div>
      </Reveal>
    );
  };

  return (
    <div className="learn-path-grid">
      {/* CENTER: WINDING DUOLINGO LEARNING PATH */}
      <div>
        {/* UNIT 1 */}
        <div className="unit-banner">
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f5bd33' }}>
              Phần 1 · Cửa 1
            </div>
            <h2 className="display-font" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              Phản xạ Tự tin & Lập luận Cơ bản
            </h2>
            <p style={{ fontSize: 13, color: '#a1a7b3', marginTop: 2 }}>
              Xóa nỗi sợ nói sai, làm chủ phát âm IPA và mở đầu quan điểm tự nhiên.
            </p>
          </div>
          <button
            className="duo-btn-3d gold"
            style={{ padding: '8px 14px', fontSize: 12.5, flexShrink: 0 }}
            onClick={onOpenSurvey}
          >
            <BookOpen size={14} /> Lộ trình
          </button>
        </div>

        <div className="path-nodes-col">
          {unit1Topics.map((t, i) => renderNode(t, i, i))}

          {/* Bonus Chest Node */}
          <div className="path-node-wrap" style={{ transform: 'translateX(44px)' }}>
            <button
              type="button"
              className="path-node-btn"
              style={{ background: '#fef6df', color: '#b45309', boxShadow: '0 7px 0 #e2bc58' }}
              onClick={onOpenStore}
              title="Rương thưởng XP"
            >
              <Gift size={26} />
            </button>
            <div className="path-node-label" style={{ color: '#9a6b00' }}>Rương đổi quà XP</div>
          </div>
        </div>

        {/* UNIT 2 */}
        <Reveal variant="fade-up">
          <div className="unit-banner gold">
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.78 }}>
                Phần 2 · Cửa 2 (Nâng cao)
              </div>
              <h2 className="display-font" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                IELTS Speaking, WSDC & Phỏng vấn Du học
              </h2>
              <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                Tranh biện chuyên sâu Band 7.5+ cùng Giám khảo AI.
              </p>
            </div>
            <button
              className="duo-btn-3d dark"
              style={{ padding: '8px 14px', fontSize: 12.5, flexShrink: 0 }}
              onClick={onOpenStore}
            >
              <Crown size={14} color="#f5bd33" /> {isPro ? 'Đã mở Pro' : 'Mở khóa Pro'}
            </button>
          </div>
        </Reveal>

        <div className="path-nodes-col">
          {unit2Topics.map((t, i) => renderNode(t, i + 1, i + 3))}
        </div>
      </div>

      {/* RIGHT RAIL: DUOLINGO-STYLE STATS, DAILY QUESTS & PRO WIDGET */}
      <aside className="learn-right-rail">
        {/* Top Stats Row */}
        <div className="rail-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
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

        {/* Daily Quests Widget */}
        <div className="rail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 className="display-font" style={{ fontSize: 15.5, fontWeight: 800 }}>
              Nhiệm vụ hằng ngày
            </h3>
            <Target size={17} color="#b45309" />
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <span>Kiếm 50 XP hôm nay</span>
                <span className="tabular" style={{ color: '#b45309' }}>{dailyXpProgress}/50</span>
              </div>
              <div className="duo-progress-track" style={{ height: 11 }}>
                <div className="duo-progress-fill" style={{ width: `${Math.max(8, (dailyXpProgress / 50) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <span>Hoàn thành 1 bài luyện</span>
                <span className="tabular" style={{ color: '#b45309' }}>{Math.min(1, dailyLessonsDone)}/1</span>
              </div>
              <div className="duo-progress-track" style={{ height: 11 }}>
                <div className="duo-progress-fill" style={{ width: `${Math.min(1, dailyLessonsDone) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pro Upgrade Card */}
        {!isPro && (
          <div
            className="rail-card"
            style={{ background: '#141517', color: 'white', borderColor: '#f5bd33' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f5bd33', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
              <Crown size={16} /> SPEAKSHARP PRO
            </div>
            <p style={{ fontSize: 13, color: '#d1d5db', marginBottom: 14 }}>
              Không giới hạn thời lượng luyện nói 24/7 và mở khóa toàn bộ Phần 2 (IELTS, WSDC, Du học).
            </p>
            <button className="duo-btn-3d gold" style={{ width: '100%' }} onClick={onOpenStore}>
              Dùng thử Pro ngay
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
