# Deploy e-form (APIs + frontend) on 72.60.74.221

This VPS (`srv997517`, user `dev_user`) already has Docker. Compose publishes **eform-nginx** on **80** and **443**. Duton-nginx (and anything else bound to 80/443) must be stopped first.

**How you reach the stack**

- UI + APIs (after Step 9): `https://digitalform.florosense.com`
- IP fallback (HTTP): `http://72.60.74.221/` (login HTML) and `http://72.60.74.221/api/...`
- Docker names (`frontend`, `auth`, `pm`, `previsit`, `calibration`, `installation`) work **only inside** Docker. They are not public hostnames.

**How the live site reaches the APIs**

The SPA and the APIs share one origin. The browser calls `/api/...` on `https://digitalform.florosense.com`; `eform-nginx` proxies those paths to the Spring containers. Do **not** point the HTTPS site at `http://72.60.74.221` from the browser (mixed content). See [Step 9](#step-9--frontend-on-the-vps-and-https).

**RAM:** 4 GB minimum, 8 GB recommended. On 4 GB set `JAVA_OPTS=-Xmx256m` in `.env`. Build `frontend` separately so Node/Vite does not OOM next to the JVMs.

---

## Step 1 — SSH into the server

On your Windows PC, open PowerShell or Windows Terminal:

```powershell
ssh dev_user@72.60.74.221
```

You should see a prompt like `dev_user@srv997517:~$`.

---

## Step 2 — Confirm Docker (already installed)

You already have Docker images. Only confirm Compose works:

```bash
docker compose version
free -h
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
ss -tlnp | grep -E ':80|:443|:5432|:9080'
sudo systemctl status postgresql --no-pager
```

- If `docker compose version` fails: `sudo usermod -aG docker dev_user`, then log out and SSH in again.
- Note whether Postgres is a **host** service (`postgresql` active) or a **container** (`docker ps` shows postgres).
- Confirm **80 is free** after Step 3. If it is taken, stop the container that publishes 80.

---

## Step 3 — Free ports 80 and 443 and allow them

Hostinger already allows **80**. Also allow **443** in hPanel (VPS → Firewall → TCP 443) and in ufw. Stop Duton/nginx (and anything else) bound to 80 or 443 so eform-nginx can use both. **Do not stop** `duton-postgres` or Redis — the e-form APIs use that database.

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

Typical names: `duton-nginx`. Stop and prevent restart:

```bash
docker stop duton-nginx
docker update --restart=no duton-nginx
```

If other containers show `0.0.0.0:80` or `0.0.0.0:443`, stop those the same way (not postgres). Then:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
ss -tlnp | grep -E ':80|:443'
```

Ports 80 and 443 should now be unused. Do not start Duton-nginx again while eform uses them.

---

## Step 4 — Copy the project to the server

**Option A — from your Windows PC** (new PowerShell window, not the SSH session):

```powershell
scp -r C:\Users\admin\Desktop\Digital_Installation_PM_Visit_E-Form_System dev_user@72.60.74.221:/home/dev_user/eform
```

**Option B — git clone** (if the repo is on GitHub):

```bash
cd ~
git clone YOUR_REPO_URL eform
```

Then on the VPS:

```bash
cd ~/eform
ls docker-compose.yml
```

---

## Step 5 — Create `.env` (secrets)

```bash
cd ~/eform
cp .env.example .env
mkdir -p data/previsit-uploads data/installation-uploads
sudo chown -R 100:100 data
openssl rand -base64 48
nano .env
```

Paste the generated string as `JWT_SECRET`. Fill in:

- `NGINX_HTTP_PORT=80`
- `NGINX_HTTPS_PORT=443`
- `API_DOMAIN=digitalform.florosense.com`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/Digital_EForm`
- `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` (your real Postgres user)
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://72.60.74.221,https://digitalform.florosense.com`
- `JAVA_OPTS=-Xmx512m` (use `-Xmx256m` if `free -h` shows under ~5 GB RAM)

Save in nano: `Ctrl+O`, Enter, `Ctrl+X`.

`JWT_SECRET` must be the **same** for all five services (one value in this file is enough; Compose passes it to every container).

**First-time only.** On later deploys do **not** run `cp .env.example .env` or `openssl rand` again. Changing `JWT_SECRET` invalidates existing logins. See [Updating an existing deployment](#updating-an-existing-deployment).

---

## Step 6 — Create the database and allow Docker to connect

**If Postgres is installed on the host:**

```bash
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"
sudo -u postgres psql -c 'CREATE DATABASE "Digital_EForm";'
```

In `postgresql.conf` set `listen_addresses = '*'`. In `pg_hba.conf` add:

```
host    all    all    172.16.0.0/12    scram-sha-256
```

(Use `md5` if that is how the user was created.) Then:

```bash
sudo systemctl reload postgresql
```

**If Postgres is already a Docker container** (you have `postgres:15-alpine`):

```bash
docker ps --filter ancestor=postgres:15-alpine
docker exec -it CONTAINER_NAME psql -U postgres -c 'CREATE DATABASE "Digital_EForm";'
```

If that container publishes `5432` on the host, keep `host.docker.internal` in the JDBC URL.

Test (replace `USER` and `PASSWORD`):

```bash
docker run --rm --add-host=host.docker.internal:host-gateway postgres:15-alpine \
  psql "postgresql://USER:PASSWORD@host.docker.internal:5432/Digital_EForm" -c 'SELECT 1;'
```

You want `1` printed.

---

## Step 7 — Build and start

This creates **new** containers named `eform-*`. It does not replace sensor-bridge, duton-dashboard, Redis, or the existing Nginx.

First boot can take several minutes (Maven download + Hibernate tables + the Node SPA build). If RAM is low, build one service at a time. **Build frontend first** so Vite is not competing with five JVMs:

```bash
cd ~/eform
docker compose build frontend
docker compose build auth
docker compose build pm
docker compose build previsit
docker compose build calibration
docker compose build installation
docker compose up -d
```

Otherwise:

```bash
cd ~/eform
docker compose build frontend
docker compose up -d --build
```

Watch status:

```bash
docker compose ps
docker compose logs -f
```

Wait until `auth`, `pm`, `previsit`, `calibration`, `installation`, and `frontend` are **healthy**. Nginx starts only after that. Exit logs with `Ctrl+C` (containers keep running).

---

## Step 8 — Test on HTTP (IP)

**On the VPS:**

```bash
curl -sI http://127.0.0.1/
# expect: HTTP/1.1 200 and text/html (login page, not the old eform-api text)

curl -s http://127.0.0.1/api/auth/ping

docker compose exec auth wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec pm wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec previsit wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec calibration wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec installation wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec frontend wget -qO- http://127.0.0.1:80/ >/dev/null && echo frontend-ok
```

Each health line should include `"status":"UP"`.

**From your PC** (PowerShell):

```powershell
curl.exe -sI http://72.60.74.221/
curl.exe -i -X POST http://72.60.74.221/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"YOUR_USER@example.com\",\"password\":\"YOUR_PASS\"}"
```

- Timeout = Hostinger/firewall blocking 80, or Duton-nginx still bound to 80
- 502 = frontend or API container not ready
- HTML login page on `GET /` = SPA is up
- 400/401 on login = Nginx reached Auth (good)

| URL | Service |
|-----|---------|
| `http://72.60.74.221/api/auth/...` | Auth (`/login` uses `email` + `password`) |
| `http://72.60.74.221/api/pm_reports/...` | PM |
| `http://72.60.74.221/api/previsit-reports/...` | Pre-visit |
| `http://72.60.74.221/api/calibration-reports/...` | Calibration |
| `http://72.60.74.221/api/installation-reports/...` | Installation |
| `http://72.60.74.221/uploads/previsit-images/...` | Pre-visit files |
| `http://72.60.74.221/uploads/installation-images/...` | Installation files |

In Postman: login, copy the JWT, send `Authorization: Bearer <token>` to the report APIs. Create one report per module and upload images. Then on the VPS:

```bash
docker compose restart previsit installation
ls ~/eform/data/previsit-uploads ~/eform/data/installation-uploads
```

Files must still be there.

Optional UI from your PC (without the public domain): open `http://72.60.74.221/login` in the browser, or run local Vite with every `VITE_*` URL set to `http://72.60.74.221` (no trailing slash). That is HTTP → HTTP, so mixed-content does not apply.

---

## Step 9 — Frontend on the VPS and HTTPS

The SPA is `eform-frontend` in Docker Compose. `eform-nginx` serves `/` to that container and `/api` / `/uploads` to the Spring services. Leave `VITE_*_SERVICE_URL` empty in the image (Compose already does this) so the browser calls same-origin `/api`.

Do **not** re-run `cp .env.example .env` or rotate `JWT_SECRET`.

### A. Open 443

hPanel → VPS → Firewall → allow TCP **443**, and on the VPS:

```bash
sudo ufw allow 443/tcp
ss -tlnp | grep -E ':80|:443'
```

Keep `duton-nginx` stopped.

### B. Pull and build frontend separately

On a 4 GB VPS, Node + Vite next to five JVMs can OOM:

```bash
cd ~/eform
git pull
docker compose build frontend
docker compose up -d --build --force-recreate --remove-orphans
```

Confirm HTTP still works (IP, not the domain — the domain redirects to HTTPS before the cert exists):

```bash
curl -sI http://127.0.0.1/
curl -s http://127.0.0.1/api/auth/ping
```

`GET /` must be **200** HTML (login), not the old `eform-api` text.

If you added `http://72.60.74.221` or `https://digitalform.florosense.com` to `CORS_ALLOWED_ORIGINS` in `~/eform/.env`, recreate auth:

```bash
docker compose up -d --force-recreate auth
```

### C. DNS

Wherever `florosense.com` is managed, set `digitalform.florosense.com` **A record → `72.60.74.221`**. Remove any Render CNAME. Wait until this shows the VPS IP:

```powershell
nslookup digitalform.florosense.com
```

Until you finish **D**, `http://digitalform.florosense.com` returns **301 to HTTPS** (see `nginx/default.conf`) and HTTPS is not live yet. Use `http://72.60.74.221/` until the certificate is enabled.

### D. Let's Encrypt

HTTP-01 uses the ACME location already in `eform-nginx` and the `nginx/www` volume:

```bash
docker run --rm \
  -v ~/eform/nginx/www:/var/www/certbot \
  -v ~/eform/nginx/certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d digitalform.florosense.com \
  --email YOUR_EMAIL --agree-tos --no-eff-email
```

You want files under `~/eform/nginx/certs/live/digitalform.florosense.com/`. Then uncomment the **443 server** in [`nginx/default.conf`](../nginx/default.conf) (cert paths under `/etc/nginx/certs/live/digitalform.florosense.com/`) and recreate nginx:

```bash
cd ~/eform
nano nginx/default.conf
docker compose up -d --force-recreate nginx
docker exec eform-nginx nginx -t
```

Renew twice a day from cron (certbot is a no-op until 30 days remain):

```bash
sudo crontab -e
```

Add:

```
0 3 * * * docker run --rm -v /home/dev_user/eform/nginx/www:/var/www/certbot -v /home/dev_user/eform/nginx/certs:/etc/letsencrypt certbot/certbot renew --webroot -w /var/www/certbot && docker exec eform-nginx nginx -s reload
```

### E. Verify

```powershell
curl.exe -sI https://digitalform.florosense.com/
curl.exe -i -X POST https://digitalform.florosense.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"YOUR_USER@example.com\",\"password\":\"YOUR_PASS\"}"
```

In the browser: `https://digitalform.florosense.com/login` → DevTools → Network: `POST /api/auth/login` must be **200** (success) or **401** (wrong password), never **404**. Then open the dashboard, one create/list of each report type, and a pre-visit or installation photo upload.

Accounts created only against localhost PostgreSQL are not on the VPS. Create VPS users from `http://72.60.74.221/` while `AUTH_REGISTRATION_ENABLED=true`, or:

```powershell
curl.exe -i -X POST http://72.60.74.221/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Tech Ops\",\"email\":\"techops@florosense.com\",\"phone\":\"9876543210\",\"password\":\"YourPass1\",\"role\":\"ADMIN\"}"
```

After those users exist, set `AUTH_REGISTRATION_ENABLED=false` in `~/eform/.env` and recreate auth: `docker compose up -d --force-recreate auth`.

### F. Stop Render

Only after HTTPS on the VPS works, suspend or delete the Render Web Service so `digitalform.florosense.com` is not pointed back at Render. Keep Render stopped, not as production.

---

## Updating an existing deployment

After `git pull`, Docker **always** builds a new image ID (for example `eform-auth:latest a26f5154c988`) and moves the `latest` tag. That is expected. Login breaks when containers keep running the old image, when `JWT_SECRET` is rotated, or when `duton-nginx` is no longer on the `eform_eform` network.

**Do not** re-run Step 5 (`cp .env.example .env` or `openssl rand` for `JWT_SECRET`). Keep the existing `~/eform/.env`.

From `~/eform`:

```bash
chmod +x deploy/redeploy.sh
./deploy/redeploy.sh
```

If you already pulled:

```bash
./deploy/redeploy.sh --skip-pull
```

The script recreates every `eform-*` container (`docker compose up -d --build --force-recreate --remove-orphans`), reconnects `duton-nginx` if it is running, and prunes dangling old image IDs. If RAM is tight, run `docker compose build frontend` before the script, then `./deploy/redeploy.sh --skip-pull`.

Manual equivalent:

```bash
cd ~/eform
grep -E '^JWT_SECRET=' .env | sed 's/=.*/=***present***/'
git pull
docker compose up -d --build --force-recreate --remove-orphans
docker network connect eform_eform duton-nginx 2>/dev/null || true
docker image prune -f
docker compose ps
curl -sI http://127.0.0.1/
docker compose exec auth wget -qO- http://127.0.0.1:8080/actuator/health
```

If you use the `/eform/` path through `duton-nginx`, reconnect after any `docker compose down` / `up`:

```bash
docker network connect eform_eform duton-nginx
```

Users whose tokens were signed with a **previous** `JWT_SECRET` must log in again. If login still fails, check `docker compose logs auth` (database or JWT errors), not the new image ID.

---

## If something fails

```bash
docker compose logs -f auth
docker compose ps
docker compose down    # stops only eform-* containers; keeps ~/eform/data
```

This Compose project uses container names `eform-*`. `docker compose down` does not remove sensor-bridge, Redis, or Postgres. Stop `duton-nginx` yourself if it is still bound to 80.

### Already deployed on 9080 — switch to port 80

On the VPS:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker stop duton-nginx
docker update --restart=no duton-nginx
# repeat docker stop / docker update --restart=no for any other container showing 0.0.0.0:80 or :443
# do NOT stop duton-postgres

cd ~/eform
# set NGINX_HTTP_PORT=80 in .env (nano .env)
grep NGINX_HTTP_PORT .env
docker compose up -d nginx
curl -sI http://127.0.0.1/
```

You want **200** and `text/html` (login page). From Windows: `curl.exe -sI http://72.60.74.221/` must also be 200 HTML.

### `Unable to connect` / `ERR_CONNECTION_TIMED_OUT` to port 80

Duton-nginx is still bound to 80, or eform-nginx is not published on 80. Run the switch steps above. Hostinger already allows 80; you do not need a new hPanel rule for 9080.

**Option B — use port 80 through duton-nginx** (already public)

On the VPS:

```bash
docker network connect eform_eform duton-nginx
docker exec duton-nginx nginx -T 2>/dev/null | grep -n "listen"
```

Find the host path of duton’s nginx config:

```bash
docker inspect duton-nginx --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
```

Inside the `server { listen 80; ... }` block, add the contents of `nginx/duton-eform-location.conf` (location `/eform/`). Then:

```bash
docker exec duton-nginx nginx -t
docker exec duton-nginx nginx -s reload
```

From your PC:

```powershell
curl.exe http://72.60.74.221/eform/
```

You should see the login HTML (or a 301 if that host is `digitalform.florosense.com`). The `/eform/` path is a legacy API-only option; the production UI is at `/` on `eform-nginx`.

After `docker compose down` / `up`, run `docker network connect eform_eform duton-nginx` again.

**Option C — open 9080 in Hostinger**

hPanel → VPS → Firewall → allow TCP **9080**. Then `curl.exe -sI http://72.60.74.221:9080/` from Windows must return 200 HTML. This is not needed if eform-nginx is already on port 80.

---

### `password authentication failed for user "postgres"` (SQLState 28P01)

The images built. The app reached Postgres, but the password in `~/eform/.env` is not the password Postgres expects. Typical causes: leftover `change-me` from `.env.example`, or the local-dev password `root`.

**1. Set a password you know** (on the VPS):

If Postgres is a host service:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'PickAStrongPassword';"
```

If Postgres is a Docker container, replace `CONTAINER_NAME`:

```bash
docker ps --filter ancestor=postgres:15-alpine
docker exec -it CONTAINER_NAME psql -U postgres -c "ALTER USER postgres PASSWORD 'PickAStrongPassword';"
```

**2. Put that same password in `.env`:**

```bash
cd ~/eform
nano .env
```

Set:

```
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=PickAStrongPassword
```

If the password contains `$`, `#`, or spaces, wrap it in single quotes: `SPRING_DATASOURCE_PASSWORD='P@ss$word'`.

Save: `Ctrl+O`, Enter, `Ctrl+X`.

**3. Confirm Docker can log in:**

```bash
docker run --rm --add-host=host.docker.internal:host-gateway postgres:15-alpine \
  psql "postgresql://postgres:PickAStrongPassword@host.docker.internal:5432/Digital_EForm" -c 'SELECT 1;'
```

You want `1`. If this fails, the password or database name is still wrong — do not restart Compose yet.

**4. Recreate the API containers so they pick up `.env`:**

```bash
cd ~/eform
docker compose up -d
```

Compose recreates containers when env values change. If they do not restart:

```bash
docker compose up -d --force-recreate
```

Then check:

```bash
docker compose logs -f auth
```

You should see Tomcat started, not `28P01`. Exit logs with `Ctrl+C`.
