import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

/* ---- Types ---- */

interface LessonSummary {
  id: string;
  title: string;
  orderIndex: number;
  curriculumId: string;
}

interface CurriculumListResponse {
  lessons: LessonSummary[];
  total: number;
}

interface LanguageItem {
  code: string;
  name: string;
  isDefault: boolean;
}

interface LanguageListResponse {
  languages: LanguageItem[];
}

type Tab = 'curriculum' | 'languages' | 'chapters';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const SKILLS = ['grammar', 'reading', 'listening', 'speaking'] as const;
const ACCEPTED_EXTENSIONS = ['.pdf', '.mp3', '.wav', '.mp4', '.txt'];
const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'text/plain',
]);

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('curriculum');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      {/* Nav */}
      <nav style={navStyle}>
        <div style={navLeftStyle}>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link to="/admin" style={navLinkActiveStyle}>Admin</Link>
        </div>
        <div style={navRightStyle}>
          <span style={userNameStyle}>{user?.displayName}</span>
          <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
        </div>
      </nav>

      <h1 style={{ marginBottom: '1rem' }}>Admin Panel</h1>

      {/* Tab navigation */}
      <div style={tabBarStyle}>
        <button
          onClick={() => setActiveTab('curriculum')}
          style={activeTab === 'curriculum' ? tabActiveBtnStyle : tabBtnStyle}
          aria-pressed={activeTab === 'curriculum'}
        >
          Curriculum
        </button>
        <button
          onClick={() => setActiveTab('languages')}
          style={activeTab === 'languages' ? tabActiveBtnStyle : tabBtnStyle}
          aria-pressed={activeTab === 'languages'}
        >
          Languages
        </button>
        <button
          onClick={() => setActiveTab('chapters')}
          style={activeTab === 'chapters' ? tabActiveBtnStyle : tabBtnStyle}
          aria-pressed={activeTab === 'chapters'}
        >
          Chapters
        </button>
      </div>

      {activeTab === 'curriculum' ? <CurriculumTab /> : activeTab === 'chapters' ? <ChaptersTab /> : <LanguagesTab />}
    </div>
  );
}

/* ================================================================
   Curriculum Tab
   ================================================================ */

