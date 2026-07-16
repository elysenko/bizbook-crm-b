# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Placeholder site — the source repo currently contains only README.md.
# When application code lands, replace this Dockerfile with a real build.
RUN rm -f /usr/share/nginx/html/index.html
COPY index.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
