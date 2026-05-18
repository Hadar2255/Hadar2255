FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
COPY garmin_mcp/ garmin_mcp/

RUN pip install --no-cache-dir .

ENV GARMIN_EMAIL=""
ENV GARMIN_PASSWORD=""

CMD ["garmin-mcp"]
