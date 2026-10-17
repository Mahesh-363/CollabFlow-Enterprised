from django.urls import path
from .views import FileListUploadView, FileDetailView

urlpatterns = [
    path('', FileListUploadView.as_view(), name='file-list-upload'),
    path('<str:id>/', FileDetailView.as_view(), name='file-detail'),
]
