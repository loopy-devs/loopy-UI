FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Create entrypoint script with environment variables
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "VITE_API_URL=$VITE_API_URL" > .env' >> /app/entrypoint.sh && \
    echo 'echo "VITE_REOWN_PROJECT_ID=$VITE_REOWN_PROJECT_ID" >> .env' >> /app/entrypoint.sh && \
    echo 'npm run build' >> /app/entrypoint.sh && \
    echo 'npm run start' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
