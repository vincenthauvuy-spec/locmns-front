# Étape 1 : Build Angular
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod -R 755 node_modules/.bin && npm run build -- --configuration production

# Étape 2 : Nginx
FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/locmns.conf
COPY --from=builder /app/dist/locmns-front/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]