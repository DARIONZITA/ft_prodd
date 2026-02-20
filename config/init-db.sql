-- Initialization script for PostgreSQL database
-- This script runs automatically when the database is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for different services (optional, for better organization)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS social;
CREATE SCHEMA IF NOT EXISTS gamification;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO transcendence;
GRANT ALL PRIVILEGES ON SCHEMA core TO transcendence;
GRANT ALL PRIVILEGES ON SCHEMA social TO transcendence;
GRANT ALL PRIVILEGES ON SCHEMA gamification TO transcendence;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully for ft_transcendence';
END $$;
