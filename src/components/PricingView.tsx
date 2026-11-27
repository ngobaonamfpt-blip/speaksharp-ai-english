import React, { useState } from 'react';
import { Check, ArrowRight, Zap, Shield, Sparkles, Gift } from 'lucide-react';
import { Reveal } from './Reveal';

interface PricingViewProps {
  isPro: boolean;
  totalXp?: number;
  onSpendXp?: (cost: number) => void;
  onTogglePro: (next: boolean) => void;
  onOpenDashboard: () => void;
}

const XP_SHOP_ITEMS = [
  {
    id: 'streak-freeze',
    title: 'Đóng băng Streak (1 ngày)',
    desc: 'Bảo vệ chuỗi ngày luyện tập của bạn nếu lỡ bận không kịp nói hôm nay.',
    cost: 100,
    icon: <Shield size={20} color="#b45309" />,
  },
  {
    id: 'double-xp',
    title: 'Nhân đôi XP (30 phút)',
    desc: 'Nhận x2 điểm XP sau mỗi lượt phản biện tiếng Anh trong 30 phút tới.',
    cost: 80,
    icon: <Zap size={20} color="#f5bd33" fill="#f5bd33" />,
  },
  {
    id: 'vip-phrases',
    title: 'Bộ 50 câu Band 8.0 IELTS',
    desc: 'Mở khóa bộ Better Expressions chọn lọc cho chủ đề Giáo dục & Công nghệ.',
    cost: 120,
    icon: <Sparkles size={20} color="#141517" />,
  },
];

