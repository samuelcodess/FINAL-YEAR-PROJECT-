CREATE DATABASE IF NOT EXISTS employee_performance_ai;
USE employee_performance_ai;

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr_manager', 'employee') NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  theme_preference ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  reminder_opt_in BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE system_settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  department_id INT NOT NULL,
  position VARCHAR(120) NOT NULL,
  hire_date DATE NOT NULL,
  status ENUM('active', 'on_leave', 'inactive', 'terminated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE kpis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kpi_name VARCHAR(120) NOT NULL UNIQUE,
  weight_percentage DECIMAL(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  evaluation_date DATE NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  performance_level ENUM(
    'excellent',
    'very_good',
    'good',
    'average',
    'poor'
  ) NOT NULL,
  recommendation TEXT,
  remarks TEXT,
  source_summary TEXT NULL,
  ai_summary TEXT NULL,
  evaluation_mode ENUM('manual', 'ai') NOT NULL DEFAULT 'ai',
  trend ENUM('improving', 'stable', 'declining') DEFAULT 'stable',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_evaluations_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_evaluations_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

CREATE TABLE evaluation_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluation_id INT NOT NULL,
  kpi_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evaluation_details_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
  CONSTRAINT fk_evaluation_details_kpi FOREIGN KEY (kpi_id) REFERENCES kpis(id)
);

CREATE TABLE recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  evaluation_id INT NULL,
  recommendation_type ENUM(
    'promotion',
    'leadership',
    'bonus',
    'advanced_responsibility',
    'training',
    'skill_development',
    'performance_improvement_plan',
    'recognition',
    'warning'
  ) NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendations_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommendations_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category ENUM('general', 'task', 'recommendation', 'evaluation', 'security') NOT NULL DEFAULT 'general',
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  assigned_by INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  linked_kpi_id INT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('not_started', 'in_progress', 'submitted', 'completed', 'needs_revision', 'cancelled') NOT NULL DEFAULT 'not_started',
  due_date DATE NULL,
  submitted_at DATETIME NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  review_comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_linked_kpi FOREIGN KEY (linked_kpi_id) REFERENCES kpis(id) ON DELETE SET NULL
);

CREATE TABLE task_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  employee_id INT NOT NULL,
  submission_note TEXT NOT NULL,
  status ENUM('submitted', 'approved', 'needs_revision') NOT NULL DEFAULT 'submitted',
  review_comment TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_submissions_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_submissions_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_submissions_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE task_submission_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INT NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_submission_attachments_submission FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE
);

CREATE TABLE learning_pathway_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  module_index INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_pathway_progress_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT uq_learning_pathway_progress UNIQUE (employee_id, resource_id, module_index)
);

CREATE TABLE learning_pathway_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  source_evaluation_id INT NULL,
  assigned_by INT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATE NULL,
  completion_decision ENUM('in_progress', 'completed', 'follow_up_required') NOT NULL DEFAULT 'in_progress',
  decision_comment TEXT NULL,
  decided_by INT NULL,
  decided_at DATETIME NULL,
  completed_at DATETIME NULL,
  CONSTRAINT fk_learning_pathway_assignments_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_pathway_assignments_evaluation FOREIGN KEY (source_evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL,
  CONSTRAINT fk_learning_pathway_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_learning_pathway_assignments_decided_by FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_learning_pathway_assignments UNIQUE (employee_id, resource_id)
);

CREATE TABLE learning_pathway_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  submission_type ENUM('module', 'final_assignment') NOT NULL,
  module_index INT NULL,
  submission_text TEXT NOT NULL,
  ai_score DECIMAL(5,2) NOT NULL,
  ai_feedback TEXT NOT NULL,
  ai_strengths TEXT NOT NULL,
  ai_improvements TEXT NOT NULL,
  ai_recommendation ENUM('ready_for_review', 'needs_revision') NOT NULL,
  status ENUM('submitted', 'approved', 'needs_revision') NOT NULL DEFAULT 'submitted',
  review_comment TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_pathway_submissions_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_pathway_submissions_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE learning_pathway_submission_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INT NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_pathway_submission_attachments_submission FOREIGN KEY (submission_id) REFERENCES learning_pathway_submissions(id) ON DELETE CASCADE
);

CREATE TABLE learning_pathway_submission_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  status ENUM('approved', 'needs_revision') NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_pathway_submission_reviews_submission FOREIGN KEY (submission_id) REFERENCES learning_pathway_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_pathway_submission_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE learning_pathway_reminder_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  reminder_type ENUM('due_soon', 'overdue') NOT NULL,
  reminder_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_pathway_reminder_logs_assignment FOREIGN KEY (assignment_id) REFERENCES learning_pathway_assignments(id) ON DELETE CASCADE,
  CONSTRAINT uq_learning_pathway_reminder_log UNIQUE (assignment_id, reminder_type, reminder_date)
);
