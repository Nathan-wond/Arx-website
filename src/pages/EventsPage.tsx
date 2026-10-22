import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

export const EventsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAuthenticated, member } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEvents = async (status = selectedStatus) => {
    setLoading(true);
    try {
      const res = await api.getEvents(status);
      if (res?.events) setEvents(res.events);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(selectedStatus);
  }, [selectedStatus]);

  const handleRegister = async (event: any) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setRegisteringId(event.id);
    setErrorMessage(null);

    try {
      const res = await api.registerEvent(event.id, member?.id);
      setToastMessage(res.message || `Successfully registered for ${event.title}!`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchEvents(selectedStatus);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
            WORKSHOPS & HACKATHONS
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans mt-1">
            Club Events & Sessions
          </h1>
          <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white mt-1">
            Participate in interactive technical lectures, hackathons, robotics test flights, and peer demo days.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EFE6DE]/60 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] w-fit">
          <button
            onClick={() => setSelectedStatus('Upcoming')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
              selectedStatus === 'Upcoming'
                ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-white font-semibold shadow-xs'
                : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setSelectedStatus('Past')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
              selectedStatus === 'Past'
                ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-white font-semibold shadow-xs'
                : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
            }`}
          >
            Past Archive
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] text-xs flex items-center gap-2">
          <Icon name="CheckCircle" className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-[#25473C] text-xs flex items-center gap-2">
          <Icon name="AlertCircle" className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#282828]/50 dark:text-white space-y-2">
          <div className="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Loading events schedule...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2">
          <Icon name="Calendar" className="w-8 h-8 text-[#282828]/40 dark:text-white mx-auto" />
          <h3 className="text-sm font-semibold text-[#282828] dark:text-white">
            {selectedStatus === 'Upcoming' ? 'No upcoming events scheduled' : 'No past events in archive'}
          </h3>
          <p className="text-xs text-[#282828]/60 dark:text-white">
            New workshops, hackathons, and guest speaker sessions will be published here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const isRegistered = evt.attendees?.includes(member?.id);
            return (
              <div
                key={evt.id}
                className="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40">
                      <Icon name="Calendar" className="w-3.5 h-3.5" />
                      <span>{evt.date || 'TBA'}</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#282828]/60 dark:text-white">
                      {evt.time || '3:30 PM'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#282828] dark:text-white">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-[#282828]/70 dark:text-white line-clamp-3 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="space-y-1 text-xs text-[#282828]/70 dark:text-white pt-1">
                    <div className="flex items-center gap-1.5">
                      <Icon name="MapPin" className="w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]" />
                      <span>{evt.location || 'Computer Lab 3, Highschool'}</span>
                    </div>
                    {evt.instructor && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Icon name="User" className="w-3.5 h-3.5 text-[#282828]/50 dark:text-white" />
                        <span>Lead: {evt.instructor}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#282828]/60 dark:text-white">
                    {evt.attendees?.length || 0} registered
                  </span>

                  {selectedStatus === 'Upcoming' && (
                    isRegistered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-[#58B889]">
                        <Icon name="Check" className="w-3.5 h-3.5" />
                        <span>Registered</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegister(evt)}
                        disabled={registeringId === evt.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
                      >
                        {registeringId === evt.id ? 'Registering...' : 'RSVP / Register'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
