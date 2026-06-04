FROM node:20-alpine

WORKDIR /app

# Salin package.json dan package-lock.json ke container
COPY package*.json ./

# Install dependencies (hanya dependensi production)
RUN npm ci --only=production

# Salin folder server dan database schema yang dibutuhkan server
COPY server/ ./server/
COPY database/ ./database/

# Expose port default Hugging Face Spaces (7860)
EXPOSE 7860

# Set variabel lingkungan default
ENV PORT=7860
ENV NODE_ENV=production

# Perintah untuk menjalankan server backend
CMD ["node", "server/index.js"]
