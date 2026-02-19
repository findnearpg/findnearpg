## Deploy Live (Render)

### 1. Push code to GitHub
- Ensure this repo is on GitHub with latest changes.

### 2. Create service on Render
- Open Render Dashboard.
- New -> Blueprint.
- Select this repo.
- Render will detect `render.yaml` and create `findnearpg-web`.

### 3. Set environment values
- In Render service -> Environment, fill all `sync: false` vars.
- Use `apps/web/.env.production.example` as reference.
- Minimum required to boot correctly:
  - `AUTH_URL`
  - `AUTH_SECRET`
  - `MONGODB_URI`
  - `MONGODB_DB`
  - `VITE_SITE_URL`
  - `NEXT_PUBLIC_SITE_URL`

### 4. Deploy
- Click Deploy Latest Commit.
- Wait until build and start complete.

### 5. Attach custom domain
- Service -> Settings -> Custom Domains.
- Add your domain (example: `findnearpg.com`).
- Update DNS records as Render instructs.

### 6. Post-deploy checks
- Open:
  - `/`
  - `/search`
  - `/sitemap.xml`
  - `/robots.txt`
- Verify no 500 errors in Render logs.
- In Google Search Console:
  - Add property for your domain.
  - Submit `https://your-domain.com/sitemap.xml`.

