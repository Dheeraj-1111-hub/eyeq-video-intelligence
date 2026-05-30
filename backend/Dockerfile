FROM node:20-alpine

# Install FFmpeg and Chromium dependencies for Puppeteer
RUN apk add --no-cache \
    ffmpeg \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome since we use the alpine one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 5000

# Use ts-node-dev or compile and run
CMD ["npm", "run", "dev"]
