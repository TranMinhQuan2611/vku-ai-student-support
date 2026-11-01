import csv
import io
import json
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
FAQ_FILE = BASE_DIR / "data" / "faq.json"

CONTAINER = "vku-postgres"
DB_USER = "vku_user"
DB_NAME = "vku_student_support"

with open(FAQ_FILE, "r", encoding="utf-8") as file:
    data = json.load(file)

faqs = data.get("faqs", [])

if not faqs:
    print("Không có dữ liệu FAQ để nhập.")
    raise SystemExit(1)

buffer = io.StringIO()
writer = csv.writer(buffer, delimiter="\t", lineterminator="\n")

for faq in faqs:
    writer.writerow([
        faq["category"],
        faq["question"],
        faq["answer"],
        json.dumps(faq.get("keywords", []), ensure_ascii=False),
        faq.get("source_type", "fallback"),
        faq.get("source_url") or "",
        str(faq.get("verified", False)).lower()
    ])

sql = r"""
BEGIN;

CREATE TEMP TABLE faq_import (
    category TEXT,
    question TEXT,
    answer TEXT,
    keywords_json TEXT,
    source_type TEXT,
    source_url TEXT,
    verified BOOLEAN
);

\copy faq_import FROM STDIN WITH (FORMAT csv, DELIMITER E'\t')
"""

insert_sql = """
INSERT INTO faqs (
    category, question, answer, keywords,
    source_type, source_url, verified
)
SELECT
    f.category,
    f.question,
    f.answer,
    ARRAY(
        SELECT jsonb_array_elements_text(f.keywords_json::jsonb)
    ),
    f.source_type,
    NULLIF(f.source_url, ''),
    f.verified
FROM faq_import f
WHERE NOT EXISTS (
    SELECT 1
    FROM faqs existing
    WHERE existing.question = f.question
);

COMMIT;
"""

# Dùng lệnh COPY của PostgreSQL để nhập dữ liệu
copy_data = buffer.getvalue()

# Đưa dữ liệu CSV vào PostgreSQL bằng một lệnh COPY duy nhất
# Sử dụng bảng tạm để tránh ghép trực tiếp dữ liệu vào SQL
script = (
    "BEGIN;\n"
    "CREATE TEMP TABLE faq_import ("
    "category TEXT, question TEXT, answer TEXT, "
    "keywords_json TEXT, source_type TEXT, "
    "source_url TEXT, verified BOOLEAN);\n"
    "COPY faq_import FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t');\n"
    + copy_data
    + "\\.\n"
    + insert_sql.replace("COMMIT;", "")
    + "\nCOMMIT;\n"
)

result = subprocess.run(
    [
        "docker", "exec", "-i", CONTAINER,
        "psql", "-X", "-v", "ON_ERROR_STOP=1",
        "-U", DB_USER, "-d", DB_NAME
    ],
    input=script,
    text=True,
    capture_output=True
)

if result.returncode != 0:
    print("Nhập FAQ thất bại:")
    print(result.stderr)
    raise SystemExit(1)

print(result.stdout)
print(f"Đã xử lý {len(faqs)} câu hỏi FAQ.")