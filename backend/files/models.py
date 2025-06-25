
import os
import hashlib
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

def get_file_hash(file_obj):
    """Generate SHA256 hash for a file object"""
    hasher = hashlib.sha256()
    for chunk in file_obj.chunks():
        hasher.update(chunk)
    return hasher.hexdigest()

def upload_to(instance, filename):
    """Generate upload path based on file hash"""
    # Use first 2 characters of hash for directory structure
    hash_prefix = instance.file_hash[:2]
    return f'files/{hash_prefix}/{instance.file_hash}'

class File(models.Model):
    filename = models.CharField(max_length=255)
    file_hash = models.CharField(max_length=64, unique=True, db_index=True)
    size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    file_path = models.FileField(upload_to=upload_to)
    upload_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-upload_date']
    
    def __str__(self):
        return f"{self.filename} ({self.file_hash[:8]}...)"

class UserFile(models.Model):
    """Many-to-many relationship between users and files"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    original_filename = models.CharField(max_length=255)
    upload_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('user', 'file', 'original_filename')
        ordering = ['-upload_date']
    
    def __str__(self):
        return f"{self.user.username} - {self.original_filename}"
