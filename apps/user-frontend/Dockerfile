FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

RUN npm run build

# Serve with lightweight server or node, assuming strict Separation
# For this demo, we use a simple serve since it's a static build (Vite)
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
