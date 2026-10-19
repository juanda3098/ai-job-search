#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
SEEN_FILE = ROOT / "job_scraper" / "seen_jobs.json"
RESULTS_FILE = ROOT / "job_scraper" / "last_scrape_results.json"
PYTHON_EXE = Path(r"C:\Users\Juan David\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")

def get_job_key(company: str, title: str, url: str) -> str:
    cmd = [
        str(PYTHON_EXE),
        str(ROOT / "tools" / "job_key.py"),
        "--company", company,
        "--title", title,
        "--url", url
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return proc.stdout.strip()

def main():
    if not RESULTS_FILE.exists():
        print(f"{RESULTS_FILE} does not exist.")
        return

    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    seen_data = {"seen": {}}
    if SEEN_FILE.exists():
        with open(SEEN_FILE, "r", encoding="utf-8") as f:
            try:
                seen_data = json.load(f)
            except Exception:
                seen_data = {"seen": {}}

    seen = seen_data.setdefault("seen", {})
    today = datetime.now().strftime("%Y-%m-%d")
    added_count = 0

    for job in data.get("results", []):
        company = job.get("company", "Unknown")
        title = job.get("title", "Untitled")
        url = job.get("url", "")
        
        try:
            key = get_job_key(company, title, url)
        except Exception as e:
            print(f"Error getting key for {title} @ {company}: {e}")
            continue

        if key in seen:
            continue

        seen[key] = {
            "title": title,
            "company": company,
            "url": url,
            "first_seen": today,
            "posted_date": job.get("date"),
            "deadline": job.get("deadline"),
            "fit": job.get("fit", "low"),
            "status": "new",
            "portal": job.get("portal", "unknown"),
            "source": job.get("source", "api"),
            "language_gate": job.get("language_gate"),
            "language_note": job.get("language_note"),
            "salary": job.get("salary")
        }
        added_count += 1

    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        json.dump(seen_data, f, indent=2, ensure_ascii=False)

    print(f"Updated {SEEN_FILE}: added {added_count} new entries (total {len(seen)}).")

if __name__ == "__main__":
    main()
