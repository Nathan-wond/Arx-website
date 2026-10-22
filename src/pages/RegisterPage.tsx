import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

const GRADE_SECTIONS = [
  { grade: 'Grade 9', sections: ['9A', '9B', '9C', '9D', '9E'] },
  { grade: 'Grade 10', sections: ['10A', '10B', '10C', '10D', '10E'] },
  { grade: 'Grade 11', sections: ['11A', '11B', '11C', '11D', '11E'] },
  { grade: 'Grade 12', sections: ['12A', '12B', '12C', '12D', '12E'] }
];

const DEFAULT_COURSES = [
  { id: 'crs_web_dev', title: 'Web Design & Development', category: 'Web Development', duration: '12 Weeks' },
  { id: 'crs_python', title: 'Python Programming', category: 'Programming', duration: '10 Weeks' },
  { id: 'crs_cybersecurity', title: 'Cybersecurity Defense', category: 'Security', duration: '12 Weeks' },
  { id: 'crs_robotics', title: 'Robotics Engineering', category: 'Hardware & Engineering', duration: '14 Weeks' },
  { id: 'crs_ai&machinelearning', title: 'AI & Machine Learning', category: 'Artificial Intelligence', duration: '12 Weeks' }
];

interface UploadedAwardFile {
  fileName: string;
  fileData: string;
  fileType: string;
}

