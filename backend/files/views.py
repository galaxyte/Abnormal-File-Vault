
import os
import mimetypes
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import File, UserFile, get_file_hash
from .serializers import UserFileSerializer, FileUploadSerializer

class UserFileListView(generics.ListAPIView):
    serializer_class = UserFileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserFile.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    parser_classes = [MultiPartParser, FormParser]
    
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    uploaded_file = request.FILES['file']
    
    # Generate file hash
    file_hash = get_file_hash(uploaded_file)
    
    # Reset file pointer after hashing
    uploaded_file.seek(0)
    
    try:
        with transaction.atomic():
            # Check if file already exists
            existing_file, created = File.objects.get_or_create(
                file_hash=file_hash,
                defaults={
                    'filename': uploaded_file.name,
                    'size': uploaded_file.size,
                    'file_type': uploaded_file.content_type or 'application/octet-stream',
                    'file_path': uploaded_file
                }
            )
            
            # Create user-file relationship
            user_file, user_file_created = UserFile.objects.get_or_create(
                user=request.user,
                file=existing_file,
                original_filename=uploaded_file.name,
                defaults={
                    'original_filename': uploaded_file.name
                }
            )
            
            if not user_file_created:
                return Response({
                    'error': 'You have already uploaded this file',
                    'file': UserFileSerializer(user_file).data
                }, status=status.HTTP_409_CONFLICT)
            
            return Response({
                'message': 'File uploaded successfully' if created else 'File already exists, linked to your account',
                'file': UserFileSerializer(user_file).data,
                'deduplication_saved': not created
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'error': f'Upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_file(request, file_id):
    try:
        user_file = get_object_or_404(UserFile, id=file_id, user=request.user)
        file_obj = user_file.file
        
        if not file_obj.file_path or not os.path.exists(file_obj.file_path.path):
            raise Http404("File not found on disk")
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_obj.file_path.path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Read and return file
        with open(file_obj.file_path.path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{user_file.original_filename}"'
            response['Content-Length'] = file_obj.size
            return response
            
    except UserFile.DoesNotExist:
        raise Http404("File not found")

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_file(request, file_id):
    try:
        user_file = get_object_or_404(UserFile, id=file_id, user=request.user)
        
        # Check if other users have this file
        other_users_count = UserFile.objects.filter(file=user_file.file).exclude(user=request.user).count()
        
        # Delete the user-file relationship
        user_file.delete()
        
        # If no other users have this file, delete the actual file
        if other_users_count == 0:
            file_obj = user_file.file
            if file_obj.file_path and os.path.exists(file_obj.file_path.path):
                os.remove(file_obj.file_path.path)
            file_obj.delete()
        
        return Response({'message': 'File deleted successfully'}, status=status.HTTP_200_OK)
        
    except UserFile.DoesNotExist:
        raise Http404("File not found")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_files(request):
    query = request.GET.get('q', '')
    file_type = request.GET.get('type', '')
    
    queryset = UserFile.objects.filter(user=request.user)
    
    if query:
        queryset = queryset.filter(original_filename__icontains=query)
    
    if file_type:
        queryset = queryset.filter(file__file_type__icontains=file_type)
    
    serializer = UserFileSerializer(queryset, many=True)
    return Response(serializer.data)
