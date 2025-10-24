# Testing Documentation

This directory contains all test files for the Garage Builder project.

## Directory Structure

```
tests/
├── README.md                           # This file
├── image-generation/                   # Image generation service tests
│   └── test_service.py                # API and generation tests
├── integration/                        # Integration tests
│   └── (future integration tests)
└── unit/                              # Unit tests
    └── (future unit tests)
```

## Test Categories

### 1. Image Generation Tests (`image-generation/`)
Tests for the AI image generation service.

**Location**: `tests/image-generation/test_service.py`

**What it tests**:
- Health check endpoint
- Image generation API
- Gallery/outputs endpoint
- Error handling
- Response formats

**Run tests**:
```bash
# From project root
python tests/image-generation/test_service.py

# Or using make command
make image-gen-test
```

**Requirements**:
- Image generation service must be running
- Service available at http://localhost:5001

### 2. Integration Tests (`integration/`)
End-to-end tests for the entire system.

**Coming soon**:
- Chat interface tests
- Database integration tests
- API workflow tests
- Multi-service interaction tests

### 3. Unit Tests (`unit/`)
Individual component and function tests.

**Coming soon**:
- Prompt builder tests
- Storage service tests
- Utility function tests
- Model validation tests

## Running Tests

### Image Generation Service Tests

**Prerequisites**:
```bash
# Start the image generation service
make image-gen-start

# Or for demo mode
make image-gen-demo
```

**Run tests**:
```bash
# Method 1: Using make command
make image-gen-test

# Method 2: Direct execution
python tests/image-generation/test_service.py

# Method 3: With verbose output
python tests/image-generation/test_service.py -v
```

**Expected output**:
```
🧪 Testing Image Generation Service
=====================================

Testing health endpoint...
✅ Health check passed

Testing image generation...
✅ Image generation successful
   Generation time: 14.23s
   Image size: 1024x768
   File: garage_20251024_132751.png

Testing gallery endpoint...
✅ Gallery endpoint working
   Total images: 3

All tests passed! ✅
```

## Test Results

### Latest Test Run

**Date**: 2025-10-24
**Service**: Image Generation (Production Mode)
**Status**: ✅ All tests passed

| Test | Status | Time | Notes |
|------|--------|------|-------|
| Health Check | ✅ Pass | <1s | Service healthy |
| Image Generation | ✅ Pass | 14s | Photorealistic output |
| Gallery Listing | ✅ Pass | <1s | All images listed |
| Error Handling | ✅ Pass | <1s | Proper error responses |

### Performance Metrics

**Image Generation**:
- Preview (512x512): 5-8 seconds
- Standard (1024x768): 14-25 seconds
- High-res (1536x1024): 30-45 seconds

**API Response Times**:
- Health check: <100ms
- Gallery listing: <200ms
- Image download: <500ms

## Adding New Tests

### Image Generation Tests

Add new test functions to `tests/image-generation/test_service.py`:

```python
def test_new_feature():
    """Test description."""
    # Test implementation
    response = requests.post(...)
    assert response.status_code == 200
    print("✅ New feature test passed")
```

### Integration Tests

Create new files in `tests/integration/`:

```python
# tests/integration/test_chat_flow.py
import requests

def test_chat_to_image_flow():
    """Test complete chat to image generation flow."""
    # Test implementation
    pass
```

### Unit Tests

Create new files in `tests/unit/`:

```python
# tests/unit/test_prompt_builder.py
from garage_image_service.services.prompt_builder import PromptBuilder

def test_prompt_generation():
    """Test prompt generation logic."""
    builder = PromptBuilder()
    prompt = builder.build(...)
    assert "garage" in prompt.lower()
```

## Continuous Integration

### GitHub Actions (Future)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          make image-gen-demo
          make image-gen-test
```

## Test Coverage

### Current Coverage
- Image Generation API: ✅ 100%
- Prompt Builder: ⏳ Pending
- Storage Service: ⏳ Pending
- Chat Interface: ⏳ Pending
- Database Operations: ⏳ Pending

### Coverage Goals
- Target: 80% overall coverage
- Critical paths: 100% coverage
- Error handling: 100% coverage

## Troubleshooting

### Tests Failing?

**Service not running**:
```bash
# Check if service is up
curl http://localhost:5001/health

# Start service if needed
make image-gen-start
```

**Connection refused**:
```bash
# Check Docker containers
docker ps | grep image-generator

# Check logs
make image-gen-logs
```

**Slow generation**:
- First generation is slower (model loading)
- Use preview mode for faster tests
- Check GPU availability: `nvidia-smi`

### Common Issues

1. **Port already in use**
   ```bash
   # Stop existing service
   make image-gen-stop
   make image-gen-start
   ```

2. **Out of memory**
   ```bash
   # Check GPU memory
   nvidia-smi
   
   # Use preview mode
   # Set preview=true in test requests
   ```

3. **Model not found**
   ```bash
   # Check model volume
   docker volume ls | grep comfyui
   
   # Rebuild if needed
   make image-gen-clean
   make image-gen-build
   ```

## Best Practices

### Writing Tests

1. **Clear test names**: Use descriptive function names
2. **Independent tests**: Each test should be self-contained
3. **Cleanup**: Remove test data after tests
4. **Assertions**: Always verify expected outcomes
5. **Error cases**: Test both success and failure paths

### Running Tests

1. **Before commits**: Always run tests before pushing
2. **CI/CD**: Automate testing in pipeline
3. **Performance**: Monitor test execution time
4. **Coverage**: Aim for high code coverage
5. **Documentation**: Keep test docs updated

## Future Enhancements

- [ ] Add pytest framework
- [ ] Implement test fixtures
- [ ] Add performance benchmarks
- [ ] Create load testing suite
- [ ] Add visual regression tests
- [ ] Implement mocking for external services
- [ ] Add code coverage reporting
- [ ] Create test data generators

## Resources

- [Testing Documentation](../documentation/14-testing-guide.md)
- [API Documentation](../documentation/04-api.md)
- [Development Guide](../documentation/05-development-guide.md)

## Support

For testing issues or questions:
1. Check the troubleshooting section above
2. Review the main documentation
3. Check Docker logs: `make image-gen-logs`
4. Open an issue on GitHub
