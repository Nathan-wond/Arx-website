import React, { useState } from 'react';
import Icon from '../components/Icon.tsx';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    contactInfo: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate dispatch
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
          CONNECT & REACH OUT
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          Contact the ARX IT Club
        </h1>
        <p className="text-sm sm:text-base text-[#282828]/80 dark:text-white leading-relaxed">
          Have questions about joining, workshops, curriculum prerequisites, or collaborating on school technology projects? Drop us a note or visit Computer Lab 3.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-7 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <Icon name="CheckCircle" className="w-10 h-10 text-emerald-600 dark:text-[#58B889] mx-auto" />
              <h3 className="text-base font-semibold text-[#282828] dark:text-white">Message Dispatched</h3>
              <p className="text-xs text-[#282828]/70 dark:text-white max-w-sm mx-auto leading-relaxed">
                Thank you for contacting ARX IT CLUB. An officer or instructor will review your note at the next lab session.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', contactInfo: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer"
                >
                  Send Another Note
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono">
                Send a Direct Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                    Contact Email or Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. student@school.edu or +251..."
                    value={form.contactInfo}
                    onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Subject
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Curriculum & Prerequisites">Curriculum & Prerequisites</option>
                  <option value="Membership & Registration">Membership & Registration</option>
                  <option value="Hackathons & Competitions">Hackathons & Competitions</option>
                  <option value="Technical Project Proposal">Technical Project Proposal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Message / Question
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what you'd like to ask or share with the club officers..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs active:scale-95 flex items-center justify-center gap-2"
              >
                <Icon name="Send" className="w-3.5 h-3.5" />
                <span>{loading ? 'Transmitting...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
              Meeting Location
            </h3>
            <div className="space-y-3 text-xs text-[#282828]/70 dark:text-white">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center shrink-0">
                  <Icon name="MapPin" className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-[#282828] dark:text-white font-semibold">Computer Lab 3</strong>
                  <span>Highschool Campus Building, Second Floor</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#15362B] text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon name="Clock" className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-[#282828] dark:text-white font-semibold">Weekly Schedule</strong>
                  <span>Monday to Tuesday · 3:30 PM – 5:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
              Live Telegram Dispatch
            </h3>
            <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Connect directly with our automated telegram bot or join our public updates channel for instant workshop announcements.
            </p>
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <a
                href="https://t.me/ARXITCLUB_bot"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-[#15362B] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 transition-colors"
              >
                <Icon name="Bot" className="w-3.5 h-3.5" />
                <span>@ARXITCLUB_bot</span>
              </a>
              <a
                href="https://t.me/arxitclub"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-[#15362B] text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/60 hover:bg-cyan-100 transition-colors"
              >
                <Icon name="Send" className="w-3.5 h-3.5" />
                <span>@arxitclub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
