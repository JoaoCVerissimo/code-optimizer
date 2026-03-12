FROM python:3.12-slim
RUN useradd -m -u 1000 sandbox
RUN mkdir -p /code /results /harness && chown sandbox:sandbox /results
COPY apps/worker/src/sandbox/harness/run_python.py /harness/run.py
USER sandbox
WORKDIR /code
CMD ["python", "/harness/run.py"]
