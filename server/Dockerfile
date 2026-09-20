# Production Dockerfile for Node.js Backend
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
