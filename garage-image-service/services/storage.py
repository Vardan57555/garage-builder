import os
import json
from datetime import datetime
from typing import List, Dict, Optional


class StorageService:
    """
    Manages file storage for generated images and metadata.
    Handles saving, listing, and deleting image files and their associated metadata.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        """
        Initialize the storage service.
        
        Args:
            output_dir: Directory path for storing generated images
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def save_image(self, image_data: bytes, filename: str) -> str:
        """
        Save image data to file.
        
        Args:
            image_data: Raw image bytes
            filename: Name for the image file
            
        Returns:
            Full path to the saved file
        """
        file_path = os.path.join(self.output_dir, filename)
        
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        return file_path
    
    def save_metadata(self, metadata: Dict, filename: str) -> str:
        """
        Save metadata as JSON file.
        
        Args:
            metadata: Dictionary containing metadata
            filename: Name for the metadata file
            
        Returns:
            Full path to the saved metadata file
        """
        file_path = os.path.join(self.output_dir, filename)
        
        with open(file_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        return file_path
    
    def get_metadata(self, image_filename: str) -> Optional[Dict]:
        """
        Retrieve metadata for a specific image.
        
        Args:
            image_filename: Name of the image file
            
        Returns:
            Metadata dictionary or None if not found
        """
        metadata_path = os.path.join(self.output_dir, f"{image_filename}.json")
        
        if not os.path.exists(metadata_path):
            return None
        
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except Exception:
            return None
    
    def list_files(self, extension: str = ".png") -> List[Dict]:
        """
        List all generated images with metadata.
        
        Args:
            extension: File extension to filter by
            
        Returns:
            List of dictionaries containing file information
        """
        files = []
        
        if not os.path.exists(self.output_dir):
            return files
        
        for filename in os.listdir(self.output_dir):
            if not filename.endswith(extension):
                continue
            
            file_path = os.path.join(self.output_dir, filename)
            
            try:
                stat = os.stat(file_path)
                
                # Try to load metadata
                metadata = self.get_metadata(filename)
                
                file_info = {
                    "filename": filename,
                    "size": stat.st_size,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "url": f"/outputs/{filename}",
                    "metadata": metadata
                }
                
                files.append(file_info)
                
            except Exception as e:
                # Skip files that can't be read
                continue
        
        # Sort by creation time, newest first
        files.sort(key=lambda x: x['created'], reverse=True)
        
        return files
    
    def delete_file(self, filename: str) -> bool:
        """
        Delete an image file and its metadata.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        file_path = os.path.join(self.output_dir, filename)
        metadata_path = f"{file_path}.json"
        
        success = True
        
        # Delete image file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                success = False
        
        # Delete metadata file
        if os.path.exists(metadata_path):
            try:
                os.remove(metadata_path)
            except Exception:
                pass  # Metadata deletion failure is not critical
        
        return success
    
    def get_storage_stats(self) -> Dict:
        """
        Get statistics about stored files.
        
        Returns:
            Dictionary with storage statistics
        """
        files = self.list_files()
        
        total_size = sum(f['size'] for f in files)
        total_size_mb = round(total_size / (1024 * 1024), 2)
        
        return {
            "total_files": len(files),
            "total_size_bytes": total_size,
            "total_size_mb": total_size_mb,
            "oldest_file": files[-1]['created'] if files else None,
            "newest_file": files[0]['created'] if files else None
        }
    
    def cleanup_old_files(self, max_age_days: int = 30) -> int:
        """
        Delete files older than specified age.
        
        Args:
            max_age_days: Maximum age in days
            
        Returns:
            Number of files deleted
        """
        deleted_count = 0
        current_time = datetime.now().timestamp()
        max_age_seconds = max_age_days * 24 * 60 * 60
        
        files = self.list_files()
        
        for file_info in files:
            file_age = current_time - datetime.fromisoformat(file_info['created']).timestamp()
            
            if file_age > max_age_seconds:
                if self.delete_file(file_info['filename']):
                    deleted_count += 1
        
        return deleted_count
