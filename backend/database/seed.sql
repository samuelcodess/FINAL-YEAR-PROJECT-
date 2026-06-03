USE employee_performance_ai;

INSERT INTO departments (department_name)
VALUES
  ('Human Resources'),
  ('Engineering'),
  ('Finance'),
  ('Operations')
ON DUPLICATE KEY UPDATE
  department_name = VALUES(department_name);

INSERT INTO users (full_name, email, password, role, must_change_password)
VALUES
  ('System Administrator', 'admin@example.com', '$2a$10$eMmC.CUYowZFwM.vC.PRCuKDYG7G.xMZ/P4VWarp.vndp0MpOK12e', 'admin', FALSE),
  ('Theresa HR', 'theresa.hr@example.com', '$2a$10$Qxvt7ocAvlrHEC.gWNT.HecPjh3Zs8NY1eSw9S6Ibu/F/w64dJBxW', 'hr_manager', FALSE),
  ('Amina Yusuf', 'amina@example.com', '$2a$10$lnNWII77lpxemBxN1TTPWu7U1..UhxFQxH0AIBCjI4xomDbzcFJZ2', 'employee', FALSE),
  ('Daniel Okafor', 'daniel@example.com', '$2a$10$lnNWII77lpxemBxN1TTPWu7U1..UhxFQxH0AIBCjI4xomDbzcFJZ2', 'employee', FALSE)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password = VALUES(password),
  role = VALUES(role),
  must_change_password = VALUES(must_change_password);

INSERT INTO system_settings (setting_key, setting_value)
VALUES
  ('allow_self_registration', 'false')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value);

INSERT INTO employees (user_id, employee_code, department_id, position, hire_date, status)
VALUES
  (3, 'EMP-1001', 2, 'Frontend Engineer', '2023-03-11', 'active'),
  (4, 'EMP-1002', 4, 'Operations Analyst', '2022-07-19', 'active')
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  position = VALUES(position),
  hire_date = VALUES(hire_date),
  status = VALUES(status);

INSERT INTO kpis (kpi_name, weight_percentage, description)
VALUES
  ('Productivity', 25.00, 'Measures ability to deliver expected output consistently'),
  ('Quality of Work', 25.00, 'Measures accuracy, reliability, and completeness of work'),
  ('Communication', 20.00, 'Measures clarity, responsiveness, and collaboration'),
  ('Initiative', 15.00, 'Measures proactive problem-solving and ownership'),
  ('Target Achievement', 15.00, 'Measures delivery against assigned goals')
ON DUPLICATE KEY UPDATE
  weight_percentage = VALUES(weight_percentage),
  description = VALUES(description);

INSERT INTO tasks (employee_id, assigned_by, title, description, linked_kpi_id, priority, status, due_date, submitted_at, reviewed_by, reviewed_at, review_comment)
SELECT 1, 2, 'Weekly productivity tracker', 'Document daily priorities, blockers, and delivered outcomes for one week to improve output consistency.', 1, 'medium', 'in_progress', '2026-06-04', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE employee_id = 1 AND title = 'Weekly productivity tracker'
);

INSERT INTO tasks (employee_id, assigned_by, title, description, linked_kpi_id, priority, status, due_date, submitted_at, reviewed_by, reviewed_at, review_comment)
SELECT 2, 2, 'Communication improvement brief', 'Submit a short report containing one clearer status update, one meeting summary, and one action-follow-up message.', 3, 'medium', 'needs_revision', '2026-06-01', '2026-05-26 10:30:00', 2, '2026-05-27 16:15:00', 'Good structure, but the examples still need clearer next steps and stronger workplace context.'
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE employee_id = 2 AND title = 'Communication improvement brief'
);

INSERT INTO task_submissions (task_id, employee_id, submission_note, status, review_comment, reviewed_by, reviewed_at)
SELECT t.id, 2, 'I rewrote one project update, summarized a weekly meeting, and drafted a follow-up email with owners and deadlines.', 'needs_revision', 'Expand the evidence with a clearer before-and-after comparison and explain what changed in the final message quality.', 2, '2026-05-27 16:15:00'
FROM tasks t
WHERE t.employee_id = 2
  AND t.title = 'Communication improvement brief'
  AND NOT EXISTS (
    SELECT 1 FROM task_submissions s WHERE s.task_id = t.id
  );
