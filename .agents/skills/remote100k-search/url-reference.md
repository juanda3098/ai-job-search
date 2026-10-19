# Remote100k (`remote100k.com`) URL & Extraction Reference

## Base URL
- Web: `https://remote100k.com`
- Engineering category: `https://remote100k.com/remote-jobs/engineering`

## Extraction Anchors
- Job card anchor: `<a href="/remote-job/([^"]+)"`
- Recency anchor: `data-days="([^"]+)"`
- Title anchor: `<h3 class="job-card-desktop-title[^>]*>([^<]+)</h3>`
- Company anchor: `<p class="job-card-desktop-company[^>]*>([^<]+)</p>`
- Salary anchor: `<div class="job-card-salary"[^>]*>([^<]+(?:<[^>]+>[^<]+)*)</div>`
- Location anchor: `<i class="bi bi-geo-alt"></i>\s*Remote:?([^<]+)</span>`

## Robots.txt Notes
- `robots.txt` disallows `/admin/`, `/r1/admin/`, `/api/`, `/health/`.
- Public listing pages (`/remote-jobs/engineering`) are explicitly allowed for indexing.
