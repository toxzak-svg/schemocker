# Production Deployment Guide

This guide covers deploying Schemock in production environments with best practices for security, performance, and reliability.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Security Hardening](#security-hardening)
3. [Performance Tuning](#performance-tuning)
4. [Monitoring and Logging](#monitoring-and-logging)
5. [High Availability](#high-availability)
6. [Backup and Recovery](#backup-and-recovery)
7. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (176/176)
- [ ] Code coverage > 80%
- [ ] No critical security vulnerabilities
- [ ] Dependency audit clean (`npm audit`)
- [ ] TypeScript strict mode enabled
- [ ] ESLint warnings resolved

### Build Verification
- [ ] Executable builds without errors
- [ ] File size reasonable (~65-75MB)
- [ ] Version number correct
- [ ] Build metadata generated
- [ ] Documentation up to date

### Functionality Testing
- [ ] Start server with default schema
- [ ] Start server with custom schema
- [ ] Watch mode functioning
- [ ] Init command creates projects
- [ ] Install command launches UI
- [ ] All CLI flags working
- [ ] Error handling proper
- [ ] Graceful shutdown working

## Security Hardening

### Input Validation

All user inputs are validated and sanitized:

```typescript
// Port validation
validatePort(port)  // 1-65535, no injection

// File path validation
validateFilePath(path)  // No traversal, no null bytes

// Schema validation
validateSchema(schema)  // Proper JSON schema structure

// String sanitization
sanitizeString(input)  // Remove control chars, limit length
```

### Security Features Implemented

1. **Path Traversal Protection**
   - All file paths validated against traversal attacks
   - Absolute paths rejected
   - Dangerous patterns blocked (`..`, `~`, `$`)
   - Null byte injection prevented

2. **Input Sanitization**
   - Control characters removed
   - Shell injection characters blocked
   - String length limits enforced
   - Unicode normalization

3. **Request Size Limits**
   ```typescript
   app.use(express.json({ limit: '10mb' }))
   ```

4. **Prototype Pollution Prevention**
   - `__proto__`, `constructor`, `prototype` blocked in paths
   - Object property access controlled

5. **CORS Configuration**
   ```typescript
   // Configurable per deployment
   cors: true  // or custom config
   ```

### Recommended Security Practices

#### 1. Run as Non-Privileged User
```powershell
# Create dedicated user (Windows)
net user schemock-service /add
runas /user:schemock-service schemock.exe
```

#### 2. Use Non-Privileged Ports
```bash
# Use ports > 1024 (no admin rights required)
schemock start schema.json --port 3000
```

#### 3. Network Isolation
- Run behind reverse proxy (nginx, IIS)
- Use firewall rules to restrict access
- Enable HTTPS at proxy level

#### 4. File System Permissions
```powershell
# Restrict executable permissions
icacls schemock.exe /deny Users:W
```

## Performance Tuning

### Resource Configuration

#### Memory Management
```typescript
// Node.js flags (if running from source)
NODE_OPTIONS="--max-old-space-size=2048"

// Monitor memory usage
log.info('Memory usage', {
  heapUsed: process.memoryUsage().heapUsed / 1024 / 1024
});
```

#### Request Handling
- Async/await used throughout
- No blocking operations in request handlers
- Efficient JSON parsing
- Connection pooling automatic (Express)

### Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Startup Time | < 2s | ~1.5s |
| Request Latency (GET) | < 50ms | ~10-30ms |
| Request Latency (POST) | < 100ms | ~20-50ms |
| Memory Usage (Idle) | < 100MB | ~60-80MB |
| Memory Usage (Load) | < 500MB | ~150-300MB |
| Concurrent Requests | > 100 | 200+ |

### Optimization Tips

1. **Schema Caching**
   - Parsed schemas are cached in memory
   - Watch mode only reloads on file change

2. **Lazy Loading**
   - Chokidar imported dynamically
   - Only loaded when watch mode enabled

3. **Response Compression**
   ```typescript
   // Add compression middleware if needed
   npm install compression
   app.use(compression());
   ```

4. **Rate Limiting**
   ```typescript
   // For production, consider rate limiting
   npm install express-rate-limit
   ```

## Monitoring and Logging

### Log Levels

```typescript
// Set log level via CLI
schemock start schema.json --log-level debug

// Available levels: error, warn, info, debug
```

#### Log Level Usage

- **error**: Critical failures requiring immediate attention
- **warn**: Important events that might need investigation
- **info**: General operational messages (default)
- **debug**: Detailed diagnostic information

### Log Format

```
[2025-12-24T10:30:00.123Z] INFO  Mock server started | port=3000 url="http://localhost:3000"
[2025-12-24T10:30:01.456Z] INFO  GET /api/data - 200 (15ms)
[2025-12-24T10:30:05.789Z] WARN  Route not found | method=GET path=/unknown
[2025-12-24T10:30:10.012Z] ERROR Failed to parse schema | error="Invalid JSON"
```

### Structured Logging

All logs include context:

```typescript
log.info('Request processed', {
  module: 'server',
  method: 'GET',
  path: '/api/data',
  statusCode: 200,
  duration: 15
});
```

### Log Aggregation

For production environments, redirect logs to file:

```powershell
# Redirect stdout/stderr to file
.\schemock.exe start schema.json --log-level info > logs\schemock.log 2>&1

# Or use log rotation service
# - Windows Event Log
# - Splunk
# - ELK Stack
# - CloudWatch (AWS)
```

### Monitoring Metrics

Key metrics to monitor:

1. **Server Health**
   - Uptime
   - Request count
   - Error rate
   - Response times

2. **Resource Usage**
   - CPU utilization
   - Memory consumption
   - Disk I/O
   - Network throughput

3. **Application Metrics**
   - Schema reload count
   - Active connections
   - Request queue length

### Health Check Endpoint

```bash
# Built-in health check
GET http://localhost:3000/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-12-24T10:30:00.123Z",
  "uptime": 3600
}
```

## High Availability

### Deployment Patterns

#### 1. Single Instance (Development)
```
Client -> Schemock.exe
```

#### 2. Load Balanced (Production)
```
                    ┌─> Schemock Instance 1
Client -> Load Balancer -> Schemock Instance 2
                    └─> Schemock Instance 3
```

#### 3. Reverse Proxy (Recommended)
```
Client -> Nginx/IIS -> Schemock.exe
```

### Load Balancing Configuration

#### Windows Network Load Balancing (NLB)

```powershell
# Install NLB feature
Install-WindowsFeature NLB -IncludeManagementTools

# Create NLB cluster
New-NlbCluster -InterfaceName "Ethernet" -ClusterName "SchemockCluster" -ClusterPrimaryIP 192.168.1.100
```

#### Nginx Reverse Proxy

```nginx
upstream schemock_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://schemock_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Process Management

#### Windows Service

```powershell
# Install NSSM (Non-Sucking Service Manager)
choco install nssm

# Create service
nssm install Schemock "C:\path\to\schemock.exe" start schema.json --port 3000

# Configure service
nssm set Schemock AppDirectory "C:\path\to\"
nssm set Schemock AppStdout "C:\path\to\logs\stdout.log"
nssm set Schemock AppStderr "C:\path\to\logs\stderr.log"

# Start service
nssm start Schemock
```

#### Task Scheduler (Alternative)

```powershell
# Create scheduled task to run at startup
$action = New-ScheduledTaskAction -Execute "C:\path\to\schemock.exe" -Argument "start schema.json --port 3000"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
Register-ScheduledTask -TaskName "Schemock Server" -Action $action -Trigger $trigger -Principal $principal
```

## Backup and Recovery

### Configuration Backup

```powershell
# Backup critical files
$backupDir = "C:\backups\schemock\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $backupDir -Force

Copy-Item *.json -Destination $backupDir
Copy-Item *.bat -Destination $backupDir
Copy-Item docs\ -Destination "$backupDir\docs\" -Recurse
Copy-Item examples\ -Destination "$backupDir\examples\" -Recurse
```

### Disaster Recovery

#### Backup Strategy

1. **Daily**: Configuration files and schemas
2. **Weekly**: Full application backup
3. **Monthly**: Archived backups (retention)

#### Recovery Procedure

```powershell
# 1. Stop service
Stop-Service Schemock -ErrorAction SilentlyContinue

# 2. Restore from backup
Copy-Item "$backupDir\*" -Destination "C:\path\to\schemock\" -Recurse -Force

# 3. Verify integrity
.\schemock.exe --version
.\schemock.exe start examples\user-schema.json --port 3000 &

# 4. Test health check
Invoke-WebRequest -Uri http://localhost:3000/health

# 5. Restart service
Start-Service Schemock
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Symptoms**: `Error: Port 3000 is already in use`

**Solution**:
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process-id> /F

# Or use different port
.\schemock.exe start schema.json --port 3001
```

#### 2. Schema Not Found

**Symptoms**: `File not found: schema.json`

**Solution**:
```powershell
# Use absolute path
.\schemock.exe start C:\full\path\to\schema.json

# Or navigate to schema directory
cd C:\schemas
C:\tools\schemock.exe start user-schema.json
```

#### 3. High Memory Usage

**Symptoms**: Memory consumption > 500MB

**Solution**:
```powershell
# Check for memory leaks
# Restart service
Restart-Service Schemock

# Monitor with Task Manager or
Get-Process schemock | Select-Object CPU, PM, WS
```

#### 4. Slow Response Times

**Symptoms**: Requests taking > 1 second

**Solution**:
```powershell
# Enable debug logging
.\schemock.exe start schema.json --log-level debug

# Check for:
# - Complex schemas (simplify)
# - Network latency
# - Concurrent request limits
# - Resource constraints
```

### Debug Mode

```powershell
# Enable maximum verbosity
.\schemock.exe start schema.json --log-level debug

# Check logs for:
# - Request timing
# - Schema parsing performance
# - Memory usage
# - Error stack traces
```

### Support Resources

- **GitHub Issues**: https://github.com/toxzak-svg/schemock-app/issues
- **Documentation**: See docs/ folder
- **Build Guide**: BUILD-GUIDE.md
- **API Reference**: docs/api-documentation.md

## Best Practices Summary

1. ✅ Use non-privileged ports (>1024)
2. ✅ Enable appropriate log level
3. ✅ Run behind reverse proxy in production
4. ✅ Implement health checks
5. ✅ Monitor resource usage
6. ✅ Regular backups
7. ✅ Use Windows Service for automatic startup
8. ✅ Keep dependencies updated
9. ✅ Test disaster recovery procedures
10. ✅ Document your configuration

## Performance Checklist

- [ ] Log level appropriate for environment
- [ ] CORS configured correctly
- [ ] Request size limits set
- [ ] Health check endpoint accessible
- [ ] Monitoring in place
- [ ] Backup strategy defined
- [ ] Recovery procedure tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-24 | Initial production release |

---

**Note**: This deployment guide assumes Windows environment. For Linux/macOS deployments, adapt commands accordingly.
