FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port (Internal to Docker Network)
EXPOSE 3000

# Start Application
CMD ["npm", "start"]
