/**
 * Ethiopian Clock System & Timezone Utilities
 * Authoritative Timezone: Africa/Addis_Ababa (UTC+3, East Africa Time - EAT)
 * 
 * Ethiopian Clock Convention:
 * - Daytime begins at sunrise (~06:00 international time = 12:00 dawn Ethiopian time).
 * - Ethiopian 1:00 Morning  = 07:00 International
 * - Ethiopian 6:00 Midday   = 12:00 International
 * - Ethiopian 7:00 Afternoon = 13:00 International (1:00 PM)
 * - Ethiopian 7:30 Afternoon = 13:30 International (1:30 PM)
 * - Ethiopian 7:40 Afternoon = 13:40 International (1:40 PM)
 * - Ethiopian 8:00 Afternoon = 14:00 International (2:00 PM)
 */

export const ADDIS_ABABA_TIMEZONE = 'Africa/Addis_Ababa';

/**
 * Returns the current Date/time in Africa/Addis_Ababa timezone components.
 * Independent of server host machine timezone.
 */
export function getAddisAbabaNow(customDate = new Date()) {
  let dateObj;
  if (!customDate || (typeof customDate === 'object' && !(customDate instanceof Date))) {
    dateObj = new Date();
  } else {
    dateObj = (typeof customDate === 'string' || typeof customDate === 'number') ? new Date(customDate) : customDate;
  }
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  
  // Format to Africa/Addis_Ababa parts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ADDIS_ABABA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(dateObj);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const second = parseInt(partMap.second, 10);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  const totalMinutes = hour * 60 + minute;
  const totalSeconds = totalMinutes * 60 + second;

  return {
    dateObj,
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr,
    timeStr,
    totalMinutes,
    totalSeconds
  };
}

/**
 * Converts an Ethiopian clock time string ("07:00", "7:30", "7:40") to international 24h format ("13:00", "13:30", "13:40").
 * @param {string} ethTime - Ethiopian time string (e.g. "07:00", "7:30", "7:40", "01:00")
 * @param {string} cycle - 'afternoon' | 'day' | 'night' (defaults to 'afternoon' for club schedule)
 * @returns {string} 24h international format "HH:MM"
 */
