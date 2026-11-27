import React from 'react';
import {
  Award,
  Bookmark,
  Flame,
  GraduationCap,
  History,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CEFRLevel, SavedExpression } from '../types';
import { SurveyResult } from './OnboardingSurveyModal';
import { Reveal } from './Reveal';

export interface SessionHistoryItem {
  id: string;
  topicTitle: string;
  topicTitleVi: string;
  date: string;
  overallScore: number;
  pronunciationScore: number;
  grammarScore: number;
  fluencyScore: number;
  argumentScore: number;
  cefr: CEFRLevel;
  xp: number;
}

interface StudentProfileProps {
  userName: string;
  userEmail: string;
  totalXp: number;
  streakDays: number;
  surveyData: SurveyResult | null;
  history: SessionHistoryItem[];
  savedExpressions: SavedExpression[];
  onStartPractice: () => void;
  onRetakeSurvey: () => void;
  onOpenSaved: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  userName,
  userEmail,
  totalXp,
  streakDays,
  surveyData,
  history,
  savedExpressions,
  onStartPractice,
  onRetakeSurvey,
  onOpenSaved,
}) => {
  const avg = (key: 'pronunciationScore' | 'grammarScore' | 'fluencyScore' | 'argumentScore') => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((s, h) => s + h[key], 0) / history.length);
  };

  const ipaAvg = avg('pronunciationScore') || 82;
  const grammarAvg = avg('grammarScore') || 79;
  const fluencyAvg = avg('fluencyScore') || 76;
  const argAvg = avg('argumentScore') || 80;
  const overallAvg = Math.round((ipaAvg + grammarAvg + fluencyAvg + argAvg) / 4);

  const readCount = (key: string): number => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };
  const world3DStats = [
    { icon: '🏝️', name: 'Thị trấn Anime 3D', done: readCount('speaksharp_courier_quests_v1'), total: 5, color: '#0ea5e9' },
    { icon: '✈️', name: 'Sân bay Quốc tế', done: readCount('speaksharp_roleplay_airport_v1'), total: 4, color: '#2563eb' },
    { icon: '🛒', name: 'Siêu thị Fresh Mart', done: readCount('speaksharp_roleplay_supermarket_v1'), total: 4, color: '#16a34a' },
  ];
  const total3DDone = world3DStats.reduce((s, w) => s + w.done, 0);

  const achievements = [
    {
      title: 'Khởi đầu tự tin',
      desc: 'Hoàn thành lượt nói tiếng Anh đầu tiên',
      unlocked: history.length >= 1,
    },
    {
      title: 'Nhà thám hiểm 3D',
      desc: 'Hoàn thành ít nhất 1 nhiệm vụ giao tiếp trong Thế giới 3D',
      unlocked: total3DDone >= 1,
    },
    {
      title: 'Chuỗi 7 ngày lửa',
      desc: 'Duy trì thói quen luyện nói liên tiếp',
      unlocked: streakDays >= 7,
    },
    {
      title: 'Chuẩn phát âm IPA',
      desc: 'Đạt điểm phát âm từ 85/100 trở lên',
      unlocked: history.some((h) => h.pronunciationScore >= 85),
    },
    {
      title: 'Sưu tầm diễn đạt hay',
      desc: 'Lưu ít nhất 1 mẫu Better Expressions',
      unlocked: savedExpressions.length >= 1,
    },
  ];

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'HV';

  return (
    <div>
      {/* Dark & Gold Profile Header Card */}
      <div
        style={{
          background: '#141517',
          color: 'white',
          borderRadius: 20,
          padding: '26px 28px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          border: '1.5px solid #2b2e33',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              background: '#f5bd33',
              color: '#141517',
              fontWeight: 800,
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="display-font"
          >
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 className="display-font" style={{ fontSize: 23, fontWeight: 800 }}>
                {userName}
              </h1>
              <span
                style={{
                  background: 'rgba(245, 189, 51, 0.18)',
                  color: '#f5bd33',
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 99,
                }}
              >
                CEFR {surveyData?.level ?? 'B1'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
              {userEmail} · Mục tiêu: <strong style={{ color: 'white' }}>{surveyData?.goal ?? 'IELTS Speaking'}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="duo-btn-3d" onClick={onRetakeSurvey}>
            <Target size={14} /> Cập nhật lộ trình
          </button>
          <button className="duo-btn-3d gold" onClick={onStartPractice}>
            <Play size={14} /> Tiếp tục luyện nói
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="section-label">Tổng XP tích lũy</div>
          <div className="display-font tabular" style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Zap size={22} color="#f5bd33" fill="#f5bd33" /> {totalXp}
          </div>
        </div>

        <div className="card kpi-card">
          <div className="section-label">Chuỗi Streak</div>
          <div className="display-font tabular" style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Flame size={22} color="#f97316" fill="#f97316" /> {streakDays} ngày
          </div>
        </div>

        <div className="card kpi-card">
          <div className="section-label">Điểm nói trung bình</div>
          <div className="display-font tabular" style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
            <TrendingUp size={22} color="#16a34a" /> {overallAvg}/100
          </div>
        </div>

        <div className="card kpi-card" style={{ cursor: 'pointer' }} onClick={onOpenSaved}>
          <div className="section-label">Better Expressions</div>
          <div className="display-font tabular" style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Bookmark size={21} color="#141517" /> {savedExpressions.length} mẫu
          </div>
        </div>
      </div>

      {/* 3D World Roleplay Progress Strip */}
      <Reveal variant="fade-up" delay={40}>
        <div className="card" style={{ padding: '18px 22px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 className="display-font" style={{ fontSize: 15.5, fontWeight: 800 }}>
                🌍 Tiến độ Nhập vai Thế giới 3D Online
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Hoàn thành nhiệm vụ giao tiếp tiếng Anh thực tế tại các bản đồ 3D để nhận thêm XP
              </p>
            </div>
            <span className="badge badge-indigo tabular">{total3DDone}/13 nhiệm vụ 3D</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            {world3DStats.map((w) => {
              const pct = Math.min(100, Math.round((w.done / w.total) * 100));
              return (
                <div
                  key={w.name}
                  style={{
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1.5px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: 12,
                    padding: '11px 13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
                    <span>{w.icon} {w.name}</span>
                    <span className="tabular" style={{ color: w.color }}>{w.done}/{w.total}</span>
                  </div>
                  <div className="metric-track" style={{ height: 7 }}>
                    <div className="metric-fill" style={{ width: `${pct}%`, background: w.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Skill Breakdown + Personalized Roadmap + Achievements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, marginBottom: 18 }}>
        {/* 4-Skill Breakdown */}
        <Reveal variant="fade-left" delay={60}>
        <div className="card" style={{ padding: 22, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 className="display-font" style={{ fontSize: 16, fontWeight: 800 }}>Hồ sơ năng lực 4 kỹ năng</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {history.length > 0 ? `Tổng hợp từ ${history.length} lượt nói thực tế của bạn` : 'Điểm ước tính ban đầu — hãy luyện thêm để cập nhật'}
              </p>
            </div>
            <GraduationCap size={20} color="#b45309" />
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {[
              { label: 'Phát âm chuẩn IPA', val: ipaAvg, color: '#d92672' },
              { label: 'Độ chính xác Ngữ pháp', val: grammarAvg, color: '#16a34a' },
              { label: 'Độ trôi chảy & Phản xạ', val: fluencyAvg, color: '#f5bd33' },
              { label: 'Tư duy Phản biện & Lập luận', val: argAvg, color: '#141517' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span>{s.label}</span>
                  <span className="tabular">{s.val}/100</span>
                </div>
                <div className="metric-track" style={{ height: 8 }}>
                  <div className="metric-fill" style={{ width: `${s.val}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {surveyData?.painPoints && surveyData.painPoints.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="section-label">Trọng tâm AI đang kèm riêng cho bạn</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {surveyData.painPoints.map((p) => (
                  <span key={p} className="badge badge-indigo">
                    <Sparkles size={11} /> {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        </Reveal>

        {/* Achievements */}
        <Reveal variant="fade-right" delay={140}>
        <div className="card" style={{ padding: 22, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 className="display-font" style={{ fontSize: 16, fontWeight: 800 }}>Huy hiệu Thành tích</h3>
            <span className="badge badge-amber">
              {achievements.filter((a) => a.unlocked).length}/{achievements.length} đã mở
            </span>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {achievements.map((a) => (
              <div
                key={a.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 13,
                  border: a.unlocked ? '2px solid #f5bd33' : '1px solid var(--border)',
                  background: a.unlocked ? '#fef9ec' : '#fafafa',
                  opacity: a.unlocked ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: a.unlocked ? '#141517' : '#e5e7eb',
                    color: a.unlocked ? '#f5bd33' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Award size={19} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <span className={`badge ${a.unlocked ? 'badge-emerald' : 'badge-slate'}`}>
                  {a.unlocked ? 'Đã đạt' : 'Chưa mở'}
                </span>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </div>

      {/* Recent Speaking History */}
      <Reveal variant="fade-up" delay={100}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <History size={17} color="#141517" />
          <h3 className="display-font" style={{ fontSize: 16, fontWeight: 800 }}>
            Lịch sử lượt nói gần đây ({history.length})
          </h3>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Bạn chưa có lượt nói nào được lưu. Vào <strong>Phòng Luyện Nói</strong> để ghi nhận kết quả đầu tiên!
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chủ đề</th>
                  <th>Thời gian</th>
                  <th>CEFR</th>
                  <th>Điểm tổng</th>
                  <th>IPA / Ngữ pháp</th>
                  <th>XP</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.topicTitle}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.topicTitleVi}</div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.date}</td>
                    <td><span className="badge badge-slate">{item.cefr}</span></td>
                    <td className="tabular" style={{ fontWeight: 800 }}>{item.overallScore}/100</td>
                    <td className="tabular" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {item.pronunciationScore} / {item.grammarScore}
                    </td>
                    <td><span className="badge badge-indigo">+{item.xp} XP</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </Reveal>
    </div>
  );
};
