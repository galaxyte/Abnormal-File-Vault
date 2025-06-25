
from rest_framework import serializers
from .models import File, UserFile

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'filename', 'file_hash', 'size', 'file_type', 'upload_date')
        read_only_fields = ('id', 'file_hash', 'upload_date')

class UserFileSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source='file.filename', read_only=True)
    file_hash = serializers.CharField(source='file.file_hash', read_only=True)
    size = serializers.IntegerField(source='file.size', read_only=True)
    file_type = serializers.CharField(source='file.file_type', read_only=True)
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserFile
        fields = ('id', 'filename', 'file_hash', 'size', 'file_type', 'upload_date', 'download_url', 'original_filename')
        read_only_fields = ('id', 'upload_date')
    
    def get_download_url(self, obj):
        return f"/api/files/{obj.id}/download/"

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    def validate_file(self, value):
        # Add file validation here if needed
        max_size = 100 * 1024 * 1024  # 100MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 100MB")
        return value