export function ethiopianToInternationalTime(ethTime, cycle = 'afternoon') {
  if (!ethTime || typeof ethTime !== 'string') return '13:00';
  const clean = ethTime.trim();
  const [hStr, mStr = '00'] = clean.split(':');
  const ethHour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10) || 0;

  if (isNaN(ethHour) || ethHour < 1 || ethHour > 12) {
    throw new Error(`Invalid Ethiopian hour "${ethTime}". Hour must be between 1 and 12.`);
  }

  // Afternoon / Day conversion:
  // In Ethiopian afternoon convention:
  // 6:00 is midday 12:00
  // 7:00 is 13:00 (1:00 PM)
  // 8:00 is 14:00 (2:00 PM)
  // 1:00 is 07:00 (morning) or 19:00 (evening)
  let internationalHour;
  if (cycle === 'afternoon') {
    // 1 to 5 afternoon -> 13:00 to 17:00 if 7 is 13:00?
    // In standard Ethiopian clock: 1:00 is 7:00am, 6:00 is 12:00pm, 7:00 is 1:00pm (13:00), 12:00 is 6:00pm (18:00)
    // Formula: (ethHour + 6) % 24
    internationalHour = (ethHour + 6) % 24;
    // For afternoon (1:00 PM - 6:00 PM), hours 7 to 12 correspond to 13:00 to 18:00
    if (ethHour >= 7 && ethHour <= 12) {
      internationalHour = ethHour + 6; // 7 -> 13, 8 -> 14, 12 -> 18
    } else {
      // 1:00 to 6:00 morning vs evening
      internationalHour = ethHour + 6; // 1 -> 7, 6 -> 12
    }
  } else if (cycle === 'night' || cycle === 'evening') {
    internationalHour = (ethHour + 18) % 24;
  } else {
    // default daytime formula
    internationalHour = (ethHour + 6) % 24;
  }

  return `${String(internationalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Converts international 24h time ("13:00", "13:30", "13:40") to Ethiopian clock format ("7:00", "7:30", "7:40").
 * @param {string} intlTime - International 24h format "HH:MM" or "HH:MM:SS"
 * @returns {{ ethiopianTime: string, period: string, formatted: string, internationalFormatted: string }}
 */
export function internationalToEthiopianTime(intlTime) {
  if (!intlTime || typeof intlTime !== 'string') {
    return {
      ethiopianTime: '7:00',
      period: 'Afternoon',
      formatted: '7:00 Ethiopian time (1:00 PM international time)',
      internationalFormatted: '1:00 PM'
    };
  }

  const [hStr, mStr = '00'] = intlTime.trim().split(':');
  const intlHour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10) || 0;

  // Ethiopian daytime runs from 06:00 to 18:00
  // Ethiopian nighttime runs from 18:00 to 06:00
  let ethHour;
  let period;

  if (intlHour >= 6 && intlHour < 12) {
    ethHour = intlHour - 6;
    period = 'Morning';
  } else if (intlHour === 12) {
    ethHour = 6;
    period = 'Midday';
  } else if (intlHour >= 13 && intlHour < 18) {
    ethHour = intlHour - 6; // 13 -> 7, 14 -> 8, 17 -> 11
    period = 'Afternoon';
  } else if (intlHour === 18) {
    ethHour = 12;
    period = 'Dusk';
  } else if (intlHour > 18 && intlHour <= 23) {
    ethHour = intlHour - 18;
    period = 'Evening / Night';
  } else {
    // 00:00 to 05:59
    ethHour = intlHour + 6;
    period = 'Midnight / Pre-dawn';
  }

  const paddedMin = String(minute).padStart(2, '0');
  const ethTimeStr = `${ethHour}:${paddedMin}`;

  // Format 12-hour international time for dual display
  const intl12Hour = intlHour % 12 || 12;
  const ampm = intlHour >= 12 ? 'PM' : 'AM';
  const intl12Formatted = `${intl12Hour}:${paddedMin} ${ampm}`;

  return {
    ethiopianTime: ethTimeStr,
    ethHour,
    minute,
    period,
    formatted: `${ethTimeStr} Ethiopian time (${intl12Formatted} international time)`,
    internationalFormatted: intl12Formatted
  };
}

/**
 * Evaluates the strict attendance schedule boundaries for a session at a given server timestamp.
 * 
 * Schedule:
 * - Before 7:00 Ethiopian (Before 13:00 EAT): Form closed / not yet open
 * - 7:00 to < 7:30 Ethiopian (13:00:00 to 13:29:59 EAT): OPEN -> provisional "Present"
 * - 7:30 to < 7:40 Ethiopian (13:30:00 to 13:39:59 EAT): OPEN -> provisional "Late"
 * - At 7:40 Ethiopian and afterward (13:40:00 EAT onward): CLOSED -> ordinary submissions rejected
 * 
 * @param {object} session - Attendance session object
 * @param {Date|string} [referenceTime] - Optional reference time for testing, defaults to current Addis Ababa time
 * @returns {object} Window calculation results
 */
export function evaluateSessionWindow(session, referenceTime = new Date()) {
  const addis = getAddisAbabaNow(referenceTime);
  const sessionDateStr = session.date; // "YYYY-MM-DD"
  const isToday = addis.dateStr === sessionDateStr;

  // Session opening and cutoff times in international EAT 24h minutes
  // Default session hours: open at 13:00 (7:00 Eth), presentCutoff at 13:30 (7:30 Eth), lateCutoff at 13:40 (7:40 Eth)
  const openTime = session.internationalOpenTime || ethiopianToInternationalTime(session.ethiopianOpenTime || '07:00', 'afternoon');
  const presentCutoff = session.internationalPresentCutoff || ethiopianToInternationalTime(session.ethiopianPresentCutoff || '07:30', 'afternoon');
  const lateCutoff = session.internationalLateCutoff || ethiopianToInternationalTime(session.ethiopianLateCutoff || '07:40', 'afternoon');

  const [openH, openM] = openTime.split(':').map(Number);
  const [presH, presM] = presentCutoff.split(':').map(Number);
  const [lateH, lateM] = lateCutoff.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const presentCutoffMinutes = presH * 60 + presM;
  const lateCutoffMinutes = lateH * 60 + lateM;

  const currentMinutes = addis.hour * 60 + addis.minute;
  const currentTotalSeconds = addis.totalSeconds;
  const openTotalSeconds = openMinutes * 60;
  const presentCutoffSeconds = presentCutoffMinutes * 60;
  const lateCutoffSeconds = lateCutoffMinutes * 60;

  // Compare dates first
  if (addis.dateStr < sessionDateStr) {
    return {
      isOpen: false,
      isUpcoming: true,
      isClosed: false,
      canSubmit: false,
      canFinalizeAbsence: false,
      state: 'upcoming',
      message: `Session is scheduled for ${sessionDateStr}. Opens at ${session.ethiopianOpenTime || '7:00'} Ethiopian time (1:00 PM EAT).`,
      provisionalClassification: null,
      serverTimeAddis: addis
    };
  }

  if (addis.dateStr > sessionDateStr) {
    return {
      isOpen: false,
      isUpcoming: false,
      isClosed: true,
      canSubmit: false,
      canFinalizeAbsence: true,
      state: 'closed',
      message: `This session occurred on ${sessionDateStr} and is now closed.`,
      provisionalClassification: null,
      serverTimeAddis: addis
    };
  }

  // Same day: evaluate exact seconds/minutes
  if (currentTotalSeconds < openTotalSeconds) {
    const diffSecs = openTotalSeconds - currentTotalSeconds;
    const diffMins = Math.ceil(diffSecs / 60);
    return {
      isOpen: false,
      isUpcoming: true,
      isClosed: false,
      canSubmit: false,
      canFinalizeAbsence: false,
      state: 'upcoming',
      message: `Attendance is not open yet. It opens promptly at ${session.ethiopianOpenTime || '7:00'} Ethiopian time (${openTime} international time, in ~${diffMins} min).`,
      provisionalClassification: null,
      serverTimeAddis: addis
    };
  }

  if (currentTotalSeconds >= openTotalSeconds && currentTotalSeconds < presentCutoffSeconds) {
    return {
      isOpen: true,
      isUpcoming: false,
      isClosed: false,
      canSubmit: true,
      canFinalizeAbsence: false,
      state: 'open_present',
      provisionalClassification: 'Present',
      message: `Attendance is OPEN. Submissions received right now receive provisional Present status. (On-time window closes at ${session.ethiopianPresentCutoff || '7:30'} Ethiopian time).`,
      serverTimeAddis: addis
    };
  }

  if (currentTotalSeconds >= presentCutoffSeconds && currentTotalSeconds < lateCutoffSeconds) {
    return {
      isOpen: true,
      isUpcoming: false,
      isClosed: false,
      canSubmit: true,
      canFinalizeAbsence: false,
      state: 'open_late',
      provisionalClassification: 'Late',
      message: `Attendance is in LATE WINDOW. Submissions received right now receive provisional Late status. Session closes permanently at ${session.ethiopianLateCutoff || '7:40'} Ethiopian time.`,
      serverTimeAddis: addis
    };
  }

  // At or after closing cutoff
  return {
    isOpen: false,
    isUpcoming: false,
    isClosed: true,
    canSubmit: false,
    canFinalizeAbsence: true,
    state: 'closed',
    provisionalClassification: null,
    message: `Attendance window closed at ${session.ethiopianLateCutoff || '7:40'} Ethiopian time (${lateCutoff} international time). No further submissions are accepted.`,
    serverTimeAddis: addis
  };
}
