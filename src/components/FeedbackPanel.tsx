import React from 'react';
import { Bookmark, BookmarkCheck, Volume2, Check, Sparkles, BookOpen, Trophy } from 'lucide-react';
import { DebateTopic, SavedExpression, TurnAnalysis } from '../types';

interface FeedbackPanelProps {
  analysis: TurnAnalysis | null;
  topic: DebateTopic;
  savedExpressions: SavedExpression[];
  onSaveExpression: (phrase: string, level: string, contextVi: string) => void;
  onSpeakText: (text: string, rate?: number) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  analysis,
  topic,
  savedExpressions,
  onSaveExpression,
  onSpeakText,
}) => {
  const isSaved = (phrase: string) => savedExpressions.some((s) => s.phrase === phrase);

  if (!analysis) {
    return (
      <div className="duo-feedback-card">
        <div
          style={{
            background: '#fef9ec',
            border: '2px solid #f5bd33',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#141517' }}>
            <Sparkles size={17} color="#d97706" />
            <span className="display-font" style={{ fontSize: 15, fontWeight: 800 }}>
              Thử thách lượt nói đầu tiên!
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.55 }}>
            Nhấn nút <strong>Nói</strong> màu vàng (hoặc chọn 1 thẻ gợi ý) để nhận ngay <strong>+30 XP</strong> cùng bảng chấm IPA & Better Expressions.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BookOpen size={15} color="#b45309" />
            <span className="section-label" style={{ marginBottom: 0 }}>
              Từ vựng gợi ý (nhấn loa để nghe)
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topic.keyVocab.map((v) => (
              <div
                key={v.word}
                style={{
                  border: '2px solid #e7e2d9',
                  borderBottom: '4px solid #dad3c6',
                  borderRadius: 14,
                  padding: '11px 14px',
                  background: '#fcfbf8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 14.5 }}>{v.word}</strong>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11.5,
                        background: '#fce7f3',
                        color: '#be185d',
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontWeight: 700,
                      }}
                    >
                      {v.ipa}
                    </span>
                  </div>
                  <button
                    className="duo-btn-3d soft-gold"
                    style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                    onClick={() => onSpeakText(v.word, 0.85)}
                    title="Nghe phát âm chuẩn"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{v.meaningVi}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isGreat = analysis.overallScore >= 80;
  const metrics = [
    { label: 'Phát âm IPA', val: analysis.pronunciationScore, color: '#d92672' },
    { label: 'Ngữ pháp', val: analysis.grammarScore, color: '#16a34a' },
    { label: 'Trôi chảy', val: analysis.fluencyScore, color: '#f5bd33' },
    { label: 'Lập luận', val: analysis.argumentScore, color: '#141517' },
  ];

  return (
    <div className="duo-feedback-card">
      {/* SpeakSharp Dark + Gold Gamified Result Banner */}
      <div className={`duo-result-banner ${isGreat ? 'great' : 'good'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: isGreat ? '#f5bd33' : '#141517',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trophy size={20} color={isGreat ? '#141517' : '#f5bd33'} />
          </div>
          <div>
            <div className="display-font" style={{ fontSize: 16, fontWeight: 800, color: isGreat ? '#f5bd33' : '#141517' }}>
              {isGreat ? 'Xuất sắc! +30 XP' : 'Làm tốt lắm! +20 XP'}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>
              Trình độ ước tính: CEFR {analysis.detectedLevel}
            </div>
          </div>
        </div>
        <div className="display-font tabular" style={{ fontSize: 28, fontWeight: 800, color: isGreat ? '#f5bd33' : '#141517' }}>
          {analysis.overallScore}
          <span style={{ fontSize: 12.5, opacity: 0.7 }}>/100</span>
        </div>
      </div>

      {/* 4 Colorful Chunky Progress Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'grid', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
              <span className="tabular">{m.val}%</span>
            </div>
            <div className="metric-track" style={{ height: 8 }}>
              <div className="metric-fill" style={{ width: `${m.val}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
        💡 {analysis.encouragementVi}
      </p>

      {/* IPA */}
      <div>
        <div className="section-label">Phát âm IPA</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {analysis.pronunciationWords.map((w, idx) => (
            <div
              key={`${w.word}-${idx}`}
              style={{
                border: '2px solid #e5e5e5',
                borderRadius: 13,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{w.word}</strong>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      background: '#fce7f3',
                      color: '#be185d',
                      padding: '1px 7px',
                      borderRadius: 6,
                      fontWeight: 700,
                    }}
                  >
                    {w.ipa}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tabular" style={{ fontSize: 12.5, fontWeight: 800, color: w.score >= 85 ? '#58cc02' : '#ff9600' }}>
                    {w.score}%
                  </span>
                  <button
                    className="duo-btn-3d soft-gold"
                    style={{ width: 30, height: 30, padding: 0, borderRadius: 9 }}
                    onClick={() => onSpeakText(w.word, 0.8)}
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
              </div>
              {w.tip && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.tip}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Grammar */}
      <div>
        <div className="section-label">Ngữ pháp</div>
        {analysis.grammarIssues.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#46a302', fontWeight: 700 }}>
            <Check size={16} /> Chuẩn ngữ pháp! Không phát hiện lỗi nào.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.grammarIssues.map((g, i) => (
              <div
                key={i}
                style={{
                  border: '2px solid #fecaca',
                  background: '#fff5f5',
                  borderRadius: 13,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 13.5 }}>
                  <span style={{ textDecoration: 'line-through', color: '#ea2b2b', marginRight: 6 }}>
                    {g.original}
                  </span>
                  <span style={{ fontWeight: 800, color: '#46a302' }}>→ {g.corrected}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{g.explanationVi}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Better Expressions */}
      <div>
        <div className="section-label">Better Expressions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {analysis.betterExpressions.map((expr, i) => {
            const saved = isSaved(expr.phrase);
            return (
              <div
                key={i}
                style={{
                  border: '2px solid #bbf7d0',
                  background: '#f0fdf4',
                  borderRadius: 13,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-emerald">{expr.level}</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="ghost-link" onClick={() => onSpeakText(expr.phrase, 0.92)}>
                      <Volume2 size={12} /> Nghe
                    </button>
                    <button
                      className="ghost-link"
                      style={{ color: saved ? '#46a302' : undefined }}
                      onClick={() => onSaveExpression(expr.phrase, expr.level, expr.contextVi)}
                    >
                      {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                      {saved ? 'Đã lưu' : 'Lưu'}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>“{expr.phrase}”</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{expr.contextVi}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
