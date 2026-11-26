import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Gavel,
  GraduationCap,
  Globe,
  HeartHandshake,
  Mic,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { DebateTopic, Persona, TopicCategory } from '../types';
import { Reveal } from './Reveal';

interface LandingPageProps {
  topics: DebateTopic[];
  onStartPractice: (persona?: Persona) => void;
  onSelectCategory: (cat: TopicCategory) => void;
  onOpenPricing: () => void;
  onOpenDashboard: () => void;
  onOpenWorld3D?: () => void;
}

const PHONE_SAMPLES = [
  {
    en: 'Do you think AI tutors make learning more personalized?',
    highlight: 'personalized',
    ipa: '/ˈpɜːrsənəlaɪzd/',
    vi: 'Bạn có nghĩ gia sư AI giúp việc học được cá nhân hóa hơn không?',
  },
  {
    en: 'From my perspective, speaking daily builds real confidence.',
    highlight: 'confidence',
    ipa: '/ˈkɒnfɪdəns/',
    vi: 'Theo quan điểm của tôi, luyện nói mỗi ngày tạo nên sự tự tin thật sự.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPractice,
  onSelectCategory,
  onOpenPricing,
  onOpenDashboard,
  onOpenWorld3D,
}) => {
  const [sampleIdx, setSampleIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const current = PHONE_SAMPLES[sampleIdx];

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const speakSample = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.93;
    window.speechSynthesis.speak(u);
  };

  // Subtle GPU parallax for Hero phone mockup
  const phoneParallaxY = Math.min(48, scrollY * 0.11);

  return (
    <div>
      {/* 1. MANGO-STYLE DARK HERO + TILTED INTERACTIVE PHONE MOCKUP */}
      <section className="mango-hero">
        <div className="mango-hero-grid">
          <div>
            <div
              className="hero-enter"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 13px',
                borderRadius: 999,
                background: 'rgba(245, 189, 51, 0.14)',
                border: '1px solid rgba(245, 189, 51, 0.35)',
                color: '#fde68a',
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <Sparkles size={13} />
              <span>Cố Đô Cyber 75 · Thế giới 3D Anime & AI Luyện Nói Tiếng Anh</span>
            </div>

            <h1 className="mango-hero-title hero-enter">
              Hãy nói <span className="gold">tiếng Anh</span> một cách tự nhiên.
            </h1>

            <p className="mango-hero-sub hero-enter hero-enter-d1">
              Luyện nói & phản biện 1-1 cùng AI 24/7 kết hợp Thế giới 3D Anime Online 2 hành tinh. Giải quyết nỗi sợ nói tiếng Anh cho học sinh THCS & THPT qua nhập vai giao thư, chấm phát âm IPA và đấu trường phản biện trực tiếp.
            </p>

            <div className="mango-hero-cta hero-enter hero-enter-d2" style={{ flexWrap: 'wrap' }}>
              {onOpenWorld3D && (
                <button
                  className="btn-gold"
                  style={{
                    padding: '13px 24px',
                    fontSize: 15,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onClick={onOpenWorld3D}
                >
                  <Globe size={17} />
                  Vào Thế giới 3D Online
                </button>
              )}

              <button
                className={onOpenWorld3D ? undefined : 'btn-gold'}
                style={
                  onOpenWorld3D
                    ? {
                        padding: '12px 22px',
                        fontSize: 14.5,
                        fontWeight: 700,
                        borderRadius: 12,
                        border: '1.5px solid rgba(255,255,255,0.28)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }
                    : { padding: '13px 26px', fontSize: 15 }
                }
                onClick={() => onStartPractice('buddy')}
              >
                Luyện nói AI 1-1
              </button>

              <button
                onClick={() => onStartPractice('judge')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={13} fill="white" color="white" />
                </span>
                Phản biện Giám khảo AI
              </button>
            </div>
          </div>

          {/* Right: Tilted Phone Mockup with real lifestyle photo in circle */}
          <div
            className="phone-stage hero-enter hero-enter-d3"
            style={{ transform: `translateY(${phoneParallaxY}px)`, transition: 'transform 0.1s ease-out' }}
          >
            <div className="phone-circle-bg">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                alt="Học sinh luyện nói tiếng Anh tự tin"
              />
            </div>
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#6b7280', marginBottom: 6 }}>
                  <span>SpeakSharp · B2</span>
                  <span>IPA 92%</span>
                </div>
                <div className="phone-progress">
                  <div className="phone-progress-fill" />
                </div>

                <div className="phone-sentence">
                  {current.en.split(current.highlight)[0]}
                  <span style={{ background: '#fce7f3', color: '#be185d', padding: '1px 5px', borderRadius: 5 }}>
                    {current.highlight}
                  </span>
                  {current.en.split(current.highlight)[1]}
                </div>

                <div className="ipa-pill-pink mono">{current.ipa}</div>

                <div style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.5 }}>
                  {current.vi}
                </div>

                <div className="phone-actions">
                  <button
                    className="phone-circle-btn"
                    style={{ background: '#16a34a' }}
                    onClick={() => speakSample(current.en)}
                    title="Nghe phát âm mẫu"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    className="phone-circle-btn"
                    style={{ background: '#f97316' }}
                    onClick={() => onStartPractice('buddy')}
                    title="Vào phòng luyện nói ngay"
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    className="phone-circle-btn"
                    style={{ background: '#2563eb' }}
                    onClick={() => setSampleIdx((i) => (i + 1) % PHONE_SAMPLES.length)}
                    title="Xem câu mẫu khác"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                <div className="phone-footer">
                  <button
                    className="btn-secondary"
                    style={{ flex: 0.45, padding: '7px 0', fontSize: 11.5 }}
                    onClick={() => setSampleIdx((i) => (i + 1) % PHONE_SAMPLES.length)}
                  >
                    Đổi câu
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '7px 0', fontSize: 11.5 }}
                    onClick={() => onStartPractice('buddy')}
                  >
                    Luyện ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DẢI GIÁ TRỊ NỔI BẬT */}
      <section
        id="speaksharp-highlights"
        style={{ background: 'var(--bg-warm)', borderBottom: '1px solid var(--border)', padding: '30px 36px' }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 20,
            textAlign: 'center',
          }}
        >
          {[
            { num: '24/7', label: 'Luyện phản xạ nói mọi lúc, không áp lực' },
            { num: 'Chuẩn IPA', label: 'Chấm phát âm & sửa lỗi ngữ pháp tức thì' },
            { num: 'A2 → C1', label: 'Tự động điều chỉnh tốc độ & độ khó từ vựng' },
            { num: 'Tiết kiệm 90%', label: 'So với thuê gia sư bản xứ 300k–600k/giờ' },
          ].map((stat, idx) => (
            <Reveal key={stat.num} variant="fade-up" delay={idx * 90}>
              <div className="display-font" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {stat.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. VẤN ĐỀ THỰC TRẠNG & GIẢI PHÁP ĐỘT PHÁ */}
      <section className="landing-section">
        <div className="landing-inner">
          <Reveal variant="fade-up">
            <div className="section-heading">
              <h2>Vì sao học sinh cần SpeakSharp?</h2>
              <p>
                SpeakSharp được xây dựng để giải quyết trực diện 3 rào cản lớn nhất khiến người học tiếng Anh ngại giao tiếp.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22 }}>
            <Reveal variant="fade-left" delay={80}>
              <div className="clean-card" style={{ background: '#fffaf9', borderColor: '#fecaca', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--rose)', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
                  <AlertCircle size={17} /> VẤN ĐỀ THỰC TRẠNG
                </div>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 13, fontSize: 14.5, color: 'var(--text-secondary)' }}>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>Nỗi sợ sai & thiếu tự tin:</strong> Ngại mở lời nói tiếng Anh vì sợ sai ngữ pháp, sợ bị bạn bè đánh giá hoặc phát âm chưa chuẩn.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>Thiếu môi trường tương tác:</strong> Ở trường chỉ có 45 phút/tiết với 30–40 học sinh, giáo viên không thể sửa phản xạ cho từng bạn.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>Chi phí luyện 1-1 đắt đỏ:</strong> Thuê gia sư bản xứ tốn từ 300.000 – 600.000đ/giờ, khó duy trì hằng ngày.
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal variant="fade-right" delay={160}>
              <div className="clean-card" style={{ background: '#f8fffc', borderColor: '#a7f3d0', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--teal)', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
                  <Sparkles size={17} /> GIẢI PHÁP TỪ SPEAKSHARP
                </div>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 13, fontSize: 14.5, color: 'var(--text-secondary)' }}>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>Đa vai trò Dual-Persona AI:</strong> Chuyển đổi linh hoạt giữa Giám khảo tranh biện sắc bén và Bạn đồng hành thân thiện.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>Tự động điều chỉnh độ khó:</strong> Nhận diện năng lực qua từng câu nói để tăng/giảm tốc độ nói và từ vựng phù hợp.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text)' }}>Phản hồi thời gian thực:</strong> Chấm điểm IPA, sửa ngữ pháp tức thì và gợi ý <em>Better Expressions</em> ngay sau mỗi lượt nói.
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. CÁCH THỨC HOẠT ĐỘNG — 3 TRỤ CỘT */}
      <section className="landing-section warm">
        <div className="landing-inner">
          <Reveal variant="fade-up">
            <div className="section-heading">
              <h2>Phương pháp luyện phản xạ của SpeakSharp</h2>
              <p>
                Trải nghiệm luyện nói trực quan, giúp bạn tiến bộ rõ rệt sau mỗi phiên 15 phút.
              </p>
            </div>
          </Reveal>

          <div className="feature-grid-3">
            {[
              {
                icon: <Gavel size={22} style={{ marginBottom: 14, color: '#141517' }} />,
                title: '1. Chọn vai trò AI phù hợp',
                desc: 'Luyện cùng Bạn đồng hành để khởi động tự tin hoặc đối đầu Giám khảo tranh biện để rèn lập luận chặt chẽ.',
              },
              {
                icon: <Sliders size={22} style={{ marginBottom: 14, color: '#141517' }} />,
                title: '2. AI thích ứng theo trình độ',
                desc: 'Hệ thống tự nhận diện năng lực (A2–C1) để điều chỉnh tốc độ nói (0.82x – 1.14x) và độ sâu câu hỏi phản biện.',
              },
              {
                icon: <CheckCircle2 size={22} style={{ marginBottom: 14, color: '#141517' }} />,
                title: '3. Sửa lỗi & nâng cấp tức thì',
                desc: 'Xem ngay điểm phát âm từng từ IPA, sửa lỗi ngữ pháp bằng tiếng Việt và lưu các mẫu câu Better Expressions vào sổ tay.',
              },
            ].map((item, idx) => (
              <Reveal key={item.title} variant="fade-up" delay={idx * 110}>
                <div className="clean-card" style={{ height: '100%' }}>
                  {item.icon}
                  <h3 className="display-font" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. KHÁM PHÁ KHO CHỦ ĐỀ THỰC CHIẾN */}
      <section className="landing-section">
        <div className="landing-inner">
          <Reveal variant="fade-up">
            <div className="section-heading">
              <h2>Kho chủ đề đa dạng theo mục tiêu</h2>
              <p>Từ giao tiếp hằng ngày đến luyện thi IELTS, hùng biện WSDC và phỏng vấn học bổng.</p>
            </div>
          </Reveal>

          <div className="category-grid-4">
            {(
              [
                {
                  cat: 'IELTS Speaking' as TopicCategory,
                  sub: 'Part 2 & 3 chuẩn tiêu chí Band 7.5+',
                  level: 'B1 – C1',
                  img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
                },
                {
                  cat: 'Hùng biện WSDC' as TopicCategory,
                  sub: 'Tư duy phản biện & Point of Information',
                  level: 'B2 – C1',
                  img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
                },
                {
                  cat: 'Phỏng vấn Du học' as TopicCategory,
                  sub: 'Học bổng, lãnh đạo & câu chuyện cá nhân',
                  level: 'B2 – C1',
                  img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
                },
                {
                  cat: 'Giao tiếp hằng ngày' as TopicCategory,
                  sub: 'Xây phản xạ & xóa nỗi sợ nói tiếng Anh',
                  level: 'A2 – B1',
                  img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
                },
              ]
            ).map((item, idx) => (
              <Reveal key={item.cat} variant="zoom-in" delay={idx * 90}>
                <button
                  className="cat-tile"
                  style={{ width: '100%', height: '100%', padding: 14 }}
                  onClick={() => onSelectCategory(item.cat)}
                >
                  <div className="img-cover-wrap">
                    <img src={item.img} alt={item.cat} loading="lazy" />
                  </div>
                  <span className="badge badge-slate" style={{ alignSelf: 'flex-start' }}>
                    {item.level}
                  </span>
                  <div className="display-font" style={{ fontSize: 16.5, fontWeight: 700, marginTop: 2 }}>
                    {item.cat}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{item.sub}</div>
                  <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Khám phá chủ đề <ArrowRight size={13} />
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. DÀNH CHO HỌC SINH & NHÀ TRƯỜNG */}
      <section className="landing-section warm">
        <div className="landing-inner">
          <Reveal variant="fade-up">
            <div className="section-heading">
              <h2>Giải pháp cho cả Học sinh & Trường học</h2>
              <p>Linh hoạt từ gói miễn phí hằng ngày đến hệ thống quản lý bài tập nói cho cả trường.</p>
            </div>
          </Reveal>

          <div className="feature-grid-3">
            <Reveal variant="fade-up" delay={0}>
              <div className="clean-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', padding: 18 }}>
                <div className="img-cover-wrap" style={{ height: 155 }}>
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
                    alt="Học sinh tự luyện nói trực tuyến"
                    loading="lazy"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HeartHandshake size={19} color="#141517" />
                  <h3 className="display-font" style={{ fontSize: 18, fontWeight: 800 }}>Freemium (B2C)</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Miễn phí <strong>15 phút mỗi ngày</strong> giúp học sinh làm quen, vượt qua rào cản tâm lý và xây dựng thói quen nói tiếng Anh.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <button className="btn-secondary" onClick={() => onStartPractice('buddy')}>
                    Dùng thử miễn phí
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal variant="fade-up" delay={110}>
              <div className="clean-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderColor: 'var(--gold)', borderWidth: 2, height: '100%', padding: 18 }}>
                <div className="img-cover-wrap" style={{ height: 155 }}>
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                    alt="Luyện thi IELTS và Hùng biện chuyên sâu"
                    loading="lazy"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={19} color="#b45309" />
                  <h3 className="display-font" style={{ fontSize: 18, fontWeight: 800 }}>Pro Học sinh</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Chỉ <strong>99.000đ – 149.000đ/tháng</strong>: không giới hạn thời lượng tranh biện, mở toàn bộ kho IELTS, TOEFL, WSDC & báo cáo lỗi sai chi tiết.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <button className="btn-gold" onClick={onOpenPricing}>
                    Xem chi tiết gói Pro
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal variant="fade-up" delay={220}>
              <div className="clean-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', padding: 18 }}>
                <div className="img-cover-wrap" style={{ height: 155 }}>
                  <img
                    src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80"
                    alt="Lớp học Trường THPT và Trung tâm Ngoại ngữ"
                    loading="lazy"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={19} color="var(--teal)" />
                  <h3 className="display-font" style={{ fontSize: 18, fontWeight: 800 }}>Trường THPT & Trung tâm</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Bản quyền theo lớp/trường: giao bài tập nói về nhà, Dashboard quản trị tiến độ và AI chấm điểm tự động cho lớp 30–40 học sinh.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <button className="btn-secondary" onClick={onOpenDashboard}>
                    Xem Dashboard B2B
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* 7. BANNER CTA CUỐI TRANG */}
          <Reveal variant="zoom-in" delay={100}>
            <div
              style={{
                marginTop: 48,
                background: 'var(--dark-bg)',
                color: 'white',
                borderRadius: 20,
                padding: '42px 40px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <div style={{ maxWidth: 600 }}>
                <h2 className="display-font" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25 }}>
                  Bắt đầu hành trình nói tiếng Anh tự tin cùng SpeakSharp
                </h2>
                <p style={{ fontSize: 15, color: '#a1a7b3', marginTop: 8 }}>
                  Trải nghiệm ngay 15 phút luyện nói & phản biện 1-1 miễn phí mỗi ngày ngay trên trình duyệt.
                </p>
              </div>
              <button
                className="btn-gold"
                style={{ padding: '14px 28px', fontSize: 15 }}
                onClick={() => onStartPractice('buddy')}
              >
                Bắt đầu miễn phí ngay <ArrowRight size={16} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
            <div className="brand-mark" style={{ width: 30, height: 30 }}>
              <Mic size={15} />
            </div>
            <strong style={{ fontSize: 15 }}>SpeakSharp</strong>
            <span style={{ color: '#9ca3af' }}>— Trợ lý Luyện nói & Phản biện Tiếng Anh AI 24/7</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span>Freemium · Pro B2C · Trường học B2B</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
