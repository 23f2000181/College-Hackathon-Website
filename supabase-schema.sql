-- ═══════════════════════════════════════════════
-- HackVerse — Database Schema + Seed Data
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- MIGRATION: Run these first if the tables already exist
-- (Safe to run even if academic_year column is not yet present)
-- ─────────────────────────────────────────────
-- ALTER TABLE teams
--   ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '3rd Year'
--     CHECK (academic_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year'));
--
-- ALTER TABLE mentor_assignments
--   ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '3rd Year'
--     CHECK (academic_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year'));
-- ─────────────────────────────────────────────

-- 1. Create Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_name TEXT NOT NULL,
  usn TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  department_label TEXT,
  academic_year TEXT NOT NULL DEFAULT '3rd Year'
    CHECK (academic_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  password TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_index INT NOT NULL
);

CREATE TABLE IF NOT EXISTS problem_statements (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  selected_by UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security + Public Access Policies
-- ─────────────────────────────────────────────

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "public_insert_teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_teams" ON teams FOR UPDATE USING (true);

CREATE POLICY "public_select_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "public_insert_members" ON team_members FOR INSERT WITH CHECK (true);

CREATE POLICY "public_select_ps" ON problem_statements FOR SELECT USING (true);
CREATE POLICY "public_insert_ps" ON problem_statements FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_ps" ON problem_statements FOR UPDATE USING (true);
CREATE POLICY "public_delete_ps" ON problem_statements FOR DELETE USING (true);


-- 3. Seed Problem Statements
-- ─────────────────────────────────────────────

-- CSE
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('cse-1', 'cse', 'Smart Campus Navigation System', 'Build an indoor navigation system for large campus buildings using BLE beacons and mobile devices.', 'Medium'),
  ('cse-2', 'cse', 'Automated Code Review Tool', 'Create an AI-powered tool that reviews code submissions and provides feedback on quality, security, and best practices.', 'Hard'),
  ('cse-3', 'cse', 'Real-time Collaborative Whiteboard', 'Develop a collaborative whiteboard application with real-time syncing, drawing tools, and session management.', 'Medium'),
  ('cse-4', 'cse', 'Student Attendance Tracker with Face Recognition', 'Build a system that uses facial recognition to automate classroom attendance tracking.', 'Hard'),
  ('cse-5', 'cse', 'Campus Lost & Found Platform', 'Create a web platform for students to report and find lost items within the campus.', 'Easy');

-- CSE - AIML
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('aiml-1', 'cse-aiml', 'Sentiment-Based News Aggregator', 'Build a news app that classifies articles by sentiment and filters by topic using NLP models.', 'Medium'),
  ('aiml-2', 'cse-aiml', 'Medical Image Diagnosis Assistant', 'Develop a CNN-based tool that assists doctors in diagnosing diseases from X-ray and MRI scans.', 'Hard'),
  ('aiml-3', 'cse-aiml', 'AI Chatbot for College Queries', 'Create an intelligent chatbot trained on college FAQs to help students with admissions, fees, and schedules.', 'Medium'),
  ('aiml-4', 'cse-aiml', 'Deepfake Detection System', 'Build a model that can detect manipulated images and videos with high accuracy.', 'Hard'),
  ('aiml-5', 'cse-aiml', 'Predictive Student Performance Model', 'Use ML to predict student academic performance based on historical data and behavioral patterns.', 'Easy');

-- CSE - DS
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('ds-1', 'cse-ds', 'Traffic Flow Prediction Dashboard', 'Analyze traffic data and build a dashboard that predicts congestion patterns using time-series models.', 'Medium'),
  ('ds-2', 'cse-ds', 'Social Media Trend Analyzer', 'Scrape and analyze social media data to identify trending topics and visualize sentiment shifts over time.', 'Medium'),
  ('ds-3', 'cse-ds', 'E-Commerce Recommendation Engine', 'Build a collaborative filtering recommendation system for an e-commerce platform with real-time suggestions.', 'Hard'),
  ('ds-4', 'cse-ds', 'COVID Data Visualization Portal', 'Create an interactive dashboard visualizing pandemic data with charts, maps, and statistical insights.', 'Easy'),
  ('ds-5', 'cse-ds', 'Anomaly Detection in Financial Transactions', 'Develop a system that detects fraudulent transactions using unsupervised learning algorithms.', 'Hard');

-- ISE
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('ise-1', 'ise', 'Distributed Task Scheduler', 'Build a distributed task scheduling system that efficiently assigns and manages tasks across multiple nodes.', 'Hard'),
  ('ise-2', 'ise', 'Online Exam Proctoring System', 'Create a browser-based exam platform with anti-cheating measures including tab monitoring and screen recording.', 'Medium'),
  ('ise-3', 'ise', 'Version Control Visualization Tool', 'Develop a visual tool that renders Git repository history as interactive graphs and timelines.', 'Medium'),
  ('ise-4', 'ise', 'API Gateway with Rate Limiting', 'Build a lightweight API gateway with authentication, rate limiting, and request logging.', 'Medium'),
  ('ise-5', 'ise', 'Bug Tracker & Project Manager', 'Create a Kanban-style project management tool with bug tracking, assignment, and sprint planning.', 'Easy');

-- ECE
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('ece-1', 'ece', 'Smart Home Energy Monitor', 'Design an IoT-based system that monitors household energy consumption and suggests optimization strategies.', 'Medium'),
  ('ece-2', 'ece', 'Wireless Sensor Mesh Network', 'Build a self-healing mesh network of wireless sensors for environmental monitoring applications.', 'Hard'),
  ('ece-3', 'ece', 'Voice-Controlled Home Automation', 'Create a voice-controlled system using speech recognition to operate home appliances.', 'Medium'),
  ('ece-4', 'ece', 'FPGA-based Signal Processor Simulator', 'Develop a web-based simulator for visualizing and testing basic FPGA signal processing operations.', 'Hard'),
  ('ece-5', 'ece', 'Noise Cancellation Algorithm Visualizer', 'Build an interactive tool that demonstrates active noise cancellation algorithms with real-time audio.', 'Easy');

-- MECH
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('mech-1', 'mech', '3D CAD Model Viewer', 'Create a web-based 3D viewer for CAD models (STL/OBJ) with rotation, zoom, and measurement tools.', 'Medium'),
  ('mech-2', 'mech', 'Predictive Maintenance Dashboard', 'Build a dashboard that predicts machine failures using sensor data and ML-based anomaly detection.', 'Hard'),
  ('mech-3', 'mech', 'Heat Transfer Simulation Tool', 'Develop an interactive simulation tool for visualizing conduction, convection, and radiation heat transfer.', 'Medium'),
  ('mech-4', 'mech', 'Supply Chain Optimization Tool', 'Create a tool that optimizes supply chain logistics using graph algorithms and route planning.', 'Medium'),
  ('mech-5', 'mech', 'Workshop Inventory Manager', 'Build a web app to track workshop tools, materials, and equipment with barcode scanning support.', 'Easy');

-- CIVIL
INSERT INTO problem_statements (id, department, title, description, difficulty) VALUES
  ('civil-1', 'civil', 'Construction Project Tracker', 'Build a platform for tracking construction project progress with Gantt charts and milestone management.', 'Medium'),
  ('civil-2', 'civil', 'Structural Load Calculator', 'Create an interactive tool for calculating beam loads, stress, and deflection with visual diagrams.', 'Medium'),
  ('civil-3', 'civil', 'GIS-based Land Use Mapper', 'Develop a GIS application that maps and analyzes land use patterns using satellite data and overlays.', 'Hard'),
  ('civil-4', 'civil', 'Water Distribution Network Simulator', 'Build a simulator for designing and analyzing water distribution networks with flow and pressure analysis.', 'Hard'),
  ('civil-5', 'civil', 'Site Safety Checklist App', 'Create a digital checklist app for construction site safety inspections with photo documentation.', 'Easy');


-- ═══════════════════════════════════════════════
-- MENTOR SYSTEM TABLES
-- ═══════════════════════════════════════════════

-- 4. Mentors (registered by admin)
CREATE TABLE IF NOT EXISTS mentors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  department TEXT NOT NULL,
  max_teams INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mentor ↔ Team assignments
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL DEFAULT '3rd Year'
    CHECK (academic_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id)  -- each team gets exactly one mentor
);

-- 6. Project submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  github_url TEXT NOT NULL,
  readme_desc TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Mentor reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, team_id)
);

