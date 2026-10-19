# Get on Board (`getonbrd.com`) URL & Endpoint Reference

## Base URL
- Web: `https://www.getonbrd.com`
- API v0: `https://www.getonbrd.com/api/v0`

## Endpoints

### 1. Job Search
- **Endpoint**: `GET /api/v0/search/jobs`
- **Query Parameters**:
  - `query`: Text string (e.g. `react`, `salesforce`, `full stack`, `typescript`)
  - `per_page`: Number of items per page (default: 20, max recommended: 20)
  - `page`: Page index (default: 1)
- **Response Format**: JSON:
  ```json
  {
    "data": [
      {
        "id": "technical-lead-senior-bci-santiago-3e19",
        "type": "job",
        "attributes": {
          "title": "Technical Lead Senior",
          "description": "...",
          "remote": true,
          "remote_modality": "fully_remote",
          "remote_zone": "Latin America",
          "countries": ["Remote", "Colombia"],
          "published_at": 1792174400,
          "min_salary": 3500,
          "max_salary": 4500,
          "company": {
            "data": { "id": 3125, "type": "company" }
          }
        },
        "links": {
          "public_url": "https://www.getonbrd.com/jobs/..."
        }
      }
    ]
  }
  ```

### 2. Company Details
- **Endpoint**: `GET /api/v0/companies/{company_id}`
- **Parameters**: `company_id` (integer ID from job search)
- **Response Format**: JSON:
  ```json
  {
    "data": {
      "id": "bci",
      "type": "company",
      "attributes": {
        "name": "Bci",
        "description": "...",
        "web": "http://www.trabajaenbci.cl",
        "country": "CL"
      }
    }
  }
  ```

### 3. Public Web Listing Fallback
- **Pattern**: `https://www.getonbrd.com/jobs/{slug}`
- **Title format**: `<Title> at <Company> - <Location> | Get on Board`
- **Public access**: Publicly accessible without authentication.
