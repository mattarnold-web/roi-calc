# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY public/ public/
COPY src/ src/

# CRA bakes env vars at build time.
# Client ID is not a secret — it's visible in the browser.
ENV REACT_APP_GOOGLE_CLIENT_ID=656706478564-iq4esuku3sklg0gdsr7heokilpskvnf0.apps.googleusercontent.com
ENV REACT_APP_ALLOWED_DOMAIN=augmentcode.com

# Override homepage so assets use relative paths (not GitHub Pages URL)
ENV PUBLIC_URL=/

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# Cloud Run injects PORT (default 8080). nginx must listen on it.
# Use envsubst to template the port into the config at startup.
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

