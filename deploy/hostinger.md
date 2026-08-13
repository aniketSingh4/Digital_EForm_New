# Deploy backends on 72.60.74.221 (port 80)

This VPS (`srv997517`, user `dev_user`) already has Docker. The e-form APIs listen on **port 80** so Hostinger’s cloud firewall allows them. Duton-nginx (and anything else bound to 80/443) must be stopped first.

**How you reach the APIs**

- From your PC: `http://72.60.74.221/api/...`
- Docker names (`auth`, `pm`, `previsit`, `calibration`, `installation`) work **only inside** Docker. They are not public hostnames.

**Do not connect the live frontend yet.** The site is HTTPS; this API is HTTP. Browsers block mixed content (`https://digitalform.florosense.com` → `http://72.60.74.221`). Test with curl, Postman, or a local Vite app. Keep production on Render until you have HTTPS.

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
- Confirm **80 is free** after Step 3. If it is taken, stop the container that publishes 80.

---

## Step 3 — Free port 80 and allow it

Hostinger already allows **80**. Stop Duton/nginx (and anything else) bound to 80 or 443 so eform-nginx can use 80. **Do not stop** `duton-postgres` or Redis — the e-form APIs use that database.

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
sudo ufw status
ss -tlnp | grep -E ':80|:443'
```

Port 80 should now be unused. Do not start Duton-nginx again while eform uses 80.

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
- `API_DOMAIN=72.60.74.221`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/Digital_EForm`
- `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` (your real Postgres user)
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://digitalform.florosense.com`
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
curl -s http://127.0.0.1/
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
curl http://72.60.74.221/
curl.exe -i -X POST http://72.60.74.221/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"YOUR_USER@example.com\",\"password\":\"YOUR_PASS\"}"
```

- Timeout = Hostinger/firewall blocking 80, or Duton-nginx still bound to 80
- 502 = API container not ready
- 400/401 = Nginx reached Auth (good)

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

Optional UI: on your PC run the frontend with every `VITE_*` URL set to `http://72.60.74.221` (no trailing slash). That is local HTTP → VPS HTTP, so mixed-content does not apply.

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
curl -s http://127.0.0.1/
```

You want `eform-api`. From Windows: `curl http://72.60.74.221/` must also return `eform-api`.

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

You should see `eform-api`. Then set every `VITE_*` URL to `http://72.60.74.221/eform` (no trailing slash) and restart Vite.

After `docker compose down` / `up`, run `docker network connect eform_eform duton-nginx` again.

**Option C — open 9080 in Hostinger**

hPanel → VPS → Firewall → allow TCP **9080**. Then `curl.exe http://72.60.74.221:9080/` from Windows must return `eform-api`.

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
