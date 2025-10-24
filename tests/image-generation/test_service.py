#!/usr/bin/env python3
"""
Test script for the Garage Image Generation Service.
Run this after starting the service to verify it's working correctly.
"""

import requests
import time
import json
from typing import Dict, Any


class ImageServiceTester:
    """Test harness for the image generation service."""
    
    def __init__(self, base_url: str = "http://localhost:5001"):
        self.base_url = base_url
        self.test_results = []
    
    def test_health_check(self) -> bool:
        """Test the health check endpoint."""
        print("\n🔍 Testing health check endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Service is healthy")
                print(f"   Status: {data.get('status')}")
                print(f"   ComfyUI: {data.get('comfyui')}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Health check error: {str(e)}")
            return False
    
    def test_generate_garage(self) -> Dict[str, Any]:
        """Test generating a garage image."""
        print("\n🏗️  Testing garage image generation...")
        
        payload = {
            "width": 20,
            "length": 24,
            "height": 10,
            "roof_type": "gable",
            "color": "white",
            "building_type": "garage",
            "location": "suburban neighborhood",
            "style": "modern",
            "lighting": "daylight",
            "additional_features": ["windows", "side door"],
            "preview": True  # Use preview for faster testing
        }
        
        try:
            print("   Sending request...")
            start_time = time.time()
            
            response = requests.post(
                f"{self.base_url}/generate-image",
                json=payload,
                timeout=180  # 3 minutes timeout
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Garage generated successfully in {elapsed:.2f}s")
                print(f"   File: {result['file_url']}")
                print(f"   Generation time: {result['generation_time']:.2f}s")
                print(f"   Size: {result['image_size']}")
                return result
            else:
                print(f"❌ Generation failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return {}
                
        except Exception as e:
            print(f"❌ Generation error: {str(e)}")
            return {}
    
    def test_generate_shed(self) -> Dict[str, Any]:
        """Test generating a shed image."""
        print("\n🏚️  Testing shed image generation...")
        
        payload = {
            "width": 12,
            "length": 16,
            "height": 8,
            "roof_type": "gable",
            "color": "natural wood",
            "building_type": "shed",
            "location": "backyard garden",
            "style": "rustic",
            "lighting": "daylight",
            "additional_features": ["double doors", "windows"],
            "preview": True
        }
        
        try:
            print("   Sending request...")
            start_time = time.time()
            
            response = requests.post(
                f"{self.base_url}/generate-image",
                json=payload,
                timeout=180
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Shed generated successfully in {elapsed:.2f}s")
                print(f"   File: {result['file_url']}")
                print(f"   Generation time: {result['generation_time']:.2f}s")
                return result
            else:
                print(f"❌ Generation failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return {}
                
        except Exception as e:
            print(f"❌ Generation error: {str(e)}")
            return {}
    
    def test_list_outputs(self) -> bool:
        """Test listing generated images."""
        print("\n📋 Testing list outputs endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/outputs", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                file_count = len(data.get('files', []))
                total = data.get('total', 0)
                print(f"✅ Listed {file_count} files (total: {total})")
                
                if file_count > 0:
                    latest = data['files'][0]
                    print(f"   Latest: {latest['filename']} ({latest['size_mb']} MB)")
                
                return True
            else:
                print(f"❌ List failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ List error: {str(e)}")
            return False
    
    def test_get_image(self, filename: str) -> bool:
        """Test retrieving a specific image."""
        print(f"\n🖼️  Testing image retrieval: {filename}...")
        
        try:
            response = requests.get(
                f"{self.base_url}/outputs/{filename}",
                timeout=10
            )
            
            if response.status_code == 200:
                size_kb = len(response.content) / 1024
                print(f"✅ Image retrieved successfully ({size_kb:.2f} KB)")
                return True
            else:
                print(f"❌ Retrieval failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Retrieval error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence."""
        print("=" * 60)
        print("🧪 Garage Image Generation Service - Test Suite")
        print("=" * 60)
        
        # Test 1: Health check
        health_ok = self.test_health_check()
        
        if not health_ok:
            print("\n⚠️  Service is not healthy. Stopping tests.")
            return
        
        # Test 2: Generate garage
        garage_result = self.test_generate_garage()
        
        # Test 3: Generate shed
        shed_result = self.test_generate_shed()
        
        # Test 4: List outputs
        self.test_list_outputs()
        
        # Test 5: Get specific image
        if garage_result and 'file_url' in garage_result:
            filename = garage_result['file_url'].split('/')[-1]
            self.test_get_image(filename)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Test Summary")
        print("=" * 60)
        
        if garage_result and shed_result:
            print("✅ All tests passed!")
            print(f"\n🎉 Service is working correctly!")
            print(f"\nView your images at:")
            print(f"   Garage: {self.base_url}{garage_result.get('file_url')}")
            print(f"   Shed: {self.base_url}{shed_result.get('file_url')}")
        else:
            print("⚠️  Some tests failed. Check the output above.")


def main():
    """Main entry point."""
    import sys
    
    # Allow custom base URL
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5001"
    
    tester = ImageServiceTester(base_url)
    tester.run_all_tests()


if __name__ == "__main__":
    main()
