from django.urls import path
from .views import HybridSearchView

urlpatterns = [
    path('', HybridSearchView.as_view(), name='hybrid-search'),
]
