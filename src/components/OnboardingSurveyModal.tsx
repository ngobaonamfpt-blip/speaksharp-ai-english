import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gavel,
  GraduationCap,
  HeartHandshake,
  MessageCircle,
  Mic,
  MicOff,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { CEFRLevel, Persona, TopicCategory } from '../types';

export interface SurveyResult {
  goal: TopicCategory;
  painPoints: string[];
  level: CEFRLevel;
  preferredPersona: Persona;
  dailyMinutes: number;
}

interface OnboardingSurveyModalProps {
  userName: string;
  initialData?: SurveyResult | null;
  onComplete: (result: SurveyResult) => void;
  onSkip: () => void;
}

const GOALS: Array<{ id: TopicCategory; title: string; desc: string; icon: React.ReactNode }> = [
  {
    id: 'IELTS Speaking',
    title: 'Luyện thi IELTS Speaking',
    desc: 'Chinh phục Part 2 & Part 3 chuẩn tiêu chí Band 7.0+',
    icon: <GraduationCap size={19} />,
  },
  {
    id: 'Hùng biện WSDC',
    title: 'Hùng biện & Phản biện WSDC',
    desc: 'Rèn tư duy phản biện, lập luận sắc bén & rebuttal',
    icon: <Gavel size={19} />,
  },
  {
    id: 'Phỏng vấn Du học',
    title: 'Phỏng vấn Học bổng & Du học',
    desc: 'Trả lời câu hỏi lãnh đạo, định hướng & câu chuyện cá nhân',
    icon: <Trophy size={19} />,
  },
  {
    id: 'Giao tiếp hằng ngày',
    title: 'Giao tiếp tự tin mỗi ngày',
    desc: 'Vượt qua nỗi sợ sai ngữ pháp và phản xạ tự nhiên hơn',
    icon: <MessageCircle size={19} />,
  },
];

const PAIN_POINTS = [
  'Sợ sai ngữ pháp khi mở lời',
  'Phát âm chưa chuẩn IPA / thiếu âm cuối',
  'Bí từ vựng & hay lặp lại cấu trúc cũ',
  'Ngập ngừng, phản xạ chậm khi bị hỏi bất ngờ',
  'Không có môi trường luyện nói 1-1 mỗi ngày',
];

const LEVELS: Array<{ id: CEFRLevel; next: CEFRLevel; title: string; desc: string }> = [
  { id: 'A2', next: 'B1', title: 'A2 · Cơ bản', desc: 'Còn hay ngập ngừng, muốn bắt đầu chậm và dễ hiểu' },
  { id: 'B1', next: 'B2', title: 'B1 · Trung cấp', desc: 'Diễn đạt được ý chính, muốn nói mượt và ít lỗi hơn' },
  { id: 'B2', next: 'C1', title: 'B2 · Khá giỏi', desc: 'Giao tiếp tốt, muốn nâng cấp từ vựng & phản biện' },
  { id: 'C1', next: 'C1', title: 'C1 · Thành thạo', desc: 'Muốn tranh biện chuyên sâu như người bản xứ' },
];