export const PricingView: React.FC<PricingViewProps> = ({
  isPro,
  totalXp = 120,
  onSpendXp,
  onTogglePro,
  onOpenDashboard,
}) => {
  const [billing, setBilling] = useState<'monthly' | 'quarterly'>('quarterly');
  const [ownedItems, setOwnedItems] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('speaksharp_shop_owned_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleRedeem = (id: string, cost: number) => {
    if (ownedItems.includes(id) || totalXp < cost) return;
    onSpendXp?.(cost);
    setOwnedItems((prev) => {
      const next = [...prev, id];
      try {
        localStorage.setItem('speaksharp_shop_owned_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cửa hàng SpeakSharp</h1>
          <p className="page-sub">
            Nâng cấp gói Pro, bản quyền Trường học B2B hoặc dùng điểm XP tích lũy để đổi vật phẩm học tập.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="duo-stat-pill tabular" style={{ background: '#141517', color: '#f5bd33' }}>
            <Zap size={15} fill="#f5bd33" /> {totalXp} XP hiện có
          </span>
          <div className="segmented">
            <button
              className={`seg-btn ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Theo Tháng
            </button>
            <button
              className={`seg-btn ${billing === 'quarterly' ? 'active' : ''}`}
              onClick={() => setBilling('quarterly')}
            >
              Theo Quý (-33%)
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="pricing-grid">
        {/* Freemium */}
        <Reveal variant="fade-up" delay={0}>
        <div className="card pricing-card" style={{ height: '100%' }}>
          <div>
            <div className="section-label">B2C · Cơ bản</div>
            <h2 style={{ fontSize: 19, fontWeight: 700 }}>Freemium</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              Trải nghiệm hằng ngày hoàn toàn miễn phí.
            </p>
          </div>

          <div className="tabular">
            <span style={{ fontSize: 32, fontWeight: 700 }}>0đ</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> / mãi mãi</span>
          </div>

          <ul style={{ listStyle: 'none', display: 'grid', gap: 9, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            {[
              'Miễn phí 15 phút luyện nói mỗi ngày',
              'Đủ 2 vai trò: Giám khảo & Bạn đồng hành',
              'Tự động điều chỉnh độ khó (A2–C1)',
              'Chấm điểm IPA & sửa lỗi ngữ pháp tức thì',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={15} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => onTogglePro(false)}>
              {!isPro ? 'Đang sử dụng' : 'Chuyển về Freemium'}
            </button>
          </div>
        </div>
        </Reveal>

        {/* Pro */}
        <Reveal variant="fade-up" delay={110}>
        <div className="card pricing-card featured" style={{ height: '100%' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-label" style={{ marginBottom: 0 }}>B2C · Học sinh</div>
              <span className="badge badge-indigo">Phổ biến</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 6 }}>Pro Subscription</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              Luyện thi IELTS, WSDC & phỏng vấn không giới hạn.
            </p>
          </div>

          <div className="tabular">
            <span style={{ fontSize: 32, fontWeight: 700 }}>
              {billing === 'quarterly' ? '69.000đ' : '99.000đ'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> / tháng</span>
          </div>

          <ul style={{ listStyle: 'none', display: 'grid', gap: 9, fontSize: 13.5 }}>
            {[
              'Không giới hạn thời lượng luyện nói & phản biện 24/7',
              'Mở khóa trọn bộ 4 bản đồ 3D Online (Thị trấn, Hành tinh, Sân bay, Siêu thị)',
              'Toàn bộ 12+ chủ đề THCS, IELTS, WSDC & Shark Tank',
              'Lưu không giới hạn Sổ tay Better Expressions & chấm phát âm IPA',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={15} style={{ flexShrink: 0, marginTop: 3, color: '#b45309' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <button className="duo-btn-3d gold" style={{ width: '100%', padding: '10px' }} onClick={() => onTogglePro(!isPro)}>
              {isPro ? '✓ Đã kích hoạt Demo Pro' : 'Mua / Dùng thử Pro ngay'}
            </button>
          </div>
        </div>
        </Reveal>

        {/* B2B */}
        <Reveal variant="fade-up" delay={220}>
        <div className="card pricing-card" style={{ height: '100%' }}>
          <div>
            <div className="section-label">B2B · Nhà trường</div>
            <h2 style={{ fontSize: 19, fontWeight: 700 }}>Trường học & Trung tâm</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              Bản quyền theo lớp/trường cho THPT & trung tâm.
            </p>
          </div>

          <div>
            <span style={{ fontSize: 26, fontWeight: 700 }}>Theo gói Lớp</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> / học kỳ</span>
          </div>

          <ul style={{ listStyle: 'none', display: 'grid', gap: 9, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            {[
              'Giao bài tập nói về nhà cho từng lớp',
              'Dashboard quản trị tiến độ học sinh',
              'AI tự động chấm điểm IPA & ngữ pháp',
              'Tùy chỉnh kho chủ đề theo giáo trình riêng',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={15} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={onOpenDashboard}>
              Mở Dashboard Giáo viên <ArrowRight size={14} />
            </button>
          </div>
        </div>
        </Reveal>
      </div>

      {/* XP Reward Store Section */}
      <div style={{ marginTop: 34 }}>
        <Reveal variant="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Gift size={19} color="#b45309" />
            <h2 className="display-font" style={{ fontSize: 20, fontWeight: 800 }}>
              Đổi Vật Phẩm bằng điểm XP
            </h2>
          </div>
        </Reveal>

        <div className="feature-grid-3">
          {XP_SHOP_ITEMS.map((item, idx) => {
            const owned = ownedItems.includes(item.id);
            const canAfford = totalXp >= item.cost;
            return (
              <Reveal key={item.id} variant="zoom-in" delay={idx * 100}>
                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: '#fef6df',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="badge badge-indigo tabular">{item.cost} XP</span>
                </div>
                <div className="display-font" style={{ fontSize: 16, fontWeight: 800 }}>
                  {item.title}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</p>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <button
                    className={`duo-btn-3d ${owned ? '' : canAfford ? 'dark' : ''}`}
                    style={{ width: '100%' }}
                    disabled={owned || !canAfford}
                    onClick={() => handleRedeem(item.id, item.cost)}
                  >
                    {owned ? '✓ Đã sở hữu' : canAfford ? `Đổi ngay (${item.cost} XP)` : `Cần thêm ${item.cost - totalXp} XP`}
                  </button>
                </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
};