function CurriculumTab() {
  const [language, setLanguage] = useState('lb');
  const [level, setLevel] = useState<string>('A1');
  const [skill, setSkill] = useState<string>('grammar');

  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create / edit form
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonSummary | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Languages for filter dropdown
  const [languages, setLanguages] = useState<LanguageItem[]>([]);

  const fetchLanguages = useCallback(async () => {
    try {
      const res = await apiClient.get<LanguageListResponse>('/api/languages');
      setLanguages(res.data.languages);
    } catch { /* ignore */ }
  }, []);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CurriculumListResponse>('/api/curriculum', {
        params: { language, level, skill },
      });
      setLessons(res.data.lessons);
    } catch {
      setError('Failed to load curriculum.');
    } finally {
      setLoading(false);
    }
  }, [language, level, skill]);

  useEffect(() => { fetchLanguages(); }, [fetchLanguages]);
  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const openCreate = () => {
    setEditingLesson(null);
    setFormTitle('');
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (lesson: LessonSummary) => {
    setEditingLesson(lesson);
    setFormTitle(lesson.title);
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { setFormError('Title is required'); return; }
    setFormSaving(true);
    setFormError(null);
    try {
      if (editingLesson) {
        await apiClient.put(`/api/curriculum/lessons/${editingLesson.id}`, { title: formTitle.trim() });
      } else {
        await apiClient.post('/api/curriculum/lessons', {
          targetLanguage: language,
          level,
          skill,
          title: formTitle.trim(),
          order: lessons.length,
          content: [],
        });
      }
      setShowForm(false);
      fetchLessons();
    } catch {
      setFormError('Failed to save lesson.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await apiClient.delete(`/api/curriculum/lessons/${id}`);
      fetchLessons();
    } catch {
      setError('Failed to delete lesson.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    const reordered = [...lessons];
    [reordered[index], reordered[swapIdx]] = [reordered[swapIdx], reordered[index]];
    const lessonIds = reordered.map((l) => l.id);
    try {
      await apiClient.put('/api/curriculum/lessons/reorder', { lessonIds });
      setLessons(reordered);
    } catch {
      setError('Failed to reorder lessons.');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div style={filterRowStyle}>
        <label style={filterLabelStyle}>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
            {languages.length === 0 && <option value="lb">Luxembourgish</option>}
          </select>
        </label>
        <label style={filterLabelStyle}>
          Level
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={selectStyle}>
            {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label style={filterLabelStyle}>
          Skill
          <select value={skill} onChange={(e) => setSkill(e.target.value)} style={selectStyle}>
            {SKILLS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
        <button onClick={openCreate} style={primaryBtnStyle}>+ New Lesson</button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ margin: '0 0 0.75rem' }}>{editingLesson ? 'Edit Lesson' : 'New Lesson'}</h3>
          <input
            type="text"
            placeholder="Lesson title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            style={inputStyle}
            aria-label="Lesson title"
          />
          {formError && <p style={inlineErrorStyle}>{formError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={handleSave} disabled={formSaving} style={primaryBtnStyle}>
              {formSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </div>
      )}

      {/* Lesson list */}
      {loading && <p style={mutedTextStyle}>Loading lessons...</p>}
      {error && <p style={inlineErrorStyle}>{error}</p>}
      {!loading && lessons.length === 0 && !error && (
        <p style={mutedTextStyle}>No lessons found for this filter.</p>
      )}
      {lessons.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson, idx) => (
              <tr key={lesson.id}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>{lesson.title}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} style={smallBtnStyle} aria-label="Move up">↑</button>
                    <button onClick={() => handleMove(idx, 'down')} disabled={idx === lessons.length - 1} style={smallBtnStyle} aria-label="Move down">↓</button>
                    <button onClick={() => openEdit(lesson)} style={smallBtnStyle}>Edit</button>
                    <button onClick={() => handleDelete(lesson.id)} style={dangerSmallBtnStyle}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* File uploader */}
      <FileUploader />
    </div>
  );
}

/* ================================================================
   File Uploader Component
   ================================================================ */

function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ fileUrl: string; fileType: string } | null>(null);

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_MIME_TYPES.has(f.type)) {
      return `Unsupported format "${ext}". Accepted: PDF, MP3, WAV, MP4, plain text.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadResult(null);
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      const err = validateFile(selected);
      if (err) { setUploadError(err); setFile(null); return; }
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setUploadError(null);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<{ fileUrl: string; fileType: string }>(
        '/api/curriculum/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
          },
        },
      );
      setUploadResult(res.data);
      setFile(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={formCardStyle}>
      <h3 style={{ margin: '0 0 0.75rem' }}>Upload Curriculum File</h3>
      <p style={mutedTextStyle}>Accepted formats: PDF, MP3, WAV, MP4, plain text</p>
      <input
        type="file"
        accept=".pdf,.mp3,.wav,.mp4,.txt"
        onChange={handleFileChange}
        style={{ marginBottom: '0.5rem' }}
        aria-label="Curriculum file"
      />
      {file && <p style={{ fontSize: '0.85rem', color: '#333' }}>Selected: {file.name}</p>}
      {uploadError && <p style={inlineErrorStyle}>{uploadError}</p>}
      {uploading && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={progressBarContainerStyle}>
            <div style={{ ...progressBarFillStyle, width: `${progress}%` }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" />
          </div>
          <p style={mutedTextStyle}>{progress}%</p>
        </div>
      )}
      {uploadResult && (
        <p style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '0.5rem' }}>
          Uploaded successfully — {uploadResult.fileType}
        </p>
      )}
      <button onClick={handleUpload} disabled={!file || uploading} style={primaryBtnStyle}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}

/* ================================================================
   Chapters Tab
   ================================================================ */

interface ChapterItem {
  id: string;
  title: string;
  description: string;
  level: string;
  learningPath: string;
  orderIndex: number;
  published: boolean;
}

function ChaptersTab() {
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState('A1');
  const [filterPath, setFilterPath] = useState('sproochentest');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLevel, setFormLevel] = useState('A1');
  const [formPath, setFormPath] = useState('sproochentest');
  const [formOrder, setFormOrder] = useState(0);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchChapters = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/api/chapters', { params: { level: filterLevel, path: filterPath } });
      setChapters(res.data.chapters || []);
    } catch { setError('Failed to load chapters.'); }
    finally { setLoading(false); }
  }, [filterLevel, filterPath]);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  const openCreate = () => {
    setEditingChapter(null);
    setFormTitle(''); setFormDesc(''); setFormLevel(filterLevel); setFormPath(filterPath);
    setFormOrder(chapters.length); setFormError(null); setShowForm(true);
  };

  const openEdit = (ch: ChapterItem) => {
    setEditingChapter(ch);
    setFormTitle(ch.title); setFormDesc(ch.description); setFormLevel(ch.level);
    setFormPath(ch.learningPath); setFormOrder(ch.orderIndex); setFormError(null); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDesc.trim()) { setFormError('Title and description are required'); return; }
    setFormSaving(true); setFormError(null);
    try {
      if (editingChapter) {
        await apiClient.put(`/api/chapters/${editingChapter.id}`, {
          title: formTitle.trim(), description: formDesc.trim(), level: formLevel,
          learningPath: formPath, orderIndex: formOrder,
        });
      } else {
        await apiClient.post('/api/chapters', {
          title: formTitle.trim(), description: formDesc.trim(), level: formLevel,
          learningPath: formPath, orderIndex: formOrder,
        });
      }
      setShowForm(false); fetchChapters();
    } catch { setFormError('Failed to save chapter.'); }
    finally { setFormSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this chapter and all its content?')) return;
    try { await apiClient.delete(`/api/chapters/${id}`); fetchChapters(); }
    catch { setError('Failed to delete chapter.'); }
  };

  const handlePublish = async (ch: ChapterItem) => {
    try { await apiClient.put(`/api/chapters/${ch.id}`, { published: !ch.published }); fetchChapters(); }
    catch { setError('Failed to update chapter.'); }
  };

  return (
    <div>
      <div style={filterRowStyle}>
        <label style={filterLabelStyle}>
          Level
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={selectStyle}>
            {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label style={filterLabelStyle}>
          Path
          <select value={filterPath} onChange={(e) => setFilterPath(e.target.value)} style={selectStyle}>
            <option value="sproochentest">Sproochentest</option>
            <option value="daily_life">Daily Life</option>
          </select>
        </label>
        <button onClick={openCreate} style={primaryBtnStyle}>+ New Chapter</button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ margin: '0 0 0.75rem' }}>{editingChapter ? 'Edit Chapter' : 'New Chapter'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input type="text" placeholder="Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={inputStyle} aria-label="Chapter title" />
            <input type="text" placeholder="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} style={inputStyle} aria-label="Chapter description" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={formLevel} onChange={(e) => setFormLevel(e.target.value)} style={selectStyle} aria-label="Level">
                {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={formPath} onChange={(e) => setFormPath(e.target.value)} style={selectStyle} aria-label="Learning path">
                <option value="sproochentest">Sproochentest</option>
                <option value="daily_life">Daily Life</option>
              </select>
              <input type="number" placeholder="Order" value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))} style={{ ...inputStyle, width: 80 }} aria-label="Order index" />
            </div>
          </div>
          {formError && <p style={inlineErrorStyle}>{formError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={handleSave} disabled={formSaving} style={primaryBtnStyle}>{formSaving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setShowForm(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p style={mutedTextStyle}>Loading chapters...</p>}
      {error && <p style={inlineErrorStyle}>{error}</p>}
      {!loading && chapters.length === 0 && !error && <p style={mutedTextStyle}>No chapters found.</p>}
      {chapters.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((ch, idx) => (
              <tr key={ch.id}>
                <td style={tdStyle}>{ch.orderIndex}</td>
                <td style={tdStyle}>{ch.title}<br /><span style={{ fontSize: '0.78rem', color: '#888' }}>{ch.description}</span></td>
                <td style={tdStyle}>{ch.published ? '✅ Published' : '📝 Draft'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(ch)} style={smallBtnStyle}>Edit</button>
                    <button onClick={() => handlePublish(ch)} style={smallBtnStyle}>{ch.published ? 'Unpublish' : 'Publish'}</button>
                    <button onClick={() => handleDelete(ch.id)} style={dangerSmallBtnStyle}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ChapterMaterialUploader />
    </div>
  );
}

function ChapterMaterialUploader() {
  const [chapterId, setChapterId] = useState('');
  const [skill, setSkill] = useState('grammar');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ fileUrl: string; fileType: string; originalName: string }[] | null>(null);

  const handleUpload = async () => {
    if (!chapterId.trim() || !files || files.length === 0) { setUploadError('Chapter ID and files are required'); return; }
    setUploading(true); setUploadError(null); setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('skill', skill);
      for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
      const res = await apiClient.post(`/api/curriculum/chapters/${chapterId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(res.data.uploadedFiles);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Upload failed.');
    } finally { setUploading(false); }
  };

  return (
    <div style={formCardStyle}>
      <h3 style={{ margin: '0 0 0.75rem' }}>Upload Chapter Materials</h3>
      <p style={mutedTextStyle}>Upload PDF, MP3, WAV, or text files to a chapter.</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '0.75rem' }}>
        <label style={filterLabelStyle}>
          Chapter ID
          <input type="text" value={chapterId} onChange={(e) => setChapterId(e.target.value)} placeholder="Chapter UUID" style={inputStyle} aria-label="Chapter ID" />
        </label>
        <label style={filterLabelStyle}>
          Skill
          <select value={skill} onChange={(e) => setSkill(e.target.value)} style={selectStyle} aria-label="Skill">
            {SKILLS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
      </div>
      <input type="file" multiple accept=".pdf,.mp3,.wav,.txt" onChange={(e) => setFiles(e.target.files)} style={{ marginTop: '0.5rem' }} aria-label="Material files" />
      {uploadError && <p style={inlineErrorStyle}>{uploadError}</p>}
      {uploadResult && <p style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '0.5rem' }}>Uploaded {uploadResult.length} file(s) successfully.</p>}
      <button onClick={handleUpload} disabled={uploading} style={{ ...primaryBtnStyle, marginTop: '0.75rem' }}>
        {uploading ? 'Uploading...' : 'Upload Materials'}
      </button>
    </div>
  );
}

