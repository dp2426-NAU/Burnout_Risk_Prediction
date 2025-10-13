# Multi-stage Docker build for ML Service - Created by Balaji Koneti
# Stage 1: Build dependencies
FROM python:3.9-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production image
FROM python:3.9-slim AS production

# Create non-root user
RUN groupadd -r mluser && useradd -r -g mluser mluser

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder stage
COPY --from=builder /root/.local /home/mluser/.local

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/models /app/data && \
    chown -R mluser:mluser /app

# Switch to non-root user
USER mluser

# Add user's local bin to PATH
ENV PATH=/home/mluser/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Start application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]