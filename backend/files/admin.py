
from django.contrib import admin
from .models import File, UserFile

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('filename', 'file_hash', 'size', 'file_type', 'upload_date')
    list_filter = ('file_type', 'upload_date')
    search_fields = ('filename', 'file_hash')
    readonly_fields = ('file_hash', 'upload_date')

@admin.register(UserFile)
class UserFileAdmin(admin.ModelAdmin):
    list_display = ('user', 'original_filename', 'file', 'upload_date')
    list_filter = ('upload_date',)
    search_fields = ('user__username', 'original_filename', 'file__filename')
    readonly_fields = ('upload_date',)
