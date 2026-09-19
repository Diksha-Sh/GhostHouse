# How to Fix CORS on AWS API Gateway & Lambda for Ghost House

If your Vercel dashboard or browser console displays a CORS error when fetching from:
`https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy/logs`

This guide shows you the exact steps to enable CORS on AWS so that your dashboard can read the live feed.

---

## 1. The Quick Fix in Your AWS Lambda Function

In your AWS Lambda function that handles `/logs` (and the main decoy routes), ensure that the returned dictionary includes the `headers` object with `Access-Control-Allow-Origin: *`.

### Example (Python Lambda Handler):

```python
import json

def lambda_handler(event, context):
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    
    # Define CORS headers
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }

    # Handle Preflight OPTIONS request
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": ""
        }

    # When returning the /logs route
    path = event.get("path") or event.get("rawPath", "")
    if path.endswith("/logs"):
        logs = get_logs_from_dynamodb()  # your existing query
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps(logs)
        }

    # For standard responses
    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"status": "running"})
    }
```

---

## 2. If Using AWS API Gateway Console Directly

### If using HTTP API Gateway (API Gateway v2):
1. Go to **AWS API Gateway Console**.
2. Click on your API: `ghostHouseDecoy`.
3. In the left sidebar, click **CORS**.
4. Click **Configure**:
   * **Access-Control-Allow-Origin:** `*`
   * **Access-Control-Allow-Methods:** `GET`, `POST`, `OPTIONS`
   * **Access-Control-Allow-Headers:** `Content-Type`, `Authorization`
5. Click **Save**.

### If using REST API Gateway:
1. Go to your API -> **Resources** -> select `/logs`.
2. Click **Actions** -> **Enable CORS**.
3. Keep default values (`Access-Control-Allow-Origin: '*'`) and click **Enable CORS and replace existing CORS headers**.
4. **CRITICAL STEP**: Click **Actions** -> **Deploy API** -> select your stage (`default` or `prod`) and click **Deploy**.

---

## 3. How to Test When It's Working

Run this in PowerShell or terminal:

```bash
curl.exe -i -s "https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy/logs"
```

Look for this line in the response:
```http
Access-Control-Allow-Origin: *
```

As soon as that line appears, your Vercel dashboard will automatically stream the logs in real time!
