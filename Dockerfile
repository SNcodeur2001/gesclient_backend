FROM node:20 AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma files
COPY prisma ./prisma

# Generate Prisma client with native binaries (disable platform check)
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20 AS runner
WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Environment variables
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/src/main.js"]