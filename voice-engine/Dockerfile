# Use the official Node.js LTS image as base
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all Node.js dependencies
RUN npm install

# Copy all application source files
COPY . .

# Expose port 5050 to other containers in the Docker network
EXPOSE 5050

# Start the Express server using nodemon for development
CMD ["npm", "run", "dev"]
