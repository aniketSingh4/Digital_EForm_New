# Deploy backend microservices on a Hostinger VPS

Five Spring Boot APIs run in Docker Compose. Nginx exposes path-based routes on one hostname. PostgreSQL stays on the host (not in Docker). The React frontend is not deployed here; point its `VITE_*` URLs at this API host after go-live.

**RAM:** about 4 GB minimum, 8 GB recommended (five JVMs). On 4 GB set `JAVA_OPTS=-Xmx256m` in `.env`.

---

## 1. SSH in and check the box

```bash
ssh root@YOUR_VPS_IP
free -h
sudo systemctl status postgresql
ss -tlnp | grep -E ':80|:443|:5432'
```

If Apache or another Nginx already binds 80/443, stop it **or** use that host proxy as the TLS terminator (see HTTPS option B below).

```bash
sudo systemctl stop apache2 nginx
sudo systemctl disable apache2 nginx
```

---

## 2. Install Docker Engine and Compose

Use the official Docker packages (not snap):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
docker compose version
```

Log out and back in if you added your user to the `docker` group.

---

## 3. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Do **not** open 8086–8090. Only Nginx is public.

---

## 4. Clone the repo and create `.env`

```bash
sudo mkdir -p /opt/eform
sudo chown "$USER":"$USER" /opt/eform
git clone YOUR_REPO_URL /opt/eform
cd /opt/eform
cp .env.example .env
```

Edit `.env`:

| Variable | Notes |
|----------|--------|
| `API_DOMAIN` | Hostname whose A record points at this VPS (e.g. `api.yourdomain.com`) |
| `SPRING_DATASOURCE_URL` | Keep `jdbc:postgresql://host.docker.internal:5432/Digital_EForm` unless the DB name differs |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | Host Postgres credentials |
| `JWT_SECRET` | Long random string; **must be the same** for Auth and every report service |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins, e.g. `https://digitalform.florosense.com` |
| `JAVA_OPTS` | `-Xmx512m` (8 GB VPS) or `-Xmx256m` (4 GB VPS) |

```bash
mkdir -p data/previsit-uploads data/installation-uploads
# Alpine `adduser -S spring` is typically UID 100
sudo chown -R 100:100 data
```

In Hostinger DNS, create an A record: `api.yourdomain.com` → VPS public IP.

---

## 5. Let Docker reach host PostgreSQL

Containers resolve the VPS as `host.docker.internal`. Postgres must accept connections from the Docker bridge, not only `127.0.0.1`.

Find config files:

```bash
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"
```

In `postgresql.conf`:

```
listen_addresses = '*'
```

In `pg_hba.conf` add (use `scram-sha-256` or `md5` to match how the user was created):

```
host    all    all    172.16.0.0/12    scram-sha-256
```

Create the database if it does not exist:

```bash
sudo -u postgres psql -c 'CREATE DATABASE "Digital_EForm";'
```

Reload:

```bash
sudo systemctl reload postgresql
```

Quick test from a throwaway container:

```bash
docker run --rm --add-host=host.docker.internal:host-gateway postgres:16 \
  psql "postgresql://USER:PASSWORD@host.docker.internal:5432/Digital_EForm" -c 'SELECT 1;'
```

---

## 6. Build and start

Maven image builds need RAM. If the VPS is tight, build one service at a time:

```bash
cd /opt/eform
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

Wait until healthchecks pass (first boot can take a few minutes while Hibernate updates schema):

```bash
docker compose ps
docker compose logs -f
curl -s http://127.0.0.1/
curl -s http://127.0.0.1/actuator/health   # will 404 at Nginx; check a backend:
docker compose exec auth wget -qO- http://127.0.0.1:8080/actuator/health
```

Useful:

```bash
docker compose logs -f auth
docker compose restart nginx
docker compose down    # stops containers; does not delete ./data uploads
```

---

## 7. HTTPS

### Option A — certificates in the Nginx container (Let's Encrypt)

Install certbot on the host and use the webroot already mounted at `nginx/www`:

```bash
sudo apt-get install -y certbot
sudo certbot certonly --webroot -w /opt/eform/nginx/www \
  -d api.yourdomain.com --email you@yourdomain.com --agree-tos
```

Copy (or symlink) certs into the repo mount:

```bash
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/eform/nginx/certs/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /opt/eform/nginx/certs/
sudo chmod 644 /opt/eform/nginx/certs/fullchain.pem
sudo chmod 600 /opt/eform/nginx/certs/privkey.pem
```

Uncomment the `listen 443 ssl` server block in `nginx/default.conf`, then:

```bash
docker compose exec nginx nginx -s reload
```

Renewal: after `certbot renew`, copy the files again and reload Nginx. A cron job can wrap that.

### Option B — host Nginx/Apache already terminates TLS

Keep Compose Nginx on localhost only by changing published ports in `docker-compose.yml` to `"127.0.0.1:8080:80"`, then proxy from the host:

```
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 25m;
}
```

---

## 8. Frontend cutover

The SPA still lives wherever it is hosted today (for example `https://digitalform.florosense.com`). After the API hostname serves HTTPS, set **all** Vite URLs to that single origin (no trailing slash) in `frontend/.env`:

```
VITE_AUTH_SERVICE_URL=https://api.yourdomain.com
VITE_PM_SERVICE_URL=https://api.yourdomain.com
VITE_PREVISIT_SERVICE_URL=https://api.yourdomain.com
VITE_CALIBRATION_SERVICE_URL=https://api.yourdomain.com
VITE_INSTALLATION_SERVICE_URL=https://api.yourdomain.com
```

Rebuild and redeploy the frontend. Path suffixes (`/api/auth`, `/api/pm_reports`, `/uploads/previsit-images`, …) stay the same.

Ensure `CORS_ALLOWED_ORIGINS` in the VPS `.env` includes the frontend origin.

---

## 9. Optional: copy data from Render

Schema is created by Hibernate (`ddl-auto=update`) on first start. To copy existing rows:

```bash
pg_dump -Fc YOUR_RENDER_DATABASE_URL > eform.dump
pg_restore --no-owner --role=postgres -d Digital_EForm eform.dump
```

Prefer restoring **before** or immediately after first boot so Hibernate is not fighting an empty vs full schema. If tables already exist, restore with `--data-only` after a backup.

---

## 10. Verify, then retire Render

- `curl -i https://api.yourdomain.com/api/auth/login` (or your login path) — expect 400/401, not 502
- Log in from the frontend
- Create a report in PM, pre-visit, calibration, and installation
- Upload a pre-visit image and an installation image; run `docker compose restart previsit installation` and confirm files remain under `./data/`
- Confirm the browser does not show CORS errors from `https://digitalform.florosense.com`

When that is stable, delete the five Render web services.

---

## Routes (Nginx)

| Public path | Container |
|-------------|-----------|
| `/api/auth` | auth |
| `/api/pm_reports` | pm |
| `/api/previsit-reports` | previsit |
| `/api/calibration-reports` | calibration |
| `/api/installation-reports` | installation |
| `/uploads/previsit-images/` | previsit |
| `/uploads/installation-images/` | installation |
