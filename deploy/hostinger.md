# Deploy backends on 72.60.74.221 (no domain)

This VPS (`srv997517`, user `dev_user`) already has Docker. Other stacks are present (`nginx:alpine`, `postgres:15-alpine`, Redis, sensor-bridge, duton-dashboard). **Do not bind ports 80 or 443.** The e-form APIs listen on **9080**.

**How you reach the APIs**

- From your PC: `http://72.60.74.221:9080/api/...`
- Docker names (`auth`, `pm`, `previsit`, `calibration`, `installation`) work **only inside** Docker. They are not public hostnames.

**Do not connect the live frontend yet.** The site is HTTPS; this API is HTTP. Browsers block mixed content (`https://digitalform.florosense.com` → `http://72.60.74.221:9080`). Test with curl, Postman, or a local Vite app. Keep production on Render until you have HTTPS.

**RAM:** 4 GB minimum, 8 GB recommended. On 4 GB set `JAVA_OPTS=-Xmx256m` in `.env`.

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
- Confirm **9080 is free**. If it is taken, set another port as `NGINX_HTTP_PORT` in `.env`.

---

## Step 3 — Open firewall port 9080

```bash
sudo ufw allow OpenSSH
sudo ufw allow 9080/tcp
sudo ufw status
```

Do not open 80/443 for this project. Do not stop the other Nginx/apps on this VPS.

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

- `NGINX_HTTP_PORT=9080`
- `API_DOMAIN=72.60.74.221`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/Digital_EForm`
- `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` (your real Postgres user)
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,https://digitalform.florosense.com`
- `JAVA_OPTS=-Xmx512m` (use `-Xmx256m` if `free -h` shows under ~5 GB RAM)

Save in nano: `Ctrl+O`, Enter, `Ctrl+X`.

`JWT_SECRET` must be the **same** for all five services (one value in this file is enough; Compose passes it to every container).

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

First boot can take several minutes (Maven download + Hibernate tables). If RAM is low, build one service at a time:

```bash
cd ~/eform
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
docker compose up -d --build
```

Watch status:

```bash
docker compose ps
docker compose logs -f
```

Wait until `auth`, `pm`, `previsit`, `calibration`, and `installation` are **healthy**. Nginx starts only after that. Exit logs with `Ctrl+C` (containers keep running).

---

## Step 8 — Test backends (before frontend)

**On the VPS:**

```bash
curl -s http://127.0.0.1:9080/
# expect: eform-api

docker compose exec auth wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec pm wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec previsit wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec calibration wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec installation wget -qO- http://127.0.0.1:8080/actuator/health
```

Each health line should include `"status":"UP"`.

**From your PC** (PowerShell):

```powershell
curl http://72.60.74.221:9080/
curl.exe -i -X POST http://72.60.74.221:9080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"YOUR_USER@example.com\",\"password\":\"YOUR_PASS\"}"
```

- Timeout = Hostinger/firewall blocking 9080
- 502 = API container not ready
- 400/401 = Nginx reached Auth (good)

| URL | Service |
|-----|---------|
| `http://72.60.74.221:9080/api/auth/...` | Auth (`/login` uses `email` + `password`) |
| `http://72.60.74.221:9080/api/pm_reports/...` | PM |
| `http://72.60.74.221:9080/api/previsit-reports/...` | Pre-visit |
| `http://72.60.74.221:9080/api/calibration-reports/...` | Calibration |
| `http://72.60.74.221:9080/api/installation-reports/...` | Installation |
| `http://72.60.74.221:9080/uploads/previsit-images/...` | Pre-visit files |
| `http://72.60.74.221:9080/uploads/installation-images/...` | Installation files |

In Postman: login, copy the JWT, send `Authorization: Bearer <token>` to the report APIs. Create one report per module and upload images. Then on the VPS:

```bash
docker compose restart previsit installation
ls ~/eform/data/previsit-uploads ~/eform/data/installation-uploads
```

Files must still be there.

Optional UI: on your PC run the frontend with every `VITE_*` URL set to `http://72.60.74.221:9080` (no trailing slash). That is local HTTP → VPS HTTP, so mixed-content does not apply.

---

## Step 9 — Leave production frontend on Render

Do not change `https://digitalform.florosense.com` yet. After you later add a domain and HTTPS, set all `VITE_*` URLs to that origin, rebuild the frontend, then retire Render.

---

## If something fails

```bash
docker compose logs -f auth
docker compose ps
docker compose down    # stops only eform-* containers; keeps ~/eform/data
```

This Compose project uses container names `eform-*`. `docker compose down` does not remove sensor-bridge, duton-dashboard, Redis, or the shared Postgres image.

### `ERR_CONNECTION_TIMED_OUT` from the browser (`http://72.60.74.221:9080`)

The APIs are healthy on the VPS, but Hostinger's **cloud firewall** (or your ISP) is blocking port 9080 from the internet. `ufw` on the VM is not enough.

1. In Hostinger hPanel: Firewall / Security → allow **TCP 9080**.
2. On the VPS: `sudo ufw allow 9080/tcp`
3. From your Windows PC: `curl http://72.60.74.221:9080/` — you must see `eform-api` before the frontend can register.

Temporary test without opening 9080 — SSH tunnel, then point Vite at localhost:

```powershell
ssh -L 9080:127.0.0.1:9080 dev_user@72.60.74.221
```

Set every `VITE_*` URL in `frontend/.env` to `http://localhost:9080` and restart Vite.

After changing Auth Java code, rebuild that service:

```bash
cd ~/eform
docker compose up -d --build auth
```

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
