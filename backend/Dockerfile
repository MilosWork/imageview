FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies (production). If you need dev deps for nodemon, use a dev image or mount node_modules.
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

EXPOSE 4000

ENV PORT=4000

CMD ["node", "index.js"]
