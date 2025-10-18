# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories that might be needed
RUN mkdir -p temp uploads/learning public/uploads

# Set proper permissions for temp and uploads directories
RUN chmod 755 temp uploads/learning public/uploads

# Expose the port the app runs on
EXPOSE 3000

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S brainjam -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R brainjam:nodejs /app
USER brainjam

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]