FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Set working directory
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./
COPY mcp/package.json mcp/package-lock.json ./mcp/

# Install root dependencies
RUN npm install
RUN npm install -g http-server

# Install mcp server dependencies
WORKDIR /app/mcp
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Expose MCP server port
EXPOSE 3000

# Make start script executable
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
