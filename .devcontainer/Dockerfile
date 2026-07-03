FROM mcr.microsoft.com/devcontainers/python:3.12-bookworm

# Installing poetry
RUN pip install poetry

# Select /local as the working directory
WORKDIR /local

# Copy Poetry configuration files
ADD pyproject.toml /local/

# Install dependencies
RUN poetry config virtualenvs.create false && poetry install --no-root --no-ansi

# Exhibition at port 8000
EXPOSE 8000

# Copy only the application code
COPY . /local/

# Add Poetry-installed executables (e.g. celery) to the PATH
ENV PATH=/home/vscode/.local/bin:$PATH

# Switch to non-root user
USER vscode
