FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 libgomp1 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent ./agent
COPY shared ./shared
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser
RUN python -m livekit.agents download-files
CMD ["python", "-m", "agent.main", "start"]
