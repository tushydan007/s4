from django.urls import path

from . import views

app_name = "reports"

urlpatterns = [
    path("", views.ReportListView.as_view(), name="report-list"),
    path("create/", views.ReportCreateView.as_view(), name="report-create"),
    path("<uuid:pk>/", views.ReportDetailView.as_view(), name="report-detail"),
    path("my-reports/", views.UserReportsView.as_view(), name="user-reports"),
]