/**
 * Strict, normalized word counter following Section 1 rules:
 * - Trim leading and trailing whitespace
 * - Normalize spaces, tabs, and newlines
 * - Count non-empty words, not spaces
 * - Multiple spaces do not inflate the count
 * - Empty text counts as zero words
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const RegisterPage: React.FC = () => {
  const { navigate } = useRouter();
  const { register } = useAuth();

  const [availableCourses, setAvailableCourses] = useState<any[]>(DEFAULT_COURSES);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    secondName: '',
    lastName: '',
    class: '',
    courseIds: [] as string[],
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    email: '',
    telegramUsername: '',
    award: '',
    motivationEssay: ''
  });

  // Section 1: Telegram Username Validation state
  const [tgStatus, setTgStatus] = useState<{
    checking: boolean;
    valid: boolean | null;
    error?: string;
    message?: string;
    normalized?: string;
  }>({ checking: false, valid: null });

  // Section 1: Email Validation state
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean;
    valid: boolean | null;
    error?: string;
  }>({ checking: false, valid: null });

  const [awardFiles, setAwardFiles] = useState<UploadedAwardFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [regResult, setRegResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  // Live word counter computations
  const essayWordCount = useMemo(() => countWords(form.motivationEssay), [form.motivationEssay]);
  const essayWordRemaining = Math.max(0, 100 - essayWordCount);
  const isEssayValid = essayWordCount >= 100;
  const essayProgressPct = Math.min(100, Math.round((essayWordCount / 100) * 100));

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getPublicSettings().catch(() => ({ settings: null })),
      api.getCourses().catch(() => ({ courses: [] }))
    ]).then(([settingsRes, coursesRes]: [any, any]) => {
      if (!mounted) return;
      if (settingsRes?.settings?.registrationStatus === 'CLOSED') {
        setIsRegistrationClosed(true);
      }
      if (coursesRes?.courses && coursesRes.courses.length > 0) {
        setAvailableCourses(coursesRes.courses);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Debounced Telegram Username Availability & Format Check
  useEffect(() => {
    const raw = form.telegramUsername.trim();
    if (!raw) {
      setTgStatus({ checking: false, valid: null });
      return;
    }

    // Client-side pre-validation
    const clean = raw.replace(/^https?:\/\/t\.me\//i, '').replace(/^@+/, '').trim();

    if (clean.length < 5) {
      setTgStatus({
        checking: false,
        valid: false,
        error: 'Telegram username must be at least 5 characters long.'
      });
      return;
    }
    if (clean.length > 32) {
      setTgStatus({
        checking: false,
        valid: false,
        error: 'Telegram username cannot exceed 32 characters.'
      });
      return;
    }
    if (!/^[a-zA-Z]/.test(clean)) {
      setTgStatus({
        checking: false,
        valid: false,
        error: 'Telegram username must start with a letter (a-z).'
      });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setTgStatus({
        checking: false,
        valid: false,
        error: 'Please enter a valid Telegram username (letters, numbers, and underscores only).'
      });
      return;
    }
    if (clean.endsWith('_')) {
      setTgStatus({
        checking: false,
        valid: false,
        error: 'Telegram username cannot end with an underscore (_).'
      });
      return;
    }
    if (/__/.test(clean)) {
      setTgStatus({
        checking: false,
        valid: false,
        error: 'Telegram username cannot contain consecutive underscores (__).'
      });
      return;
    }

    setTgStatus(prev => ({ ...prev, checking: true, error: undefined }));

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkTelegramUsername(raw);
        if (res.available) {
          setTgStatus({
            checking: false,
            valid: true,
            normalized: res.normalized,
            message: 'Username format is valid, but account ownership has not yet been verified.'
          });
        } else {
          setTgStatus({
            checking: false,
            valid: false,
            error: res.error || (res.taken ? 'This username is already registered with ARX IT Club.' : 'Please enter a valid Telegram username.')
          });
        }
      } catch (err: any) {
        setTgStatus({
          checking: false,
          valid: false,
          error: err?.message || 'Failed to check username availability.'
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.telegramUsername]);

  // Debounced Email Availability & Format Check
  useEffect(() => {
    const raw = form.email.trim();
    if (!raw) {
      setEmailStatus({ checking: false, valid: null });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(raw)) {
      setEmailStatus({
        checking: false,
        valid: false,
        error: 'Please enter a valid email address (e.g. name@example.com).'
      });
      return;
    }

    setEmailStatus(prev => ({ ...prev, checking: true, error: undefined }));

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkEmail(raw);
        if (res.available) {
          setEmailStatus({ checking: false, valid: true });
        } else {
          setEmailStatus({
            checking: false,
            valid: false,
            error: res.error || 'This email address is already registered with ARX IT Club.'
          });
        }
      } catch (err: any) {
        setEmailStatus({
          checking: false,
          valid: false,
          error: err?.message || 'Failed to check email availability.'
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.email]);

  const handleCourseToggle = (courseId: string) => {
    setForm(prev => {
      const exists = prev.courseIds.includes(courseId);
      if (exists) {
        return {
          ...prev,
          courseIds: prev.courseIds.filter(id => id !== courseId)
        };
      }
      if (prev.courseIds.length >= 2) {
        return {
          ...prev,
          courseIds: [prev.courseIds[1], courseId]
        };
      }
      return {
        ...prev,
        courseIds: [...prev.courseIds, courseId]
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError(null);
    const newFiles: UploadedAwardFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 2.5 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds 2.5MB. Please upload compressed files.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        newFiles.push({
          fileName: file.name,
          fileData: result,
          fileType: file.type
        });
        if (newFiles.length === files.length) {
          setAwardFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setAwardFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.secondName.trim() || !form.lastName.trim()) {
      setErrorMessage('Please provide your full three-part student name (First, Middle, Last).');
      return;
    }
    if (!form.class) {
      setErrorMessage('Please select your grade and section.');
      return;
    }
    if (form.courseIds.length < 2) {
      setErrorMessage('Please select exactly 2 technology curriculum tracks to complete your registration.');
      return;
    }
    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!form.telegramUsername.trim()) {
      setErrorMessage('Please provide your Telegram username (e.g. @username) for official bot linking.');
      return;
    }
    if (tgStatus.valid === false) {
      setErrorMessage(tgStatus.error || 'Please provide a valid, available Telegram username.');
      return;
    }

    if (form.email.trim() && emailStatus.valid === false) {
      setErrorMessage(emailStatus.error || 'Please provide a valid, available email address.');
      return;
    }

    // Section 1: 100-word essay enforcement
    if (essayWordCount < 100) {
      setErrorMessage(`Your motivation essay has ${essayWordCount} words. A minimum of 100 words is required (${essayWordRemaining} more words required).`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const studentName = `${form.firstName.trim()} ${form.secondName.trim()} ${form.lastName.trim()}`;
      const payload = {
        studentName,
        firstName: form.firstName.trim(),
        secondName: form.secondName.trim(),
        lastName: form.lastName.trim(),
        class: form.class,
        courseIds: form.courseIds,
        courseId: form.courseIds[0],
        password: form.password,
        confirmPassword: form.confirmPassword,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        telegramUsername: form.telegramUsername.trim(),
        award: form.award.trim(),
        awardFiles,
        motivationEssay: form.motivationEssay.trim()
      };

      const result = await register(payload);
      setRegResult(result);
      if (result.activationCode) {
        setActivationCode(result.activationCode);
      }
      if (typeof (window as any).confetti === 'function') {
        (window as any).confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please review your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (regResult?.memberId) {
      navigator.clipboard.writeText(regResult.memberId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleActivate = async () => {
    if (!activationCode.trim() || !regResult?.memberId) return;
    setActivating(true);
    try {
      const res = await api.activateAccount(activationCode.trim(), regResult.memberId);
      if (res?.success) {
        setActivationSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Activation failed.');
    } finally {
      setActivating(false);
    }
  };

  if (isRegistrationClosed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center mx-auto">
          <Icon name="Lock" className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#282828] dark:text-white">Registration Closed</h2>
        <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white max-w-md mx-auto leading-relaxed">
          Applications for the current semester cohort are presently closed. Check back at the start of the next school term or follow @arxitclub for updates.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (regResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="p-8 rounded-2xl border border-emerald-200 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-[#15362B] text-emerald-600 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] flex items-center justify-center mx-auto">
            <Icon name="CheckCircle" className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#282828] dark:text-white font-sans">
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-[#282828]/70 dark:text-white">
              Your student membership record has been registered with ARX IT Club.
            </p>
          </div>

          {/* Member ID Box */}
          <div className="p-4 rounded-xl bg-[#FAF4EE] dark:bg-[#071A14] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between max-w-sm mx-auto">
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Your Member ID</span>
              <span className="font-mono text-xl font-bold text-[#FC6454] dark:text-[#6BB89E]">
                {regResult.memberId}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] transition-colors cursor-pointer"
            >
              <Icon name="Copy" className="w-3.5 h-3.5" />
              <span>{copiedId ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Mandatory Telegram Bot Ownership Link Step */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-left space-y-3">
            <div className="flex items-start gap-2.5">
              <Icon name="Send" className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Verify Telegram Ownership with @ARXITCLUB_bot
                </h4>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  Per club security policies, Telegram account ownership must be verified directly through our official bot to link your account.
                </p>
              </div>
            </div>

            {regResult.activationUrl && (
              <a
                href={regResult.activationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Icon name="ExternalLink" className="w-4 h-4" />
                <span>Launch @ARXITCLUB_bot to Verify Ownership</span>
              </a>
            )}
          </div>

          {/* Optional Code Activation */}
          <div className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] space-y-3">
            <span className="text-[11px] text-[#282828]/60 dark:text-white block">
              Have a 6-digit verification code from @ARXITCLUB_bot?
            </span>
            {activationSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Account activated! You can now access your Student Desk.
              </div>
            ) : (
              <div className="flex gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono text-center rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white uppercase"
                />
                <button
                  onClick={handleActivate}
                  disabled={activating || !activationCode.trim()}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#282828] text-white hover:bg-[#282828]/90 dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] disabled:opacity-50 cursor-pointer"
                >
                  {activating ? 'Verifying...' : 'Activate'}
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
            >
              Go to Member Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-medium border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#FC6454]/10 text-[#FC6454] dark:bg-[#2F8068]/20 dark:text-[#6BB89E]">
          <Icon name="UserPlus" className="w-3.5 h-3.5" />
          <span>OFFICIAL CLUB MEMBERSHIP APPLICATION</span>
        </div>
        <h1 className="text-3xl font-bold text-[#282828] dark:text-white font-sans tracking-tight">
          Join ARX IT Club
        </h1>
        <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white">
          Fill in your student credentials, choose 2 curriculum tracks, provide your contact details, and write your motivation essay (min 100 words).
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <Icon name="AlertCircle" className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent"
          >
            &times;
          </button>
        </div>
      )}

      {/* Registration Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Student Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#282828] dark:text-white font-mono border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
              1. Student Official Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dawit"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">Middle / Father's Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alemayehu"
                  value={form.secondName}
                  onChange={(e) => setForm({ ...form, secondName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">Grandfather / Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tadesse"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">Grade & Section *</label>
              <select
                required
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
              >
                <option value="">Select your section (Grades 9 - 12)</option>
                {GRADE_SECTIONS.map(g => (
                  <optgroup key={g.grade} label={g.grade}>
                    {g.sections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Choose 2 Curriculum Tracks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
                2. Curriculum Tracks (Choose Exactly 2 Tracks) *
              </h3>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                form.courseIds.length === 2
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {form.courseIds.length} / 2 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableCourses.map((c) => {
                const selected = form.courseIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleCourseToggle(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
                      selected
                        ? 'border-[#FC6454] dark:border-[#58B889] bg-[#FC6454]/5 dark:bg-[#2F8068]/20 ring-1 ring-[#FC6454] dark:ring-[#58B889]'
                        : 'border-[#282828]/15 dark:border-[#25473C] hover:border-[#FC6454]/40 dark:hover:border-[#58B889]/40 bg-white dark:bg-[#0C241C]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                      selected
                        ? 'bg-[#FC6454] dark:bg-[#2F8068] border-transparent text-white'
                        : 'border-[#282828]/30 dark:border-[#294B40]'
                    }`}>
                      {selected && <Icon name="Check" className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#282828] dark:text-white truncate">{c.title}</div>
                      <div className="text-[11px] text-[#282828]/60 dark:text-white">{c.category} · {c.duration || 'Semester'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Contact & Passphrase */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#282828] dark:text-white font-mono border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
              3. Contact & Security Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+251 9... or 09..."
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
                <span className="text-[10px] text-[#282828]/50 dark:text-white mt-1 block">9-digit Ethiopian phone number</span>
              </div>

              {/* Email (Optional) with Live Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#282828]/80 dark:text-white">
                    Email Address <span className="text-[#282828]/50 dark:text-white">(Optional)</span>
                  </label>
                  {emailStatus.checking && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Checking...</span>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 ${
                    emailStatus.valid === true
                      ? 'border-emerald-500 focus:ring-emerald-500/30'
                      : emailStatus.valid === false
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-[#282828]/20 dark:border-[#294B40] focus:ring-[#FC6454]/30'
                  }`}
                />
                {emailStatus.valid === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 leading-tight flex items-center gap-1">
                    <Icon name="AlertCircle" className="w-3 h-3 shrink-0" />
                    <span>{emailStatus.error}</span>
                  </p>
                )}
                {emailStatus.valid === true && form.email.trim() && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 leading-tight flex items-center gap-1">
                    <Icon name="CheckCircle" className="w-3 h-3 shrink-0" />
                    <span>Email format is valid and available.</span>
                  </p>
                )}
                {!form.email.trim() && (
                  <span className="text-[10px] text-[#282828]/50 dark:text-white mt-1 block">
                    Optional. Used for club notices and alerts.
                  </span>
                )}
              </div>

              {/* Telegram Username with Section 1 Live Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#282828]/80 dark:text-white">
                    Telegram Username *
                  </label>
                  {tgStatus.checking && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                      Checking availability...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="@username"
                  value={form.telegramUsername}
                  onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 ${
                    tgStatus.valid === true
                      ? 'border-emerald-500 focus:ring-emerald-500/30'
                      : tgStatus.valid === false
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-[#282828]/20 dark:border-[#294B40] focus:ring-[#FC6454]/30'
                  }`}
                />

                {/* Validation Feedback Messages */}
                {tgStatus.checking && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                    Checking username availability…
                  </p>
                )}

                {tgStatus.valid === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 leading-tight flex items-start gap-1">
                    <Icon name="AlertCircle" className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{tgStatus.error}</span>
                  </p>
                )}

                {tgStatus.valid === true && !tgStatus.checking && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-tight flex items-center gap-1">
                      <Icon name="CheckCircle" className="w-3 h-3 shrink-0" />
                      <span>{tgStatus.message || 'Username format is valid, but account ownership has not yet been verified.'}</span>
                    </p>
                    <span className="text-[10px] text-[#282828]/50 dark:text-white block">
                      Account ownership will be verified through @ARXITCLUB_bot upon registration.
                    </span>
                  </div>
                )}

                {!form.telegramUsername && (
                  <span className="text-[10px] text-[#282828]/50 dark:text-white mt-1 block">
                    Accepts optional leading @. Min 5 characters.
                  </span>
                )}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Create Password * (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Achievements & Motivation Essay (Minimum 100 Words) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#282828] dark:text-white font-mono border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
              4. Achievements & Motivation Essay (Min. 100 Words)
            </h3>

            <div>
              <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                Prior Technology Experience or Awards (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Mention any programming languages, science fair honors, robotics experience..."
                value={form.award}
                onChange={(e) => setForm({ ...form, award: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
              />
            </div>

            {/* Award File Uploads */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#282828]/80 dark:text-white">
                Upload Award Proof / Certificate Files (Optional, Max 2.5MB per file)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
                className="block w-full text-xs text-[#282828]/70 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FC6454]/10 file:text-[#FC6454] dark:file:bg-[#2F8068]/30 dark:file:text-[#6BB89E] hover:file:bg-[#FC6454]/20 cursor-pointer"
              />
              {fileError && <p className="text-xs text-rose-600">{fileError}</p>}

              {awardFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {awardFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FAF4EE] dark:bg-[#071A14] border border-[#282828]/10 dark:border-[#25473C] text-xs font-mono"
                    >
                      <Icon name="FileText" className="w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]" />
                      <span className="truncate max-w-[150px]">{f.fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer border-0 bg-transparent p-0"
                      >
                        <Icon name="X" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 1: Motivation Essay with Strict Live Word Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white">
                  Why do you want to join ARX IT Club? (Motivation Statement) *
                </label>
                <span className="text-[11px] font-mono text-[#282828]/60 dark:text-white">
                  Minimum 100 words
                </span>
              </div>

              <textarea
                rows={5}
                required
                placeholder="Explain why you want to join ARX IT Club. What projects do you want to build? What skills do you hope to learn in Computer Lab 3? How will you contribute to fellow students? (Minimum 100 words required)"
                value={form.motivationEssay}
                onChange={(e) => setForm({ ...form, motivationEssay: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-lg border bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white resize-none focus:outline-none focus:ring-2 transition-all ${
                  isEssayValid
                    ? 'border-emerald-500 focus:ring-emerald-500/30'
                    : essayWordCount > 0
                    ? 'border-amber-400 focus:ring-amber-500/30'
                    : 'border-[#282828]/20 dark:border-[#294B40] focus:ring-[#FC6454]/30'
                }`}
              />

              {/* Progress bar */}
              <div className="w-full bg-[#EFE6DE] dark:bg-[#15362B] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isEssayValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${essayProgressPct}%` }}
                />
              </div>

              {/* Live Word Counter Status Display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  {isEssayValid ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-[#58B889] font-semibold">
                      <Icon name="CheckCircle" className="w-3.5 h-3.5" />
                      <span>Words written: {essayWordCount} / 100. Minimum requirement met!</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                      <Icon name="AlertCircle" className="w-3.5 h-3.5" />
                      <span>Words written: {essayWordCount} / 100. {essayWordRemaining} more words required.</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-[#282828]/50 dark:text-white">
                  {isEssayValid ? 'Essay meets length standards' : 'Count reflects normalized non-empty words'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer border-0 shadow-md flex items-center justify-center gap-2 ${
              isEssayValid
                ? 'bg-[#FC6454] hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277]'
                : 'bg-[#282828]/40 dark:bg-[#25473C]/50 hover:bg-[#282828]/50'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application to ARX IT Club...</span>
              </>
            ) : (
              <>
                <Icon name="CheckCircle" className="w-4 h-4" />
                <span>
                  {isEssayValid
                    ? 'Submit Membership Application'
                    : `Complete Essay (${essayWordRemaining} more words required)`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
