FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . ./

EXPOSE 8765

CMD ["uv", "run", "--frozen", "python", "-m", "watchfiles", "python server.py", "/app"]
