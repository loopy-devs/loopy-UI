# Use Node 20 for Solana wallet adapter compatibility
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Create entrypoint script that injects env vars and builds at runtime
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "VITE_API_URL=$VITE_API_URL" > .env' >> /app/entrypoint.sh && \
    echo 'npm run build' >> /app/entrypoint.sh && \
    echo 'npx serve dist -s -l tcp://0.0.0.0:$PORT' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Expose port (Railway will override with $PORT)
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