/* ================================================================
   Languages Tab
   ================================================================ */

function LanguagesTab() {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<LanguageListResponse>('/api/languages');
      setLanguages(res.data.languages);
    } catch {
      setError('Failed to load languages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLanguages(); }, [fetchLanguages]);

  const handleAdd = async () => {
    if (!code.trim() || !name.trim()) { setFormError('Both code and name are required.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.post('/api/languages', { code: code.trim(), name: name.trim() });
      setCode('');
      setName('');
      fetchLanguages();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add language.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Add language form */}
      <div style={formCardStyle}>
        <h3 style={{ margin: '0 0 0.75rem' }}>Add New Language</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={filterLabelStyle}>
            Code (ISO 639-1)
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. fr" style={inputStyle} maxLength={10} aria-label="Language code" />
          </label>
          <label style={filterLabelStyle}>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. French" style={inputStyle} aria-label="Language name" />
          </label>
          <button onClick={handleAdd} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Adding...' : 'Add Language'}
          </button>
        </div>
        {formError && <p style={inlineErrorStyle}>{formError}</p>}
      </div>

      {/* Language list */}
      {loading && <p style={mutedTextStyle}>Loading languages...</p>}
      {error && <p style={inlineErrorStyle}>{error}</p>}
      {!loading && languages.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Default</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((lang) => (
              <tr key={lang.code}>
                <td style={tdStyle}>{lang.code}</td>
                <td style={tdStyle}>{lang.name}</td>
                <td style={tdStyle}>{lang.isDefault ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ================================================================
   Shared Inline Styles
   ================================================================ */

const navStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.75rem 0', borderBottom: '1px solid #e0e0e0', marginBottom: '1.5rem',
};
const navLeftStyle: React.CSSProperties = { display: 'flex', gap: '1.5rem' };
const navRightStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem' };
const navLinkStyle: React.CSSProperties = { textDecoration: 'none', color: '#555', fontWeight: 500 };
const navLinkActiveStyle: React.CSSProperties = { ...navLinkStyle, color: '#2563eb', fontWeight: 600 };
const userNameStyle: React.CSSProperties = { fontSize: '0.875rem', color: '#666' };
const logoutBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #ccc', borderRadius: '4px',
  padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#555',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex', gap: '0', border: '1px solid #ccc', borderRadius: '6px',
  overflow: 'hidden', marginBottom: '1.5rem', width: 'fit-content',
};
const tabBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem', border: 'none', background: '#fff',
  cursor: 'pointer', fontSize: '0.9rem', color: '#555',
};
const tabActiveBtnStyle: React.CSSProperties = {
  ...tabBtnStyle, background: '#2563eb', color: '#fff', fontWeight: 600,
};

const filterRowStyle: React.CSSProperties = {
  display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.25rem',
};
const filterLabelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#555',
};
const selectStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem',
};
const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
};
const secondaryBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle, background: '#fff', color: '#555', border: '1px solid #ccc',
};
const smallBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem', background: '#f5f5f5', border: '1px solid #ddd',
  borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
};
const dangerSmallBtnStyle: React.CSSProperties = {
  ...smallBtnStyle, color: '#dc2626', borderColor: '#fca5a5',
};

const formCardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
  padding: '1.25rem', marginBottom: '1.25rem',
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' };
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '0.6rem 0.75rem', borderBottom: '2px solid #e5e7eb',
  fontSize: '0.85rem', color: '#555', fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem',
};

const inlineErrorStyle: React.CSSProperties = { color: '#dc2626', fontSize: '0.85rem', marginTop: '0.35rem' };
const mutedTextStyle: React.CSSProperties = { color: '#888', fontSize: '0.9rem' };

const progressBarContainerStyle: React.CSSProperties = {
  height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden',
};
const progressBarFillStyle: React.CSSProperties = {
  height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.3s ease',
};