export const OnboardingSurveyModal: React.FC<OnboardingSurveyModalProps> = ({
  userName,
  initialData,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<TopicCategory>(initialData?.goal ?? 'IELTS Speaking');
  const [painPoints, setPainPoints] = useState<string[]>(
    initialData?.painPoints ?? ['Sợ sai ngữ pháp khi mở lời', 'Phát âm chưa chuẩn IPA / thiếu âm cuối']
  );
  const [level, setLevel] = useState<CEFRLevel>(initialData?.level ?? 'B1');
  const [preferredPersona, setPreferredPersona] = useState<Persona>(
    initialData?.preferredPersona ?? 'buddy'
  );
  const [dailyMinutes, setDailyMinutes] = useState<number>(initialData?.dailyMinutes ?? 15);

  // Quick Mic Check in Step 3
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micSample, setMicSample] = useState('');
  const recRef = useRef<any>(null);

  const totalSteps = 4;
  const pct = Math.round((step / totalSteps) * 100);
  const levelInfo = LEVELS.find((l) => l.id === level) ?? LEVELS[1];

  const togglePainPoint = (p: string) => {
    setPainPoints((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const toggleMicTest = () => {
    if (isTestingMic) {
      recRef.current?.stop();
      setIsTestingMic(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setMicSample('Trình duyệt chưa hỗ trợ thu âm trực tiếp — bạn vẫn có thể luyện bằng văn bản!');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      setMicSample(txt);
    };
    rec.onerror = () => setIsTestingMic(false);
    rec.onend = () => setIsTestingMic(false);
    recRef.current = rec;
    rec.start();
    setIsTestingMic(true);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-box"
        style={{ maxWidth: 560, padding: 26, borderRadius: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {step > 1 ? (
            <button
              className="icon-btn"
              style={{ width: 34, padding: 0, justifyContent: 'center' }}
              onClick={() => setStep((s) => s - 1)}
              title="Quay lại"
            >
              <ArrowLeft size={15} />
            </button>
          ) : (
            <div style={{ width: 34 }} />
          )}

          <div className="duo-progress-track" style={{ height: 12 }}>
            <div className="duo-progress-fill" style={{ width: `${pct}%` }} />
          </div>

          <button
            className="icon-btn"
            style={{ width: 34, padding: 0, justifyContent: 'center' }}
            onClick={onSkip}
            title="Bỏ qua khảo sát"
          >
            <X size={15} />
          </button>
        </div>

        {/* STEP 1: Goal */}
        {step === 1 && (
          <div>
            <div className="badge badge-indigo" style={{ marginBottom: 8 }}>
              <Sparkles size={12} /> Bước 1/4 · Mục tiêu học tập
            </div>
            <h3 className="display-font" style={{ fontSize: 21, fontWeight: 800 }}>
              Chào {userName}! Mục tiêu lớn nhất của bạn là gì?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
              SpeakSharp sẽ ưu tiên kho chủ đề và tiêu chí chấm điểm sát với mục tiêu của bạn nhất.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              {GOALS.map((g) => {
                const active = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`duo-btn-3d ${active ? 'gold' : ''}`}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: '12px 15px',
                      gap: 12,
                    }}
                    onClick={() => setGoal(g.id)}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: active ? '#141517' : '#f4f2ee',
                        color: active ? '#f5bd33' : '#141517',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {g.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{g.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>{g.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Pain Points (Multi-select) */}
        {step === 2 && (
          <div>
            <div className="badge badge-indigo" style={{ marginBottom: 8 }}>
              <Target size={12} /> Bước 2/4 · Điểm cần khắc phục
            </div>
            <h3 className="display-font" style={{ fontSize: 21, fontWeight: 800 }}>
              Điều gì khiến bạn ngại nói tiếng Anh nhất?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
              Có thể chọn nhiều mục — AI sẽ tập trung sửa sâu những điểm này cho bạn.
            </p>

            <div style={{ display: 'grid', gap: 9 }}>
              {PAIN_POINTS.map((p) => {
                const active = painPoints.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`duo-btn-3d ${active ? 'dark' : ''}`}
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      padding: '11px 15px',
                    }}
                    onClick={() => togglePainPoint(p)}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? '#ffffff' : 'var(--text)' }}>
                      {p}
                    </span>
                    {active && <CheckCircle2 size={17} color="#f5bd33" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Current CEFR Level + Quick Voice Check */}
        {step === 3 && (
          <div>
            <div className="badge badge-indigo" style={{ marginBottom: 8 }}>
              Bước 3/4 · Trình độ & Kiểm tra Micro
            </div>
            <h3 className="display-font" style={{ fontSize: 21, fontWeight: 800 }}>
              Trình độ hiện tại của bạn đang ở mức nào?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 14 }}>
              AI sẽ tự điều chỉnh tốc độ nói và độ khó từ vựng ngay từ lượt đầu tiên.
            </p>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {LEVELS.map((l) => {
                const active = level === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    className={`duo-btn-3d ${active ? 'gold' : ''}`}
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      padding: '10px 14px',
                    }}
                    onClick={() => setLevel(l.id)}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800 }}>{l.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>{l.desc}</div>
                    </div>
                    {active && <CheckCircle2 size={17} color="#141517" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Voice Mic Test */}
            <div
              style={{
                background: '#fcfbf8',
                border: '1.5px dashed #d6cfc5',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 12.5 }}>
                <strong style={{ display: 'block', color: 'var(--text)' }}>
                  Thử Micro nhanh (tùy chọn)
                </strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  {micSample
                    ? `Đã nhận diện: “${micSample}”`
                    : 'Thử đọc: “Hello, I am ready to speak English!”'}
                </span>
              </div>
              <button
                type="button"
                className={`duo-btn-3d ${isTestingMic ? 'recording' : 'soft-gold'}`}
                style={{ padding: '7px 12px', fontSize: 12, flexShrink: 0 }}
                onClick={toggleMicTest}
              >
                {isTestingMic ? <MicOff size={14} /> : <Mic size={14} />}
                {isTestingMic ? 'Dừng' : 'Thử nói'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Persona, Daily Commitment & Personalized Roadmap Summary */}
        {step === 4 && (
          <div>
            <div className="badge badge-indigo" style={{ marginBottom: 8 }}>
              Bước 4/4 · Hoàn tất lộ trình cá nhân hóa
            </div>
            <h3 className="display-font" style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
              Chọn phong cách AI & xác nhận lộ trình
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                className={`duo-btn-3d ${preferredPersona === 'buddy' ? 'gold' : ''}`}
                style={{ padding: '11px 10px', gap: 7 }}
                onClick={() => setPreferredPersona('buddy')}
              >
                <HeartHandshake size={18} /> Bạn đồng hành
              </button>
              <button
                type="button"
                className={`duo-btn-3d ${preferredPersona === 'judge' ? 'dark' : ''}`}
                style={{ padding: '11px 10px', gap: 7 }}
                onClick={() => setPreferredPersona('judge')}
              >
                <Gavel size={18} color={preferredPersona === 'judge' ? '#f5bd33' : undefined} /> Giám khảo AI
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {[10, 15, 30].map((min) => (
                <button
                  key={min}
                  type="button"
                  className={`duo-btn-3d ${dailyMinutes === min ? 'gold' : ''}`}
                  style={{ padding: '8px', fontSize: 12.5 }}
                  onClick={() => setDailyMinutes(min)}
                >
                  <Clock size={13} /> {min} phút/ngày
                </button>
              ))}
            </div>

            {/* SpeakSharp Personalized Roadmap Card */}
            <div
              style={{
                background: '#141517',
                color: 'white',
                borderRadius: 16,
                padding: '16px 18px',
                border: '1.5px solid #f5bd33',
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f5bd33', fontWeight: 700, marginBottom: 6 }}>
                Lộ trình SpeakSharp đề xuất cho {userName}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: 11.5 }}>Mục tiêu chính</span>
                  <strong>{goal}</strong>
                </div>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: 11.5 }}>Tăng bậc dự kiến (30 ngày)</span>
                  <strong style={{ color: '#f5bd33' }}>CEFR {levelInfo.id} → {levelInfo.next}</strong>
                </div>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: 11.5 }}>Cam kết hằng ngày</span>
                  <strong>{dailyMinutes} phút · {dailyMinutes * 6} XP</strong>
                </div>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: 11.5 }}>Trọng tâm cải thiện</span>
                  <strong>{painPoints.length} kỹ năng ưu tiên</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            marginTop: 22,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button type="button" className="ghost-link" style={{ fontSize: 13 }} onClick={onSkip}>
            Bỏ qua
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              className="duo-btn-3d dark"
              style={{ padding: '10px 22px' }}
              onClick={() => setStep((s) => s + 1)}
            >
              Tiếp tục <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="duo-btn-3d gold"
              style={{ padding: '10px 22px' }}
              onClick={() =>
                onComplete({
                  goal,
                  painPoints,
                  level,
                  preferredPersona,
                  dailyMinutes,
                })
              }
            >
              Bắt đầu lộ trình ngay <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
