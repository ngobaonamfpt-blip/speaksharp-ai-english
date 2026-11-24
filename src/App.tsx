import React, { useCallback, useState } from 'react';
import {
  X,
  Volume2,
  Trash2,
  Mic,
  LogOut,
  Map,
  MessageSquareText,
  Library,
  ShoppingBag,
  User,
  Building2,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { DEBATE_TOPICS } from './data/topics';
import { DebateTopic, NavTab, Persona, SavedExpression, TopicCategory, TurnAnalysis } from './types';
import { LandingPage } from './components/LandingPage';
import { LearningPath } from './components/LearningPath';
import { PracticeArena } from './components/PracticeArena';
import { World3D } from './components/World3D';
import { TopicLibrary } from './components/TopicLibrary';
import { PricingView } from './components/PricingView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { OnboardingSurveyModal, SurveyResult } from './components/OnboardingSurveyModal';
import { SessionHistoryItem, StudentProfile } from './components/StudentProfile';

interface DemoUser {
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [topics, setTopics] = useState<DebateTopic[]>(DEBATE_TOPICS);
  const [activeTopic, setActiveTopic] = useState<DebateTopic>(DEBATE_TOPICS[0]);
  const [topicFilterInit, setTopicFilterInit] = useState<'Tất cả' | TopicCategory>('Tất cả');
  const [persona, setPersona] = useState<Persona>('buddy');
  const [isPro, setIsPro] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [savedExpressions, setSavedExpressions] = useState<SavedExpression[]>([]);

  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('speaksharp_completed');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [totalXp, setTotalXp] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('speaksharp_xp') || '120');
    } catch {
      return 120;
    }
  });

  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem('speaksharp_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [user, setUser] = useState<DemoUser | null>(() => {
    try {
      const raw = localStorage.getItem('speaksharp_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [surveyData, setSurveyData] = useState<SurveyResult | null>(() => {
    try {
      const raw = localStorage.getItem('speaksharp_survey');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('ai_debate_buddy_gemini_key') || '';
    } catch {
      return '';
    }
  });
  const [draftApiKey, setDraftApiKey] = useState(geminiApiKey);

  const handleConsumeSecond = useCallback(() => {
    setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const handleSaveExpression = (phrase: string, level: string, contextVi: string) => {
    setSavedExpressions((prev) => {
      if (prev.some((p) => p.phrase === phrase)) {
        return prev.filter((p) => p.phrase !== phrase);
      }
      return [
        {
          id: `expr-${Date.now()}`,
          phrase,
          level,
          contextVi,
          topicTitle: activeTopic.title,
        },
        ...prev,
      ];
    });
  };

  const handleSaveApiKey = () => {
    const trimmed = draftApiKey.trim();
    setGeminiApiKey(trimmed);
    try {
      if (trimmed) localStorage.setItem('ai_debate_buddy_gemini_key', trimmed);
      else localStorage.removeItem('ai_debate_buddy_gemini_key');
    } catch {
      // ignore
    }
    setShowSettingsModal(false);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = authName.trim() || (authEmail.split('@')[0] || 'Học viên');
    const nextUser: DemoUser = {
      name: displayName,
      email: authEmail.trim() || 'demo@speaksharp.vn',
      role: authRole,
    };
    setUser(nextUser);
    try {
      localStorage.setItem('speaksharp_user', JSON.stringify(nextUser));
    } catch {
      // ignore
    }
    setAuthModalMode(null);
    if (authRole === 'teacher') {
      setActiveTab('dashboard');
    } else {
      setShowSurveyModal(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('speaksharp_user');
    } catch {
      // ignore
    }
  };

  const handleSurveyComplete = (result: SurveyResult) => {
    setSurveyData(result);
    try {
      localStorage.setItem('speaksharp_survey', JSON.stringify(result));
    } catch {
      // ignore
    }
    setPersona(result.preferredPersona);
    const matchedTopic =
      topics.find((t) => t.category === result.goal && t.level === result.level) ||
      topics.find((t) => t.category === result.goal) ||
      topics[0];
    setActiveTopic(matchedTopic);
    setShowSurveyModal(false);
    setActiveTab('learn');
  };

  const handleTurnCompleted = (analysis: TurnAnalysis, xpGained: number) => {
    setTotalXp((prev) => {
      const next = prev + xpGained;
      try {
        localStorage.setItem('speaksharp_xp', String(next));
      } catch {
        // ignore
      }
      return next;
    });
    setCompletedTopicIds((prev) => {
      if (prev.includes(activeTopic.id)) return prev;
      const next = [...prev, activeTopic.id];
      try {
        localStorage.setItem('speaksharp_completed', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    const entry: SessionHistoryItem = {
      id: `hist-${Date.now()}`,
      topicTitle: activeTopic.title,
      topicTitleVi: activeTopic.titleVi,
      date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      overallScore: analysis.overallScore,
      pronunciationScore: analysis.pronunciationScore,
      grammarScore: analysis.grammarScore,
      fluencyScore: analysis.fluencyScore,
      argumentScore: analysis.argumentScore,
      cefr: analysis.detectedLevel,
      xp: xpGained,
    };
    setSessionHistory((prev) => {
      const next = [entry, ...prev].slice(0, 30);
      try {
        localStorage.setItem('speaksharp_history', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCreateCustomTopic = (newTopic: DebateTopic) => {
    setTopics((prev) => [newTopic, ...prev]);
    setActiveTopic(newTopic);
    setActiveTab('arena');
  };

  const speakPhrase = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  const isHome = activeTab === 'home';

  const SIDEBAR_ITEMS: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'learn', label: 'Học (Lộ trình)', icon: <Map size={19} /> },
    { id: 'arena', label: 'Phòng Luyện Nói', icon: <MessageSquareText size={19} /> },
    { id: 'world', label: 'Thế giới 3D', icon: <Globe size={19} /> },
    { id: 'topics', label: 'Chủ đề', icon: <Library size={19} /> },
    { id: 'pricing', label: 'Cửa hàng', icon: <ShoppingBag size={19} /> },
    { id: 'profile', label: 'Hồ sơ', icon: <User size={19} /> },
    { id: 'dashboard', label: 'Trường học', icon: <Building2 size={19} /> },
  ];

  return (
    <div className="app-shell">
      {isHome ? (
        <>
          {/* Clean Mango Dark Navbar for Landing Page */}
          <header className="topbar">
            <div className="brand" onClick={() => setActiveTab('home')}>
              <div className="brand-mark">
                <Mic size={18} />
              </div>
              <span className="brand-title">SpeakSharp</span>
            </div>

            <nav className="nav-tabs">
              {(
                [
                  ['home', 'Trang chủ'],
                  ['learn', 'Lộ trình học'],
                  ['world', 'Thế giới 3D'],
                  ['topics', 'Chủ đề'],
                  ['pricing', 'Cửa hàng'],
                  ['dashboard', 'Trường học'],
                ] as Array<[NavTab, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={`nav-tab ${activeTab === id ? 'active' : ''}`}
                  onClick={() => {
                    if (id === 'topics') setTopicFilterInit('Tất cả');
                    setActiveTab(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="topbar-right">
              {user ? (
                <>
                  <button
                    className="nav-login-btn"
                    onClick={() => setActiveTab('profile')}
                  >
                    {user.name}
                  </button>
                  <button
                    className="btn-gold"
                    style={{ padding: '8px 16px' }}
                    onClick={() => setActiveTab(user.role === 'teacher' ? 'dashboard' : 'learn')}
                  >
                    Vào học
                  </button>
                  <button
                    className="nav-login-btn"
                    title="Đăng xuất"
                    onClick={handleLogout}
                    style={{ padding: '6px 8px' }}
                  >
                    <LogOut size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button className="nav-login-btn" onClick={() => setAuthModalMode('login')}>
                    Đăng nhập
                  </button>
                  <button className="btn-gold" onClick={() => setAuthModalMode('register')}>
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </header>

          <LandingPage
            topics={topics}
            onStartPractice={(p) => {
              if (p) setPersona(p);
              setActiveTab('learn');
            }}
            onSelectCategory={(cat) => {
              setTopicFilterInit(cat);
              setActiveTab('topics');
            }}
            onOpenPricing={() => setActiveTab('pricing')}
            onOpenDashboard={() => setActiveTab('dashboard')}
          />
        </>
      ) : (
        /* DUOLINGO /LEARN LEFT-SIDEBAR APP SHELL (UNCLUTTERED) */
        <div className="learn-shell">
          <aside className="learn-sidebar">
            <div
              className="brand"
              style={{ padding: '4px 10px 18px' }}
              onClick={() => setActiveTab('home')}
              title="Về Trang chủ"
            >
              <div className="brand-mark">
                <Mic size={18} />
              </div>
              <span className="brand-title">SpeakSharp</span>
            </div>

            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'topics') setTopicFilterInit('Tất cả');
                  setActiveTab(item.id);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)', display: 'grid', gap: 6 }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </span>
                  <button className="ghost-link" onClick={handleLogout} title="Đăng xuất">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="duo-btn-3d gold"
                  style={{ width: '100%', padding: '9px' }}
                  onClick={() => setAuthModalMode('register')}
                >
                  Đăng nhập / Đăng ký
                </button>
              )}

              <button
                className="sidebar-nav-btn"
                style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px' }}
                onClick={() => setActiveTab('home')}
              >
                <ArrowLeft size={15} /> Về Trang chủ
              </button>
            </div>
          </aside>

          <main className="learn-content-area">
            <div key={activeTab} className="page-enter">
            {activeTab === 'learn' && (
              <LearningPath
                topics={topics}
                completedTopicIds={completedTopicIds}
                activeTopicId={activeTopic.id}
                isPro={isPro}
                totalXp={totalXp}
                streakDays={7}
                onStartTopic={(t) => {
                  setActiveTopic(t);
                  setActiveTab('arena');
                }}
                onOpenStore={() => setActiveTab('pricing')}
                onOpenSurvey={() => setShowSurveyModal(true)}
              />
            )}

            {activeTab === 'arena' && (
              <PracticeArena
                topic={activeTopic}
                persona={persona}
                onPersonaChange={setPersona}
                onOpenTopics={() => setActiveTab('topics')}
                isPro={isPro}
                remainingSeconds={remainingSeconds}
                onConsumeSecond={handleConsumeSecond}
                geminiApiKey={geminiApiKey}
                savedExpressions={savedExpressions}
                onSaveExpression={handleSaveExpression}
                onOpenSaved={() => setShowSavedModal(true)}
                onOpenSettings={() => {
                  setDraftApiKey(geminiApiKey);
                  setShowSettingsModal(true);
                }}
                onOpenPricing={() => setActiveTab('pricing')}
                onRetakeSurvey={() => setShowSurveyModal(true)}
                surveyGoal={surveyData?.goal}
                onTurnCompleted={handleTurnCompleted}
              />
            )}

            {activeTab === 'world' && (
              <World3D
                userName={user?.name || 'Bạn (Học viên)'}
                totalXp={totalXp}
                onEarnXp={(xp) => {
                  setTotalXp((prev) => {
                    const next = prev + xp;
                    try {
                      localStorage.setItem('speaksharp_xp', String(next));
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }}
                onSpendXp={(cost) => {
                  setTotalXp((prev) => {
                    const next = Math.max(0, prev - cost);
                    try {
                      localStorage.setItem('speaksharp_xp', String(next));
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }}
                onEnterDebateArena={() => setActiveTab('arena')}
              />
            )}

            {activeTab === 'topics' && (
              <TopicLibrary
                key={topicFilterInit}
                topics={topics}
                activeTopicId={activeTopic.id}
                isPro={isPro}
                initialCategory={topicFilterInit}
                onSelectTopic={(t) => {
                  setActiveTopic(t);
                  setActiveTab('arena');
                }}
                onCreateCustomTopic={handleCreateCustomTopic}
                onUnlockPro={() => setIsPro(true)}
              />
            )}

            {activeTab === 'pricing' && (
              <PricingView
                isPro={isPro}
                totalXp={totalXp}
                onSpendXp={(cost) => {
                  setTotalXp((prev) => {
                    const next = Math.max(0, prev - cost);
                    try {
                      localStorage.setItem('speaksharp_xp', String(next));
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }}
                onTogglePro={setIsPro}
                onOpenDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'dashboard' && <TeacherDashboard topics={topics} />}

            {activeTab === 'profile' && (
              <StudentProfile
                userName={user?.name || 'Học viên SpeakSharp'}
                userEmail={user?.email || 'hocvien@speaksharp.vn'}
                totalXp={totalXp}
                streakDays={7}
                surveyData={surveyData}
                history={sessionHistory}
                savedExpressions={savedExpressions}
                onStartPractice={() => setActiveTab('learn')}
                onRetakeSurvey={() => setShowSurveyModal(true)}
                onOpenSaved={() => setShowSavedModal(true)}
              />
            )}
            </div>
          </main>
        </div>
      )}

      {/* Login / Register Modal */}
      {authModalMode && (
        <div className="modal-backdrop" onClick={() => setAuthModalMode(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="display-font" style={{ fontSize: 19, fontWeight: 800 }}>
                {authModalMode === 'login' ? 'Đăng nhập SpeakSharp' : 'Tạo tài khoản miễn phí'}
              </h3>
              <button className="icon-btn" onClick={() => setAuthModalMode(null)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: 12 }}>
              {authModalMode === 'register' && (
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Họ và tên
                  </label>
                  <input
                    className="composer-input"
                    style={{ width: '100%' }}
                    placeholder="Nguyễn Minh Anh"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  className="composer-input"
                  style={{ width: '100%' }}
                  placeholder="ban@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Vai trò của bạn
                </label>
                <div className="segmented" style={{ width: '100%' }}>
                  <button
                    type="button"
                    className={`seg-btn ${authRole === 'student' ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setAuthRole('student')}
                  >
                    Học sinh / Tự học
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${authRole === 'teacher' ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setAuthRole('teacher')}
                  >
                    Giáo viên / Trường học
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: 6, padding: '11px' }}>
                {authModalMode === 'login' ? 'Đăng nhập' : 'Bắt đầu miễn phí 15 phút/ngày'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                {authModalMode === 'login' ? (
                  <>
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      className="ghost-link"
                      style={{ color: 'var(--text)', textDecoration: 'underline' }}
                      onClick={() => setAuthModalMode('register')}
                    >
                      Đăng ký ngay
                    </button>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      className="ghost-link"
                      style={{ color: 'var(--text)', textDecoration: 'underline' }}
                      onClick={() => setAuthModalMode('login')}
                    >
                      Đăng nhập
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Survey Modal */}
      {showSurveyModal && (
        <OnboardingSurveyModal
          userName={user?.name || 'bạn'}
          initialData={surveyData}
          onComplete={handleSurveyComplete}
          onSkip={() => {
            setShowSurveyModal(false);
            setActiveTab('learn');
          }}
        />
      )}

      {/* Saved Expressions Modal */}
      {showSavedModal && (
        <div className="modal-backdrop" onClick={() => setShowSavedModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 className="display-font" style={{ fontSize: 17, fontWeight: 800 }}>
                Sổ tay Better Expressions
              </h3>
              <button className="icon-btn" onClick={() => setShowSavedModal(false)}>
                <X size={15} />
              </button>
            </div>

            {savedExpressions.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>
                Chưa có mẫu câu nào được lưu.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                {savedExpressions.map((item) => (
                  <div key={item.id} className="list-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-indigo">{item.level}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="ghost-link" onClick={() => speakPhrase(item.phrase)}>
                          <Volume2 size={13} /> Nghe
                        </button>
                        <button
                          className="ghost-link"
                          onClick={() =>
                            setSavedExpressions((prev) => prev.filter((x) => x.id !== item.id))
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>“{item.phrase}”</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.contextVi}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Engine Settings Modal */}
      {showSettingsModal && (
        <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 className="display-font" style={{ fontSize: 17, fontWeight: 800 }}>
                Cài đặt AI Engine
              </h3>
              <button className="icon-btn" onClick={() => setShowSettingsModal(false)}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Mặc định dùng Smart Engine tích hợp. Nhập Gemini API Key nếu muốn kết nối trực tiếp <code>gemini-2.5-flash</code>.
              </p>
              <input
                type="password"
                className="composer-input"
                style={{ width: '100%' }}
                placeholder="Gemini API Key (tùy chọn)..."
                value={draftApiKey}
                onChange={(e) => setDraftApiKey(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>
                  Đóng
                </button>
                <button className="btn-gold" onClick={handleSaveApiKey}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
