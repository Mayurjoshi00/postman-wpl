FROM node:20

WORKDIR /app

# Copy backend package files
COPY portfolio-backend/package*.json ./
RUN npm install

# Copy backend code
COPY portfolio-backend ./portfolio-backend

# Copy frontend
COPY frontend ./frontend

EXPOSE 5000

CMD ["node", "portfolio-backend/server.js"]
