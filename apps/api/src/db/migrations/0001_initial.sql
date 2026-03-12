CREATE TABLE submissions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language          VARCHAR(20) NOT NULL CHECK (language IN ('python','javascript','typescript','go')),
    original_code     TEXT NOT NULL,
    optimization_goal VARCHAR(20) NOT NULL CHECK (optimization_goal IN ('performance','memory','security','reliability','readability')),
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','optimizing','benchmarking','completed','failed')),
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    variant_index   SMALLINT NOT NULL,
    label           VARCHAR(100) NOT NULL,
    code            TEXT NOT NULL,
    explanation     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (submission_id, variant_index)
);

CREATE TABLE benchmark_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id          UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    run_number          SMALLINT NOT NULL DEFAULT 1,
    execution_time_ms   DOUBLE PRECISION,
    cpu_time_ms         DOUBLE PRECISION,
    peak_memory_bytes   BIGINT,
    exit_code           INTEGER,
    stdout              TEXT,
    stderr              TEXT,
    timed_out           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (variant_id, run_number)
);

CREATE TABLE security_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id          UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    vulnerability_count INTEGER NOT NULL DEFAULT 0,
    findings            JSONB NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reliability_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id      UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    total_tests     INTEGER NOT NULL,
    passed_tests    INTEGER NOT NULL,
    failure_details JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE variant_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id          UUID NOT NULL UNIQUE REFERENCES variants(id) ON DELETE CASCADE,
    performance_score   DOUBLE PRECISION,
    memory_score        DOUBLE PRECISION,
    security_score      DOUBLE PRECISION,
    reliability_score   DOUBLE PRECISION,
    readability_score   DOUBLE PRECISION,
    overall_score       DOUBLE PRECISION,
    rank                SMALLINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_submission ON variants(submission_id);
CREATE INDEX idx_benchmark_variant ON benchmark_results(variant_id);
CREATE INDEX idx_submissions_status ON submissions(status);
