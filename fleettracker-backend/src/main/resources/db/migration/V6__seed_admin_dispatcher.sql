-- First dispatcher account so you can log in and create other users.
-- Email: admin@fleet.local  Password: Admin@123 (change it immediately!)
INSERT INTO users (name, email, password_hash, role, phone, active)
VALUES ('Fleet Admin', 'admin@fleet.local', '$2b$10$54MvAw.rd4iozDitZYt7cOwZIpD9YzOKshRv5aljsrHagSl7Fwgwe', 'DISPATCHER', NULL, TRUE);
