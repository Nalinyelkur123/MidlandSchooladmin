# ---- Build Stage ----
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the project
COPY . .

# Build the React app
RUN npm run build

# ---- Serve Stage ----
FROM nginx:stable-alpine

# Copy build output to Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy a default Nginx config (optional)
# Uncomment if you have a custom nginx.conf
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
