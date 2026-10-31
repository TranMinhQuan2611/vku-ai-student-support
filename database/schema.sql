-- VKU AI Student Support
-- Database schema
-- PostgreSQL 16

-- Bang luu tru cau hoi va cau tra loi FAQ

CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,

    category VARCHAR(100) NOT NULL,

    question TEXT NOT NULL,

    answer TEXT NOT NULL,

    keywords TEXT[] DEFAULT '{}',

    source_type VARCHAR(30) DEFAULT 'fallback',

    source_url TEXT,

    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);