-- Enable RLS on new tables
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public policies (matching existing pattern)
CREATE POLICY "public_select_mentors" ON mentors FOR SELECT USING (true);
CREATE POLICY "public_insert_mentors" ON mentors FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_mentors" ON mentors FOR UPDATE USING (true);
CREATE POLICY "public_delete_mentors" ON mentors FOR DELETE USING (true);

CREATE POLICY "public_select_assignments" ON mentor_assignments FOR SELECT USING (true);
CREATE POLICY "public_insert_assignments" ON mentor_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_assignments" ON mentor_assignments FOR UPDATE USING (true);
CREATE POLICY "public_delete_assignments" ON mentor_assignments FOR DELETE USING (true);

CREATE POLICY "public_select_submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "public_insert_submissions" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_submissions" ON submissions FOR UPDATE USING (true);
CREATE POLICY "public_delete_submissions" ON submissions FOR DELETE USING (true);

CREATE POLICY "public_select_reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "public_insert_reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_reviews" ON reviews FOR UPDATE USING (true);
CREATE POLICY "public_delete_reviews" ON reviews FOR DELETE USING (true);

-- 8. Weekly Progress Reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  report_text TEXT NOT NULL,
  mentor_status TEXT DEFAULT 'Pending' CHECK (mentor_status IN ('Pending', 'Approved', 'Needs Revision')),
  mentor_comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, week_number)
);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_weekly_reports" ON weekly_reports FOR SELECT USING (true);
CREATE POLICY "public_insert_weekly_reports" ON weekly_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_weekly_reports" ON weekly_reports FOR UPDATE USING (true);
CREATE POLICY "public_delete_weekly_reports" ON weekly_reports FOR DELETE USING (true);


