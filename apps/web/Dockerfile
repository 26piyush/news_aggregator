FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/web/ ./apps/web/

RUN cd apps/web && npm run build

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Custom nginx configuration for SPA routing
RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://api:5000/api/;\n\
    }\n\
    location /health {\n\
        proxy_pass http://api:5000/health;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
