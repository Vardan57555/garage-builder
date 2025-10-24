# API Documentation

## Base URL
`http://localhost:5003/api/v1`

## Authentication

### Login
```http
POST /auth/login
```
**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**
```json
{
  "token": "jwt.token.here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

## Projects

### Get All Projects
```http
GET /projects
Authorization: Bearer <token>
```

### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Garage Project",
  "description": "A new garage design",
  "dimensions": {
    "width": 20,
    "length": 30,
    "height": 12
  }
}
```

## AI Endpoints

### Generate Design
```http
POST /ai/generate-design
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": 1,
  "style": "modern",
  "materials": ["brick", "metal_roof"]
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required"
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