-- 9. Seed Mentors (Staff Details)
-- ─────────────────────────────────────────────

INSERT INTO mentors (name, email, password, department) VALUES
  ('Dr. Narayan S', 'narayan.cse@saividya.ac.in', 'svitmentor123', 'cse'),
  ('Prof. Rashmi S', 'rashmi.cse@saividya.ac.in', 'svitmentor123', 'cse'),
  ('Dr. Harsha S', 'harsha.ise@saividya.ac.in', 'svitmentor123', 'ise'),
  ('Prof. Shreeshail M', 'shreeshail.ise@saividya.ac.in', 'svitmentor123', 'ise'),
  ('Dr. Ramesh N', 'ramesh.ece@saividya.ac.in', 'svitmentor123', 'ece'),
  ('Prof. Geetha S', 'geetha.ece@saividya.ac.in', 'svitmentor123', 'ece'),
  ('Dr. Mohan G', 'mohan.mech@saividya.ac.in', 'svitmentor123', 'mech'),
  ('Prof. Kumar R', 'kumar.mech@saividya.ac.in', 'svitmentor123', 'mech'),
  ('Dr. Sanjay K', 'sanjay.civil@saividya.ac.in', 'svitmentor123', 'civil'),
  ('Prof. Rekha B', 'rekha.civil@saividya.ac.in', 'svitmentor123', 'civil'),
  ('Dr. Arjun P', 'arjun.aiml@saividya.ac.in', 'svitmentor123', 'cse-aiml'),
  ('Prof. Lakshmi V', 'lakshmi.aiml@saividya.ac.in', 'svitmentor123', 'cse-aiml'),
  ('Dr. Vikram S', 'vikram.ds@saividya.ac.in', 'svitmentor123', 'cse-ds'),
  ('Prof. Pooja M', 'pooja.ds@saividya.ac.in', 'svitmentor123', 'cse-ds');

