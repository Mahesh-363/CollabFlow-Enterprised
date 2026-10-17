import os
from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import WorkspaceFile
from .serializers import WorkspaceFileSerializer, FileUploadSerializer

CATEGORY_MAP = {
    'pdf': 'document', 'doc': 'document', 'docx': 'document', 'xls': 'document', 'xlsx': 'document',
    'ppt': 'document', 'pptx': 'document', 'txt': 'document', 'md': 'document', 'csv': 'document',
    'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'svg': 'image', 'webp': 'image',
    'ts': 'code', 'tsx': 'code', 'js': 'code', 'jsx': 'code', 'py': 'code', 'json': 'code', 'yaml': 'code', 'yml': 'code', 'sql': 'code',
    'mp4': 'media', 'webm': 'media', 'mov': 'media', 'mp3': 'media', 'wav': 'media',
    'zip': 'archive', 'tar': 'archive', 'gz': 'archive', '7z': 'archive'
}


class FileListUploadView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        workspace_id = request.query_params.get('workspace_id') or request.headers.get('x-workspace-id')
        queryset = WorkspaceFile.objects.all()
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        file_type = request.query_params.get('type')
        if file_type and file_type != 'all':
            queryset = queryset.filter(file_type=file_type)

        search_param = request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(name__icontains=search_param)

        channel_id = request.query_params.get('channel_id')
        if channel_id:
            queryset = queryset.filter(channel_id=channel_id)

        return Response({
            'success': True,
            'files': WorkspaceFileSerializer(queryset[:100], many=True).data
        })

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.validated_data['file']
        channel_id = serializer.validated_data.get('channelId')
        task_id = serializer.validated_data.get('taskId')

        ext = os.path.splitext(uploaded_file.name)[1].lower().lstrip('.')
        file_type = CATEGORY_MAP.get(ext, 'document')

        workspace_id = request.data.get('workspace_id') or request.headers.get('x-workspace-id')
        from apps.workspaces.models import Workspace
        workspace = Workspace.objects.filter(id=workspace_id).first() or request.user.owned_workspaces.first()

        wf = WorkspaceFile.objects.create(
            workspace=workspace,
            uploaded_by=request.user,
            name=uploaded_file.name,
            file=uploaded_file,
            file_type=file_type,
            size_bytes=uploaded_file.size,
            mime_type=uploaded_file.content_type or '',
            channel_id=channel_id or None,
            task_id=task_id or None,
        )

        return Response({
            'success': True,
            'file': WorkspaceFileSerializer(wf).data
        }, status=status.HTTP_201_CREATED)


class FileDetailView(generics.RetrieveDestroyAPIView):
    queryset = WorkspaceFile.objects.all()
    serializer_class = WorkspaceFileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'
