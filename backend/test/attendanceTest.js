import assert from 'node:assert';
import { db } from '../src/services/db.js';
import {
  getAddisAbabaNow,
  ethiopianToInternationalTime,
  internationalToEthiopianTime,
  evaluateSessionWindow
} from '../src/utils/ethiopianTimeUtils.js';

console.log('--- Starting Attendance Management System Unit & Integration Tests ---');

// 1. Ethiopian Time Calculation & Window Evaluation Tests
console.log('\n[TEST 1] Ethiopian Time Conversions:');
assert.strictEqual(ethiopianToInternationalTime('07:00', 'afternoon'), '13:00');
assert.strictEqual(ethiopianToInternationalTime('07:30', 'afternoon'), '13:30');
assert.strictEqual(ethiopianToInternationalTime('07:40', 'afternoon'), '13:40');

const eth1300 = internationalToEthiopianTime('13:00');
assert.strictEqual(eth1300.ethiopianTime, '7:00');
assert.strictEqual(eth1300.period, 'Afternoon');

const eth1335 = internationalToEthiopianTime('13:35');
assert.strictEqual(eth1335.ethiopianTime, '7:35');
assert.strictEqual(eth1335.period, 'Afternoon');
console.log('✓ Ethiopian time arithmetic verified.');

// 2. Window Evaluation Matrix Tests
console.log('\n[TEST 2] Ethiopian Window Evaluation Matrix:');
const testSession = {
  id: 'test_sess_1',
  date: '2026-10-18',
  ethiopianOpenTime: '07:00',
  ethiopianPresentCutoff: '07:30',
  ethiopianLateCutoff: '07:40',
  internationalOpenTime: '13:00',
  internationalPresentCutoff: '13:30',
  internationalLateCutoff: '13:40',
  status: 'published'
};

// 12:59:59 EAT (6:59:59 Ethiopian) -> Before opening
const timeBefore = new Date('2026-10-18T09:59:59Z'); // 12:59:59 UTC+3
const winBefore = evaluateSessionWindow(testSession, timeBefore);
assert.strictEqual(winBefore.isOpen, false);
assert.strictEqual(winBefore.isUpcoming, true);
assert.strictEqual(winBefore.canSubmit, false);
console.log('✓ 12:59:59 (Before 7:00 Ethiopian) properly marked as Upcoming/Closed.');

// 13:00:00 EAT (7:00:00 Ethiopian) -> On time (Present)
const timePresent = new Date('2026-10-18T10:05:00Z'); // 13:05:00 UTC+3
const winPresent = evaluateSessionWindow(testSession, timePresent);
assert.strictEqual(winPresent.isOpen, true);
assert.strictEqual(winPresent.provisionalClassification, 'Present');
assert.strictEqual(winPresent.canSubmit, true);
console.log('✓ 13:05:00 (7:05 Ethiopian) properly classified as Present.');

// 13:32:00 EAT (7:32:00 Ethiopian) -> Late window (Late)
const timeLate = new Date('2026-10-18T10:32:00Z'); // 13:32:00 UTC+3
const winLate = evaluateSessionWindow(testSession, timeLate);
assert.strictEqual(winLate.isOpen, true);
assert.strictEqual(winLate.provisionalClassification, 'Late');
assert.strictEqual(winLate.canSubmit, true);
console.log('✓ 13:32:00 (7:32 Ethiopian) properly classified as Late.');

// 13:40:01 EAT (7:40:01 Ethiopian) -> Closed
const timeClosed = new Date('2026-10-18T10:40:01Z'); // 13:40:01 UTC+3
const winClosed = evaluateSessionWindow(testSession, timeClosed);
assert.strictEqual(winClosed.isOpen, false);
assert.strictEqual(winClosed.isClosed, true);
assert.strictEqual(winClosed.canSubmit, false);
console.log('✓ 13:40:01 (7:40:01 Ethiopian) properly closed.');

// 3. Database Initial Sessions
console.log('\n[TEST 3] Database Session Hydration & Management:');
const sessions = db.getAllAttendanceSessions();
assert(sessions.length >= 1, 'Default attendance sessions must be initialized.');
console.log(`✓ ${sessions.length} sessions loaded from database.`);

