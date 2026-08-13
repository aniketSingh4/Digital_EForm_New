# Deploy backend microservices on Hostinger (IP access, no domain)

This VPS (`srv997517`, user `dev_user`) already has Docker. Other stacks are present (`nginx:alpine`, `postgres:15-alpine`, `redis`, sensor-bridge, duton-dashboard). **Do not bind ports 80 or 443.** The e-form APIs listen on **9080**.

There is no domain yet. From your laptop you call:

`http://YOUR_SERVER_IP:9080/api/...`

Docker Compose service names (`auth`, `pm`, `previsit`, `calibration`, `installation`) resolve **only inside** the `eform` Docker network. They are not public hostnames.

**Do not point the live HTTPS frontend at this HTTP IP.** Browsers block mixed content (`https://digitalform.florosense.com` → `http://IP:9080`). Test APIs with `curl`, Postman, or a local Vite app. Switch the production frontend only after you have HTTPS (or keep using Render until then).

**RAM:** 4 GB minimum, 8 GB recommended. On 4 GB set `JAVA_OPTS=-Xmx256m`.

---

## 1. Inspect the server (do this first)

```bash
hostname          # srv997517
free -h
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
ss -tlnp | grep -E ':80|:443|:5432|:9080'
sudo systemctl status postgresql --no-pager
```

Note:

- Which ports are already taken (especially 80, 443, 5432).
- Whether Postgres is a **host** service (`systemctl`) or a **container** (`docker ps` showing `postgres`).
- This stack will use **9080**. If 9080 is busy, set `NGINX_HTTP_PORT` in `.env` to another free port.

---

## 2. Docker is already installed — skip the installer

You already ran `docker images` as `dev_user`. Confirm Compose:

```bash
docker compose version
```

If that fails, you are not in the `docker` group:

```bash
sudo usermod -aG docker "$USER"
# log out and back in, then retry
```

---

## 3. Open only the API port

```bash
sudo ufw allow OpenSSH
sudo ufw allow 9080/tcp
sudo ufw status
```

Do not open 8086–8090. Do not steal 80/443 from the other apps.

---

## 4. Copy the project onto the VPS

From your Windows PC (PowerShell), replace `YOUR_SERVER_IP`:

```powershell
scp -r C:\Users\admin\Desktop\Digital_Installation_PM_Visit_E-Form_System dev_user@YOUR_SERVER_IP:/home/dev_user/eform
```

Or on the VPS, clone from git:

```bash
cd ~
git clone YOUR_REPO_URL eform
cd ~/eform
```

Then:

```bash
cd ~/eform
cp .env.example .env
mkdir -p data/previsit-uploads data/installation-uploads
sudo chown -R 100:100 data
```

Edit `.env` (`nano .env`):

| Variable | What to put |
|----------|-------------|
| `NGINX_HTTP_PORT` | `9080` unless that port is taken |
| `API_DOMAIN` | The VPS public IP (label only) |
| `SPRING_DATASOURCE_URL` | See step 5 |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | Real Postgres user |
| `JWT_SECRET` | One long random string, **same for all five services** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,https://digitalform.florosense.com` |
| `JAVA_OPTS` | `-Xmx512m` or `-Xmx256m` |

Generate a JWT secret:

```bash
openssl rand -base64 48
```

---

## 5. Point the containers at PostgreSQL

### If Postgres is installed on the host (`systemctl` is active)

```bash
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"
```

Set `listen_addresses = '*'` in `postgresql.conf`. In `pg_hba.conf` add:

```
host    all    all    172.16.0.0/12    scram-sha-256
```

(Use `md5` if that is how the user was created.)

```bash
sudo -u postgres psql -c 'CREATE DATABASE "Digital_EForm";'
sudo systemctl reload postgresql
```

`.env` URL:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/Digital_EForm
```

### If Postgres is already a Docker container (you have `postgres:15-alpine`)

```bash
docker ps --filter ancestor=postgres:15-alpine
```

If it publishes `5432` on the host, the same `host.docker.internal` URL works. If it is only on another Compose network, either publish 5432 or put `Digital_EForm` on that instance and set the JDBC host to that container name (you would then attach this stack to that network — prefer publishing 5432 for a first test).

Create the database:

```bash
docker exec -it CONTAINER_NAME psql -U postgres -c 'CREATE DATABASE "Digital_EForm";'
```

Test from a throwaway container:

```bash
docker run --rm --add-host=host.docker.internal:host-gateway postgres:15-alpine \
  psql "postgresql://USER:PASSWORD@host.docker.internal:5432/Digital_EForm" -c 'SELECT 1;'
```

---

## 6. Build and start (does not touch existing images)

This creates **new** images (`eform-auth`, etc.) and containers (`eform-auth`, `eform-nginx`, …). It does not replace sensor-bridge, duton-dashboard, or the existing `nginx:alpine` / `postgres` images.

Maven builds are heavy. If RAM is low, build one service at a time:

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
docker compose up -d --build
```

Wait a few minutes (Hibernate creates tables; healthchecks have a 90s start period):

```bash
docker compose ps
docker compose logs -f
```

Every service should become `healthy`. Nginx stays down until the five APIs are healthy.

---

## 7. Test the backends (no frontend yet)

Replace `YOUR_SERVER_IP` with the VPS public IP. From the VPS:

```bash
curl -s http://127.0.0.1:9080/
# expect: eform-api

docker compose exec auth wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec pm wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec previsit wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec calibration wget -qO- http://127.0.0.1:8080/actuator/health
docker compose exec installation wget -qO- http://127.0.0.1:8080/actuator/health
```

From your laptop (firewall must allow 9080):

```bash
curl -s http://YOUR_SERVER_IP:9080/
curl -i -X POST http://YOUR_SERVER_IP:9080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_USER@example.com","password":"YOUR_PASS"}'
```

A 400/401 means Nginx reached Auth. A 502/504 means the API is not up. A timeout means 9080 is blocked.

| Call this URL | Reaches container |
|---------------|-------------------|
| `http://IP:9080/api/auth/...` | auth |
| `http://IP:9080/api/pm_reports/...` | pm |
| `http://IP:9080/api/previsit-reports/...` | previsit |
| `http://IP:9080/api/calibration-reports/...` | calibration |
| `http://IP:9080/api/installation-reports/...` | installation |
| `http://IP:9080/uploads/previsit-images/...` | previsit |
| `http://IP:9080/uploads/installation-images/...` | installation |

Use Postman: login, copy the JWT, send `Authorization: Bearer <token>` to the report APIs. Create one report in each module and upload a pre-visit and installation image. Then:

```bash
docker compose restart previsit installation
```

Files must still exist under `~/eform/data/`.

Optional: run the frontend **locally** (`npm run dev`) with all `VITE_*` URLs set to `http://YOUR_SERVER_IP:9080` (no trailing slash). That is HTTP-to-HTTP, so mixed-content does not apply.

---

## 8. Leave the production frontend on Render until HTTPS exists

The live site `https://digitalform.florosense.com` cannot call `http://YOUR_SERVER_IP:9080`. When you have a domain and a certificate, set every `VITE_*` URL to `https://api.yourdomain.com`, rebuild the frontend, then retire the Render APIs.

Until then, keep Render as the production API.

---

## Useful commands

```bash
docker compose logs -f auth
docker compose ps
docker compose down          # stops eform containers only; keeps ./data
```

This Compose project uses container names `eform-*`. `docker compose down` does not remove sensor-bridge, duton-dashboard, Redis, or the shared Postgres image.
