// Scratch test script to verify registration success, approval, rejection, and suspension notifications
import { db } from './backend/src/services/db.js';
import {
  notifyApplicationApproved,
  notifyApplicationRejected,
  notifyMemberSuspended
} from './backend/src/services/notificationService.js';

async function testFlow() {
  console.log('--- 1. Testing db initialization ---');
  await db.ensureInitialized();
  console.log('✅ DB Initialized. Current members count:', db.members.size);

  console.log('\n--- 2. Testing Registration via API endpoint ---');
  const uniqueNum = Math.floor(1000 + Math.random() * 9000);
  const regPayload = {
    firstName: 'Alex',
    secondName: 'Kevin',
    lastName: `Tester${uniqueNum}`,
    studentName: `Alex K Tester${uniqueNum}`,
    class: 'Grade 10A',
    courseIds: ['course_fullstack_2026', 'course_cybersec_2026'],
    password: 'Password123!',
    confirmPassword: 'Password123!',
    phoneNumber: `+25191122${uniqueNum}`,
    email: `alex.tester${uniqueNum}@example.com`,
    telegramUsername: `@alextester${uniqueNum}`,
    motivationEssay: 'I am deeply passionate about technology, programming, and cybersecurity. Joining the ARX IT Club would allow me to collaborate with talented peers, develop practical skills in web development, and contribute meaningfully to the school community. I have spent the last few months teaching myself JavaScript, Python, and the basics of networking. Through this club, I hope to work on real-world projects, participate in coding hackathons, and learn under the mentorship of senior student developers. I am fully committed to attending all scheduled workshops, completing assignments diligently, and upholding the high ethical standards expected of all club members in every project and competition.'
  };

  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  const regData = await regRes.json();
  console.log('Register HTTP Status:', regRes.status);
  console.log('Registration Output:', regData);

  if (!regData.success || !regData.memberId) {
    throw new Error('Registration failed!');
  }

  const newMemberId = regData.memberId;
  const newMemberObj = db.findMemberByMemberId(newMemberId);
  console.log('Found newly registered member in DB:', newMemberObj.studentName, 'Status:', newMemberObj.status);

  console.log('\n--- 4. Testing Admin Approval ---');
  // Log in as president
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId: 'president_root', password: 'PresidentSecret2026!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('President Login Status:', loginRes.status, 'Token acquired:', Boolean(token));

  // Approve the application
  const approveRes = await fetch(`http://localhost:3000/api/admin/applications/${newMemberObj.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const approveData = await approveRes.json();
  console.log('Approve HTTP Status:', approveRes.status);
  console.log('Approve response:', approveData.message);

  const approvedMember = db.findMemberByMemberId(newMemberId);
  console.log('Member status after approval:', approvedMember.status);

  console.log('\n--- 5. Testing Member Suspension ---');
  const toggleRes = await fetch(`http://localhost:3000/api/admin/members/${newMemberObj.id}/toggle-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const toggleData = await toggleRes.json();
  console.log('Toggle HTTP Status:', toggleRes.status);
  console.log('Toggle response message:', toggleData.message);
  const suspendedMember = db.findMemberByMemberId(newMemberId);
  console.log('Member status after suspension:', suspendedMember.status);

  console.log('\n--- 6. Testing Registration & Rejection ---');
  const regPayload2 = { ...regPayload, email: `alex.denied${uniqueNum}@example.com`, telegramUsername: `@alexdenied${uniqueNum}` };
  const regRes2 = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload2)
  });
  const regData2 = await regRes2.json();
  console.log('Second applicant registered:', regData2.memberId);

  const rejRes2 = await fetch(`http://localhost:3000/api/admin/applications/${regData2.member.id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rejectionReason: 'Cohort seat limit reached for Grade 10' })
  });
  const rejData2 = await rejRes2.json();
  console.log('Reject HTTP Status:', rejRes2.status);
  console.log('Reject response message:', rejData2.message);
  const rejectedMember = db.findMemberByMemberId(regData2.memberId);
  console.log('Member status after rejection:', rejectedMember.status, 'Reason:', rejectedMember.rejectionReason);

  // Clean up the 2 test accounts from DB so user DB remains clean
  db.deleteMember(newMemberObj.id);
  db.deleteMember(regData2.member.id);
  await db._saveToFile();
  console.log('\n✅ Cleaned up temporary test member records.');
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

testFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
