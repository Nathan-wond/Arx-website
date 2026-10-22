-- ============================================================================
-- ARX IT CLUB OF SJS — Neon PostgreSQL Initial Database Schema Migration
-- Migration: 001_initial_neon_schema.sql
-- Compatibility: PostgreSQL 14+, Neon Serverless PostgreSQL
-- Description: Creates all relational tables, indexes, constraints, and audit
--              structures for ARX IT Club management and attendance systems.
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Club Global Settings & Key-Value Configuration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Members & Authentication Accounts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_members (
    id VARCHAR(64) PRIMARY KEY,
    member_id VARCHAR(32) UNIQUE NOT NULL,
    student_name VARCHAR(120) NOT NULL,
    first_name VARCHAR(60),
    second_name VARCHAR(60),
    last_name VARCHAR(60),
    student_class VARCHAR(20) NOT NULL,
    phone_number VARCHAR(30) UNIQUE,
    email VARCHAR(120),
    telegram_username VARCHAR(60),
    telegram_user_id BIGINT UNIQUE,
    telegram_activated BOOLEAN DEFAULT FALSE,
    telegram_linked_at TIMESTAMPTZ,
    role VARCHAR(30) NOT NULL DEFAULT 'member', -- 'member', 'admin', 'president'
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'active', 'rejected', 'suspended'
    is_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(64),
    must_change_password BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    award TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arx_members_role ON arx_members(role);
CREATE INDEX IF NOT EXISTS idx_arx_members_status ON arx_members(status);
CREATE INDEX IF NOT EXISTS idx_arx_members_tg_user ON arx_members(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_arx_members_phone ON arx_members(phone_number);

-- ----------------------------------------------------------------------------
-- 3. Course Tracks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_courses (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    description TEXT,
    duration VARCHAR(50),
    prerequisites TEXT,
    status VARCHAR(30) DEFAULT 'Available',
    is_published BOOLEAN DEFAULT TRUE,
    is_available_for_registration BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 4. Course Enrollments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_enrollments (
    id VARCHAR(64) PRIMARY KEY,
    member_id VARCHAR(64) REFERENCES arx_members(id) ON DELETE CASCADE,
    student_name VARCHAR(120),
    course_id VARCHAR(64) REFERENCES arx_courses(id) ON DELETE CASCADE,
    course_title VARCHAR(150),
    progress INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'In Progress',
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arx_enrollments_member ON arx_enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_arx_enrollments_course ON arx_enrollments(course_id);

-- ----------------------------------------------------------------------------
-- 5. Attendance Sessions (Strict Ethiopian Afternoon Clock Conventions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_attendance_sessions (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64),
    course_title VARCHAR(150),
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    
    -- Ethiopian Clock Conventions (Authoritative: Africa/Addis_Ababa)
    ethiopian_open_time VARCHAR(10) DEFAULT '7:00',
    ethiopian_present_cutoff VARCHAR(10) DEFAULT '7:30',
    ethiopian_late_cutoff VARCHAR(10) DEFAULT '7:40',
    
    -- International EAT Timestamps (UTC+3)
    international_open_time VARCHAR(10) DEFAULT '13:00',
    international_present_cutoff VARCHAR(10) DEFAULT '13:30',
    international_late_cutoff VARCHAR(10) DEFAULT '13:40',
    
    status VARCHAR(30) DEFAULT 'published', -- 'draft', 'published', 'closed', 'finalized'
    created_by VARCHAR(64),
    finalized_by VARCHAR(64),
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arx_att_sess_date ON arx_attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_arx_att_sess_status ON arx_attendance_sessions(status);

-- ----------------------------------------------------------------------------
-- 6. Attendance Records & Submissions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES arx_attendance_sessions(id) ON DELETE CASCADE,
    session_title VARCHAR(200),
    course_id VARCHAR(64),
    course_title VARCHAR(150),
    date DATE NOT NULL,
    
    user_id VARCHAR(64) REFERENCES arx_members(id) ON DELETE CASCADE,
    member_id VARCHAR(32) NOT NULL,
    student_name VARCHAR(120) NOT NULL,
    
    status VARCHAR(30) NOT NULL, -- 'Present', 'Late', 'Absent', 'Excused'
    review_status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    submission_timestamp_utc TIMESTAMPTZ,
    ethiopian_time_label VARCHAR(100),
    
    verified_by VARCHAR(64),
    verified_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT uq_session_member UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_arx_att_rec_user ON arx_attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_arx_att_rec_session ON arx_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_arx_att_rec_status ON arx_attendance_records(status);

-- ----------------------------------------------------------------------------
-- 7. Verified Certificates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_certificates (
    id VARCHAR(64) PRIMARY KEY,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(120) NOT NULL,
    member_id VARCHAR(32) NOT NULL,
    course_id VARCHAR(64),
    course_title VARCHAR(150) NOT NULL,
    grade VARCHAR(20),
    issue_date VARCHAR(30),
    instructor VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    qr_code_data TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arx_cert_certid ON arx_certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_arx_cert_memberid ON arx_certificates(member_id);

-- ----------------------------------------------------------------------------
-- 8. Official Announcements & Channel Broadcasts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) DEFAULT 'Club Administration',
    published_date VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    pinned BOOLEAN DEFAULT FALSE,
    target_audience VARCHAR(50) DEFAULT 'All Members',
    telegram_message_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 9. Media Assets Management (Logos, Hero Banners, Team Photos, Badges)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_media_assets (
    id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    category VARCHAR(60) NOT NULL, -- 'logo', 'banner', 'team', 'badge', 'award'
    mime_type VARCHAR(100),
    file_size INT,
    url VARCHAR(500) NOT NULL,
    storage_path VARCHAR(500),
    alt_text VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arx_media_category ON arx_media_assets(category);

-- ----------------------------------------------------------------------------
-- 10. Configurable Telegram Bot Commands
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_bot_commands (
    command VARCHAR(50) PRIMARY KEY,
    description TEXT,
    category VARCHAR(50) DEFAULT 'General',
    is_enabled BOOLEAN DEFAULT TRUE,
    custom_reply TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. Presidential Executive Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arx_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    target_name VARCHAR(150),
    details TEXT,
    performed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arx_audit_time ON arx_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_arx_audit_action ON arx_audit_logs(action);
