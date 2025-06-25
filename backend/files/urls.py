
from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserFileListView.as_view(), name='user-files'),
    path('upload/', views.upload_file, name='upload-file'),
    path('<int:file_id>/download/', views.download_file, name='download-file'),
    path('<int:file_id>/', views.delete_user_file, name='delete-file'),
    path('search/', views.search_files, name='search-files'),
]
