FROM oven/bun:1 AS base

RUN mkdir /app

ENV VERCEL_STORE_PATH=/var/vercel-blob-store

COPY ./dist/server.js /app

EXPOSE 6969

# Enable verbose logging and ensure stdout/stderr are not buffered
CMD [ "bun", "--verbose", "/app/server.js" ]