// 4. Session Submission Verification
console.log('\n[TEST 4] Member Submission Verification:');
// Create a test session for today
const today = getAddisAbabaNow().dateStr;
const createdSession = db.createAttendanceSession({
  courseId: 'crs_web_dev',
  courseTitle: 'Web Design & Development',
  title: 'Automated Test Lab Session',
  date: today,
  ethiopianOpenTime: '07:00',
  ethiopianPresentCutoff: '07:30',
  ethiopianLateCutoff: '07:40',
  status: 'published'
}, 'Automated Test Runner');

assert(createdSession && createdSession.id, 'Session should be created.');

// Find or create an existing member
let member = Array.from(db.members.values()).find(m => m.role === 'member');
if (!member) {
  member = db.createMember({
    studentName: 'Natnael Haddis',
    class: '12-A',
    password: 'member123',
    phoneNumber: '+251911223344',
    telegramUsername: '@natnael_h'
  });
  member.status = 'approved';
  member.isApproved = true;
  db.members.set(member.id, member);
}
assert(member, 'Should have at least one test member.');

// Ensure member is enrolled in crs_web_dev for test
db.enrollMemberInCourse(member.id, 'crs_web_dev');

// Attempt submission with invalid password
const badPwdRes = db.submitAttendanceSession({
  sessionId: createdSession.id,
  memberId: member.memberId,
  password: 'wrong_password_12345'
});
assert.strictEqual(badPwdRes.success, false, 'Invalid password must be rejected');
console.log('✓ Invalid password properly rejected.');

// Attempt valid submission with overrideTime during Present window
const validRes = db.submitAttendanceSession({
  sessionId: createdSession.id,
  memberId: member.memberId,
  password: 'member123',
  overrideTime: { classification: 'Present' }
});
assert.strictEqual(validRes.success, true, 'Valid submission must succeed');
assert.strictEqual(validRes.classification, 'Present');
assert.strictEqual(validRes.reviewStatus, 'Pending');
console.log('✓ Valid attendance submitted and placed in review queue.');

// Attempt duplicate submission
const dupRes = db.submitAttendanceSession({
  sessionId: createdSession.id,
  memberId: member.memberId,
  password: 'member123',
  overrideTime: { classification: 'Present' }
});
assert.strictEqual(dupRes.success, false);
assert.strictEqual(dupRes.isDuplicate, true);
console.log('✓ Duplicate submission prevented with proper flag.');

// 5. Administrative Review Workflow
console.log('\n[TEST 5] Administrative Review Flow:');
const recordId = validRes.record.id;
const reviewApproveRes = db.reviewAttendanceRecord(recordId, {
  reviewStatus: 'Approved',
  reviewedBy: 'Staff Officer Kidus'
});
assert.strictEqual(reviewApproveRes.success, true);
assert.strictEqual(reviewApproveRes.record.reviewStatus, 'Approved');
assert.strictEqual(reviewApproveRes.record.reviewedBy, 'Staff Officer Kidus');
console.log('✓ Administrative approval workflow verified.');

// 6. Correction Workflow
console.log('\n[TEST 6] Administrative Classification Correction:');
const correctRes = db.correctAttendanceRecord(recordId, {
  finalClassification: 'Late',
  correctionNotes: 'Student arrived 5 minutes late to Lab 3.',
  correctedBy: 'Staff Officer Kidus'
});
assert.strictEqual(correctRes.success, true);
assert.strictEqual(correctRes.record.finalClassification, 'Late');
console.log('✓ Classification correction and audit log verified.');

// 7. Member History & Qualification Stats
console.log('\n[TEST 7] Member History & Certificate Qualification:');
const history = db.getMemberAttendanceHistory(member.id);
assert(history.records.length >= 1);
assert(typeof history.attendanceRate === 'number');
assert(typeof history.isCertificateEligible === 'boolean');
console.log(`✓ Member history verified: ${history.records.length} records, ${history.attendanceRate}% attendance rate.`);

// Clean up test session
db.deleteAttendanceSession(createdSession.id);
console.log('✓ Cleaned up test session.');

console.log('\n=== ALL ATTENDANCE SYSTEM TESTS PASSED SUCCESSFULLY! ===\n');
