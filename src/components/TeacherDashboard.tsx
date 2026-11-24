import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DebateTopic, HomeworkAssignment, Persona, StudentRecord } from '../types';
import { Reveal } from './Reveal';
import {
  INITIAL_HOMEWORKS,
  INITIAL_STUDENTS,
  WEEKLY_CLASS_PROGRESS,
} from '../data/b2bData';

interface TeacherDashboardProps {
  topics: DebateTopic[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ topics }) => {
  const [students] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [homeworks, setHomeworks] = useState<HomeworkAssignment[]>(INITIAL_HOMEWORKS);
  const [classFilter, setClassFilter] = useState<string>('Tất cả');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [hwTitle, setHwTitle] = useState('');
  const [hwClass, setHwClass] = useState('11A1 — Chuyên Anh');
  const [hwTopicId, setHwTopicId] = useState(topics[0]?.id ?? '');
  const [hwPersona, setHwPersona] = useState<Persona>('judge');
  const [hwMinutes, setHwMinutes] = useState(15);
  const [hwDueDate, setHwDueDate] = useState('05/12/2026');

  const classes = ['Tất cả', ...Array.from(new Set(students.map((s) => s.className)))];
  const visibleStudents =
    classFilter === 'Tất cả' ? students : students.filter((s) => s.className === classFilter);

  const avgClassScore = Math.round(
    visibleStudents.reduce((acc, s) => acc + s.avgScore, 0) / Math.max(1, visibleStudents.length)
  );
  const totalMinutes = visibleStudents.reduce((acc, s) => acc + s.weeklyMinutes, 0);
  const completedCount = visibleStudents.filter((s) => s.homeworkStatus === 'completed').length;
  const completionPct = Math.round((completedCount / Math.max(1, visibleStudents.length)) * 100);

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = topics.find((t) => t.id === hwTopicId) || topics[0];
    const newHw: HomeworkAssignment = {
      id: `hw-${Date.now()}`,
      title: hwTitle.trim() || `Bài tập nói: ${topic.titleVi}`,
      topicId: topic.id,
      topicTitle: topic.title,
      className: hwClass,
      persona: hwPersona,
      targetMinutes: hwMinutes,
      dueDate: hwDueDate,
      submittedCount: 0,
      totalStudents: 32,
    };
    setHomeworks((prev) => [newHw, ...prev]);
    setHwTitle('');
    setShowAssignModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Giáo Viên (B2B)</h1>
          <p className="page-sub">Theo dõi tiến độ luyện nói, giao bài tập về nhà và xem điểm chấm AI tự động.</p>
        </div>

        <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
          <Plus size={15} /> Giao bài tập mới
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="section-label">Học sinh</div>
          <div className="tabular" style={{ fontSize: 26, fontWeight: 700 }}>{visibleStudents.length}</div>
        </div>
        <div className="card kpi-card">
          <div className="section-label">Điểm nói TB</div>
          <div className="tabular" style={{ fontSize: 26, fontWeight: 700 }}>{avgClassScore}/100</div>
        </div>
        <div className="card kpi-card">
          <div className="section-label">Thời lượng / tuần</div>
          <div className="tabular" style={{ fontSize: 26, fontWeight: 700 }}>{totalMinutes} phút</div>
        </div>
        <div className="card kpi-card">
          <div className="section-label">Hoàn thành BTVN</div>
          <div className="tabular" style={{ fontSize: 26, fontWeight: 700 }}>{completionPct}%</div>
        </div>
      </div>

      {/* Chart + Homeworks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Reveal variant="fade-left" delay={60}>
        <div className="card" style={{ padding: 18, height: '100%' }}>
          <div className="section-label">Tiến bộ điểm nói (5 tuần)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 150, paddingTop: 14 }}>
            {WEEKLY_CLASS_PROGRESS.map((w) => (
              <div
                key={w.week}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
              >
                <span className="tabular" style={{ fontSize: 12, fontWeight: 600 }}>{w.avgScore}</span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 42,
                    height: `${(w.avgScore / 100) * 105}px`,
                    borderRadius: '6px 6px 2px 2px',
                    background: 'var(--text)',
                    opacity: 0.85,
                  }}
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{w.week}</span>
              </div>
            ))}
          </div>
        </div>
        </Reveal>

        <Reveal variant="fade-right" delay={140}>
        <div className="card" style={{ padding: 18, height: '100%' }}>
          <div className="section-label">Bài tập nói đang giao ({homeworks.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {homeworks.map((hw) => {
              const pct = Math.round((hw.submittedCount / hw.totalStudents) * 100);
              return (
                <div key={hw.id} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13.5 }}>{hw.title}</strong>
                    <span className="badge badge-slate">{hw.dueDate}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {hw.className} · {hw.submittedCount}/{hw.totalStudents} nộp ({pct}%)
                  </div>
                  <div className="metric-track" style={{ marginTop: 4 }}>
                    <div className="metric-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </Reveal>
      </div>

      {/* Roster */}
      <Reveal variant="fade-up" delay={100}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>Danh sách học sinh</span>
          <div className="segmented">
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`seg-btn ${classFilter === cls ? 'active' : ''}`}
                style={{ fontSize: 12 }}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>Lớp</th>
                <th>CEFR</th>
                <th>Điểm TB</th>
                <th>IPA / Ngữ pháp</th>
                <th>Phút / Tuần</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((st) => (
                <tr key={st.id} onClick={() => setSelectedStudent(st)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{st.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{st.className}</td>
                  <td><span className="badge badge-slate">{st.cefr}</span></td>
                  <td className="tabular" style={{ fontWeight: 600 }}>{st.avgScore}/100</td>
                  <td className="tabular" style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {st.pronunciationAvg} / {st.grammarAvg}
                  </td>
                  <td className="tabular">{st.weeklyMinutes} phút</td>
                  <td>
                    {st.homeworkStatus === 'completed' && <span className="badge badge-emerald">Hoàn thành</span>}
                    {st.homeworkStatus === 'in_progress' && <span className="badge badge-amber">Đang làm</span>}
                    {st.homeworkStatus === 'overdue' && <span className="badge badge-rose">Chưa nộp</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </Reveal>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selectedStudent.name}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {selectedStudent.className} · CEFR {selectedStudent.cefr}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedStudent(null)}>
                <X size={14} />
              </button>
            </div>

            <div className="section-label">Lỗi sai thường gặp</div>
            <ul style={{ paddingLeft: 18, fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 14, display: 'grid', gap: 4 }}>
              {selectedStudent.commonMistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>

            <div className="section-label">Chủ đề gần đây</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedStudent.recentTopics.map((t) => (
                <span key={t} className="badge badge-slate">{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Homework Modal */}
      {showAssignModal && (
        <div className="modal-backdrop" onClick={() => setShowAssignModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Giao bài tập nói</h3>
              <button className="icon-btn" onClick={() => setShowAssignModal(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} style={{ display: 'grid', gap: 12 }}>
              <input
                className="composer-input"
                style={{ width: '100%' }}
                placeholder="Tên bài tập..."
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
              />

              <select
                className="composer-input"
                style={{ width: '100%' }}
                value={hwTopicId}
                onChange={(e) => setHwTopicId(e.target.value)}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.level}] {t.title}
                  </option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select
                  className="composer-input"
                  style={{ width: '100%' }}
                  value={hwClass}
                  onChange={(e) => setHwClass(e.target.value)}
                >
                  <option>11A1 — Chuyên Anh</option>
                  <option>11A2 — IELTS Intensive</option>
                  <option>10A3 — Giao tiếp Phản xạ</option>
                </select>
                <select
                  className="composer-input"
                  style={{ width: '100%' }}
                  value={hwPersona}
                  onChange={(e) => setHwPersona(e.target.value as Persona)}
                >
                  <option value="judge">Giám khảo</option>
                  <option value="buddy">Bạn đồng hành</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="number"
                  min={5}
                  max={45}
                  className="composer-input"
                  style={{ width: '100%' }}
                  value={hwMinutes}
                  onChange={(e) => setHwMinutes(Number(e.target.value))}
                />
                <input
                  className="composer-input"
                  style={{ width: '100%' }}
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Giao bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
