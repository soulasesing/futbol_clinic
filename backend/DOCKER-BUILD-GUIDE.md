# Docker Build Guide - Futbol Clinic Backend

## 🔧 Fixed Issues

The Dockerfile has been updated to fix SSL certificate errors during build:

- ✅ Added CA certificates update
- ✅ Configured yarn with SSL handling
- ✅ Added network timeout for slow connections
- ✅ Multi-stage build for smaller image

## 🚀 Quick Start

### Option 1: Build with Yarn (Main Dockerfile)

```bash
cd backend

# Build the image
docker build -t futbol-clinic-backend:latest .

# If build is successful, run it
docker run -d \
  --name futbol-backend \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://postgres:postgres123@host.docker.internal:5432/futbol_clinic" \
  -e JWT_SECRET="your-super-secure-jwt-secret-at-least-32-characters-long" \
  -e FRONTEND_URL="http://localhost:3000" \
  -e PORT="4000" \
  futbol-clinic-backend:latest

# Check logs
docker logs -f futbol-backend

# Test health endpoint
curl http://localhost:4000/api/health
```

### Option 2: Build with NPM (Alternative)

If you still have issues with Yarn, use the NPM version:

```bash
cd backend

# Build using NPM Dockerfile
docker build -f Dockerfile.npm -t futbol-clinic-backend:latest .

# Run (same as above)
docker run -d \
  --name futbol-backend \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://postgres:postgres123@host.docker.internal:5432/futbol_clinic" \
  -e JWT_SECRET="your-super-secure-jwt-secret-at-least-32-characters-long" \
  futbol-clinic-backend:latest
```

### Option 3: Use Docker Compose (Recommended)

The easiest way is to use docker-compose from the root:

```bash
cd ..  # Go to project root
docker-compose up --build
```

## 🐛 Troubleshooting

### Issue: Still Getting SSL Errors

If you still see SSL certificate errors, try these solutions:

**Solution 1: Clear Docker Cache**
```bash
docker builder prune -a
docker build --no-cache -t futbol-clinic-backend:latest .
```

**Solution 2: Use Host Network (Mac/Linux)**
```bash
docker build --network=host -t futbol-clinic-backend:latest .
```

**Solution 3: Configure Docker DNS**
Add to your `~/.docker/daemon.json`:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
Then restart Docker Desktop.

**Solution 4: Use NPM Instead**
```bash
docker build -f Dockerfile.npm -t futbol-clinic-backend:latest .
```

### Issue: Database Connection Failed

If your container starts but can't connect to the database:

**On Mac/Windows (Docker Desktop):**
```bash
# Use host.docker.internal instead of localhost
-e DATABASE_URL="postgresql://postgres:postgres123@host.docker.internal:5432/futbol_clinic"
```

**On Linux:**
```bash
# Use your machine's IP or the docker bridge IP
-e DATABASE_URL="postgresql://postgres:postgres123@172.17.0.1:5432/futbol_clinic"
```

### Issue: Port Already in Use

```bash
# Check what's using port 4000
lsof -i :4000

# Stop existing container
docker stop futbol-backend
docker rm futbol-backend

# Or use a different port
docker run -d --name futbol-backend -p 4001:4000 ...
```

### Issue: Permission Denied for Uploads

```bash
# Exec into container and check permissions
docker exec -it futbol-backend sh
ls -la /app/public/uploads

# If needed, rebuild with proper permissions
docker-compose down -v
docker-compose up --build
```

## 📊 Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs
docker logs futbol-backend
docker logs -f futbol-backend  # Follow logs

# Exec into container
docker exec -it futbol-backend sh

# Stop container
docker stop futbol-backend

# Remove container
docker rm futbol-backend

# Remove image
docker rmi futbol-clinic-backend:latest

# View image size
docker images | grep futbol

# Clean up everything
docker system prune -a --volumes
```

## 🔍 Verify Build Success

After building, check:

```bash
# 1. Check image exists
docker images | grep futbol-clinic-backend

# 2. Check image size (should be ~200-300MB)
docker inspect futbol-clinic-backend:latest | grep Size

# 3. Run and test health
docker run -d --name test-backend -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="test-secret-key-at-least-32-chars" \
  futbol-clinic-backend:latest

# 4. Wait 10 seconds for startup
sleep 10

# 5. Test health endpoint
curl http://localhost:4000/api/health

# 6. Check logs for errors
docker logs test-backend

# 7. Cleanup
docker stop test-backend && docker rm test-backend
```

## 📝 Environment Variables

Required environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:5432/futbol_clinic
JWT_SECRET=your-secret-at-least-32-characters-long
FRONTEND_URL=http://localhost:3000
PORT=4000
```

Optional environment variables:

```bash
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password
NODE_ENV=production
DATABASE_MAX_CONNECTIONS=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000
```

## 🎯 Production Deployment

For production, make sure to:

1. ✅ Use strong JWT_SECRET (at least 32 characters)
2. ✅ Use secure DATABASE_URL with strong password
3. ✅ Enable HTTPS/TLS
4. ✅ Set NODE_ENV=production
5. ✅ Configure proper logging
6. ✅ Set up monitoring and health checks
7. ✅ Use secrets management (AWS Secrets Manager, etc.)
8. ✅ Configure proper backup strategy

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## 🆘 Still Having Issues?

1. Check Docker Desktop is running and updated
2. Verify you have internet connection
3. Try restarting Docker Desktop
4. Check firewall/antivirus settings
5. Try building on a different network
6. Use the NPM Dockerfile alternative
7. Check the logs: `docker logs container-name`

