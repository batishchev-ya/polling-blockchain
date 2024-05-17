CREATE USER polling_user WITH PASSWORD 'test_polling';
CREATE DATABASE polling_database;
ALTER DATABASE polling_database OWNER TO polling_user;
\c polling_database;
-- Create schema 'polling' within the 'polling' database
CREATE SCHEMA IF NOT EXISTS polling_schema;

ALTER SCHEMA polling_schema OWNER TO polling_user;

