FROM golang:1.22-alpine
RUN adduser -D -u 1000 sandbox
RUN mkdir -p /code /results /harness && chown sandbox:sandbox /results
COPY apps/worker/src/sandbox/harness/run_go.go /harness/run.go
USER sandbox
WORKDIR /code
CMD ["go", "run", "/harness/run.go"]
