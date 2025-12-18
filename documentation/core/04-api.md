# API Documentation

## Base URL

**Backend API**: `http://localhost:5003/api/v1`  
**Image Service**: `http://localhost:5001`

## Chat API (Main Endpoint)

The primary API for interacting with the garage builder assistant.

### Send Chat Message

```http
POST /api/v1/chat/
Content-Type: application/json
```

**Request Body**
```json
{
  "sessionId": "unique-session-id",
  "message": "I want to build a 20x24 garage"
}
```

**Response**
```json
{
  "response": "Great! I can help you with a 20x24 garage. What roof style would you prefer? Options include:\n- Gable\n- Hip\n- Gambrel\n- Flat",
  "sessionId": "unique-session-id",
  "params": {
    "building_type": "garage",
    "width": 20,
    "length": 24,
    "height": null,
    "roof_type": null,
    "color": null
  }
}
```

### Session Management

Sessions are managed automatically. Each `sessionId` maintains conversation state including:
- Collected building parameters
- Conversation history
- Current workflow step
- Selected add-ons

**Session Timeout**: 30 minutes of inactivity

## Building Service API

### Get Building Types

```http
GET /api/v1/buildings/types
```

**Response**
```json
{
  "types": ["garage", "shed", "carport", "barn"]
}
```

### Get Available Dimensions

```http
GET /api/v1/buildings/dimensions
```

**Response**
```json
{
  "widths": [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
  "lengths": [20, 21, 22, 24, 26, 28, 30, 32, 34, 36, 40],
  "heights": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
}
```

## Price Service API

### Calculate Price

```http
POST /api/v1/price/calculate
Content-Type: application/json
```

**Request Body**
```json
{
  "building_type": "garage",
  "width": 20,
  "length": 24,
  "height": 10,
  "roof_type": "gable",
  "state": "TX",
  "manufacturer_id": 1,
  "addons": ["windows", "side_door"]
}
```

**Response**
```json
{
  "base_price": 8500.00,
  "addons_price": 750.00,
  "tax": 740.00,
  "total_price": 9990.00,
  "breakdown": {
    "structure": 7500.00,
    "roof": 1000.00,
    "windows": 450.00,
    "side_door": 300.00
  }
}
```

## States Service API

### Get Available States

```http
GET /api/v1/states
```

**Response**
```json
{
  "states": [
    {"id": 1, "name": "Texas", "code": "TX", "tax_rate": 8.25},
    {"id": 2, "name": "California", "code": "CA", "tax_rate": 7.25}
  ]
}
```

## Manufacturer Service API

### Get Manufacturers

```http
GET /api/v1/manufacturers
```

**Response**
```json
{
  "manufacturers": [
    {"id": 1, "name": "Manufacturer A", "states": ["TX", "OK", "LA"]},
    {"id": 2, "name": "Manufacturer B", "states": ["CA", "AZ", "NV"]}
  ]
}
```

---

## Image Generation API (Port 5001)

### Generate Building Image

```http
POST /generate-image
Content-Type: application/json
```

**Request Body**
```json
{
  "width": 20,
  "length": 24,
  "height": 10,
  "roof_type": "gable",
  "color": "white",
  "building_type": "garage",
  "location": "suburban area",
  "style": "modern",
  "lighting": "daylight",
  "additional_features": ["windows", "side door"]
}
```

**Response**
```json
{
  "status": "success",
  "file_path": "/outputs/garage_20251218_093245.png",
  "file_url": "/outputs/garage_20251218_093245.png",
  "prompt_used": "A modern white garage with traditional gable roof...",
  "generation_time": 15.3
}
```

### List Generated Images

```http
GET /outputs
```

**Response**
```json
{
  "files": [
    {
      "filename": "garage_20251218_093245.png",
      "size": 2048576,
      "created": "2025-12-18T09:32:45",
      "url": "/outputs/garage_20251218_093245.png",
      "metadata": {...}
    }
  ]
}
```

### Get Specific Image

```http
GET /outputs/{filename}
```

**Response**: Image file (PNG)

### Delete Image

```http
DELETE /outputs/{filename}
```

**Response**
```json
{
  "status": "deleted",
  "filename": "garage_20251218_093245.png"
}
```

### Health Check

```http
GET /health
```

**Response**
```json
{
  "status": "healthy",
  "service": "image-generation",
  "mode": "demo"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Missing required field: width"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error description"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service unavailable",
  "details": "ComfyUI service not responding"
}
```

---

## WebSocket Events (Future)

The chat API may support WebSocket connections for real-time updates:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5003/ws');

// Send message
ws.send(JSON.stringify({
  type: 'chat',
  sessionId: 'session-123',
  message: 'I want a 20x24 garage'
}));

// Receive response
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.response);
};
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Consider implementing rate limiting per session
- Recommended: 60 requests/minute for chat API
- Recommended: 10 requests/minute for image generation
