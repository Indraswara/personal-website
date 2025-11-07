FROM nginx:alpine

# Copy website files to nginx
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY data.js /usr/share/nginx/html/
COPY content /usr/share/nginx/html/content/
COPY assets /usr/share/nginx/html/assets/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY posts /usr/share/nginx/html/posts/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
