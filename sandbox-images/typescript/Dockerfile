FROM node:20-alpine
RUN deluser node 2>/dev/null; adduser -D -u 1000 sandbox
RUN npm install -g tsx
RUN mkdir -p /code /results /harness && chown sandbox:sandbox /results
COPY apps/worker/src/sandbox/harness/run_ts.mjs /harness/run.mjs
USER sandbox
WORKDIR /code
CMD ["npx", "tsx", "/harness/run.mjs"]
