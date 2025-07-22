# WhatsLand Deployment Instructions

## CORS Configuration

The application is currently configured to connect to the backend API at:
```
http://92.113.31.157:5001
```

If you deploy the backend on a different server or with a different port, you need to update the API URL in the following locations:

1. In `frontend/src/config/apiConfig.js`:
   ```javascript
   export const API_URL = import.meta.env.VITE_API_URL || 'http://YOUR_SERVER_IP:PORT';
   ```

2. In `prepare_deployment.js`, update the `.env.production` configuration:
   ```javascript
   fs.writeFileSync(
     path.join(FRONTEND_DIR, '.env.production'),
     'VITE_API_URL=http://YOUR_SERVER_IP:PORT'
   );
   ```

## Deployment Steps

1. **Prepare the application for deployment**:
   ```bash
   node prepare_deployment.js
   ```
   This script will configure environment files and update URLs.

2. **Start the application in production mode**:
   - On Linux/Mac:
     ```bash
     ./start_production.sh
     ```
   - On Windows:
     ```powershell
     .\start_production.ps1
     ```

## Server Configuration

If you're using a reverse proxy (Nginx, Apache) in front of your Node.js server, ensure your CORS headers are properly set:

### Nginx Example:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Important CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range' always;
        add_header 'Access-Control-Expose-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range' always;
    }
}
```

## Troubleshooting CORS Issues

If you still encounter CORS issues:

1. Check browser console errors to identify which URLs are being blocked.
2. Verify your backend server is accessible from the client (try using curl or Postman).
3. Ensure the Socket.IO server and API are running on the same domain or properly configured for cross-origin requests.
4. If using a service like cPanel, check if the server has any security rules blocking cross-origin requests.
5. Test using the included `frontend/debug.html` file to isolate Socket.IO connection issues.

### Debug Socket.IO Connection

Access the debug file via:
```
http://YOUR_SERVER/debug.html
```

This will help identify specific Socket.IO connection issues. 