# Railway Deployment — Tasaheel Backend

## Stack
- **Builder:** Nixpacks (auto-detects Java from `pom.xml` in `backend/`)
- **Config:** `nixpacks.toml` at repo root (overrides auto-detection)
- **Runtime:** Java 17, Maven build, JRE-alpine runtime

## Build Process

1. Railway clones the repo
2. Nixpacks reads `nixpacks.toml` → installs Maven
3. `mvn dependency:go-offline` — caches dependencies
4. `mvn clean package -DskipTests` — builds JAR
5. Artifact: `backend/target/tasaheel-backend-1.0.0.jar`

## Auto-Deploy

Push to the linked Railway branch → triggers deploy automatically.

Lock the branch in Railway Dashboard > Settings > Git Branch to prevent accidental deploys.

## Environment Variables

Set via Railway Dashboard > Variables. Required:

| Variable | Example |
|----------|---------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-xxx.supabase.co:5432/postgres` |
| `SPRING_DATASOURCE_USERNAME` | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | `your-supabase-password` |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `APPLICATION_JWT_SECRET` | `base64-256-bit-secret` |

## Health Check

Railway hits `GET /api/health` (or any 200 endpoint). Configure in Dashboard > Settings > Health Check Path.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build OOM | Maven uses too much memory | Set `MAVEN_OPTS=-Xmx256m -XX:+UseSerialGC` in variables |
| 502 after deploy | App not listening on `$PORT` | Ensure `server.port=${PORT:8080}` in `application.yml` |
| DB connection fail | Invalid JDBC URL or SSL | Use `?sslmode=require` for Supabase |
| Start timeout | App takes > 60s to start | Increase Railway Health Check timeout |
