# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (bcrypt) and CA certificates
RUN apk add --no-cache python3 make g++ ca-certificates

# Update CA certificates
RUN update-ca-certificates

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies, including devDependencies required for the build.
RUN yarn install --frozen-lockfile --network-timeout 100000

# Copy source code
COPY . .
RUN mkdir -p public/uploads

# Build TypeScript to JavaScript
RUN yarn build

# ============================================
# Stage 2: Production Stage
# ============================================
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install runtime dependencies for native modules and CA certificates
RUN apk add --no-cache python3 make g++ ca-certificates

# Update CA certificates
RUN update-ca-certificates

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies.
RUN yarn install --frozen-lockfile --production --network-timeout 100000

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy public assets prepared in the build stage.
COPY --from=builder /app/public ./public

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads && \
    chown -R node:node /app

# Create non-root user for security (node user already exists in alpine)
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/ready', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"] 