# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# dùng npm ci tái lập môi trường build ổn định
RUN npm ci
COPY . .
# Nếu dùng Vite và deploy ở root domain, đảm bảo base="/" trong vite.config
RUN npm run build

# Serve stage
FROM nginx:alpine
# dọn thư mục html mặc định
RUN rm -rf /usr/share/nginx/html/*
# copy artifact FE
COPY --from=build /app/dist /usr/share/nginx/html
# cấu hình nginx cho SPA + cache
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
