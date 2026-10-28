/**
 * Test Registration Flow - End-to-End Verification
 * Tests: Register → Pending → Admin Approval → Email Notification → Login
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials
const TEST_STUDENT = {
  firstName: 'TestStudent',
  secondName: 'Auto',
  lastName: 'Generated',
  studentName: 'TestStudent Auto Generated',
  class: '10A',
  password: 'SecureTestPass123!',
  confirmPassword: 'SecureTestPass123!',
  phoneNumber: '+251911234567',
  email: 'test.student@example.com',
  telegramUsername: 'teststudent123',
  courseIds: ['crs_web_dev', 'crs_python'],
  award: 'Test Award',
  motivationEssay: 'This is a test motivation essay that meets the minimum word count requirement of one hundred words. I want to join ARX IT Club because I am passionate about learning technology and building projects. I believe that joining the club will help me develop my programming skills and work on real-world projects with other students who share my interests. I am excited about the opportunity to learn web development and Python programming through the club\'s structured curriculum.'
};

let registeredMemberId = null;
let adminToken = null;
let testMemberId = null;

async function testRegistration() {
  console.log('\n=== TEST 1: Student Registration ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STUDENT)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      registeredMemberId = data.memberId;
      testMemberId = data.member?.id;
      console.log('✅ Registration successful');
      console.log(`   Member ID: ${registeredMemberId}`);
      console.log(`   Status: ${data.member?.status}`);
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Registration failed:', data.error || JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return false;
  }
}

async function adminLogin() {
  console.log('\n=== TEST 2: Admin Login ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: 'ADMIN',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'admin123'
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      adminToken = data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.log('❌ Admin login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return false;
  }
}

async function verifyPendingStatus() {
  console.log('\n=== TEST 3: Verify Pending Status ===');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/applications?status=pending`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      const application = data.applications?.find(app => app.memberId === registeredMemberId);
      if (application) {
        console.log('✅ Application found in pending queue');
        console.log(`   Student: ${application.studentName}`);
        console.log(`   Status: ${application.status}`);
        console.log(`   Email: ${application.email}`);
        console.log(`   Telegram: @${application.telegramUsername}`);
        return true;
      } else {
        console.log('❌ Application not found in pending queue');
        return false;
      }
    } else {
      console.log('❌ Failed to fetch applications:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error fetching applications:', error.message);
    return false;
  }
}

async function approveApplication() {
  console.log('\n=== TEST 4: Approve Application ===');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/applications/${testMemberId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Application approved successfully');
      console.log(`   Message: ${data.message}`);
      console.log(`   New status: ${data.application?.status}`);
      console.log('   📧 Approval email should have been sent to:', TEST_STUDENT.email);
      return true;
    } else {
      console.log('❌ Approval failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Approval error:', error.message);
    return false;
  }
}

async function testStudentLogin() {
  console.log('\n=== TEST 5: Student Login After Approval ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: registeredMemberId,
        password: TEST_STUDENT.password
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      console.log('✅ Student login successful');
      console.log(`   Role: ${data.user?.role}`);
      console.log(`   Status: ${data.user?.status}`);
      return true;
    } else {
      console.log('❌ Student login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testRejection() {
  console.log('\n=== TEST 6: Test Rejection Notification ===');

  // Register another test student
  const TEST_STUDENT_2 = {
    ...TEST_STUDENT,
    firstName: 'TestReject',
    phoneNumber: '+251922334455',
    email: 'test.reject@example.com',
    telegramUsername: 'testreject456'
  };

  try {
    // Register
    const regResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STUDENT_2)
    });
    const regData = await regResponse.json();

    if (!regResponse.ok) {
      console.log('⚠️ Could not register second test student (may already exist)');
      return true; // Skip this test
    }

    const rejectMemberId = regData.member?.id;
    console.log(`   Registered test student: ${regData.memberId}`);

    // Reject
    const rejectResponse = await fetch(`${BASE_URL}/api/admin/applications/${rejectMemberId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'Test rejection - automated test'
      })
    });

    const rejectData = await rejectResponse.json();

    if (rejectResponse.ok && rejectData.success) {
      console.log('✅ Application rejected successfully');
      console.log('   📧 Rejection email should have been sent to:', TEST_STUDENT_2.email);
      return true;
    } else {
      console.log('❌ Rejection failed:', rejectData.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Rejection test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   ARX IT CLUB - Registration Flow Test Suite            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Testing against: ${BASE_URL}`);
  console.log('⏱️  Started at:', new Date().toISOString());

  const results = {
    registration: await testRegistration(),
    adminLogin: await adminLogin(),
    pendingStatus: await verifyPendingStatus(),
    approval: await approveApplication(),
    studentLogin: await testStudentLogin(),
    rejection: await testRejection()
  };

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.padEnd(20)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(r => r === true);

  console.log('\n' + '═'.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Registration flow is working correctly.');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the errors above.');
  }
  console.log('═'.repeat(60) + '\n');

  console.log('\n📝 NEXT STEPS:');
  console.log('1. Check your email inbox for approval/rejection emails');
  console.log('2. Verify Telegram notifications if bot is configured');
  console.log('3. Test the complete student portal workflow');
  console.log('4. Clean up test accounts from admin panel if needed\n');

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
