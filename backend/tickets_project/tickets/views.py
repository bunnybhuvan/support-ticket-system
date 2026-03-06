from django.db.models import Count, Min, Max, Q
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Ticket
from .serializers import TicketSerializer, ClassifyRequestSerializer
from .llm import classify_ticket


class TicketListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        qs = Ticket.objects.all()

        category = self.request.query_params.get('category')
        priority = self.request.query_params.get('priority')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if category:
            qs = qs.filter(category=category)
        if priority:
            qs = qs.filter(priority=priority)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TicketDetailView(generics.UpdateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    http_method_names = ['patch']


@api_view(['GET'])
def stats_view(request):
    """
    Aggregated ticket statistics using DB-level ORM queries only.
    No Python-level iteration over querysets.
    """
    totals = Ticket.objects.aggregate(
        total=Count('id'),
        open_count=Count('id', filter=Q(status='open')),
        earliest=Min('created_at'),
    )

    total_tickets = totals['total']
    open_tickets = totals['open_count']

    # avg tickets per day: total / number of days since first ticket
    avg_per_day = 0.0
    if total_tickets > 0 and totals['earliest']:
        days_active = max((timezone.now() - totals['earliest']).days, 1)
        avg_per_day = round(total_tickets / days_active, 1)

    # DB-level group-by for priority and category
    priority_rows = (
        Ticket.objects.values('priority')
        .annotate(count=Count('id'))
    )
    category_rows = (
        Ticket.objects.values('category')
        .annotate(count=Count('id'))
    )

    priority_breakdown = {p[0]: 0 for p in Ticket.PRIORITY_CHOICES}
    for row in priority_rows:
        priority_breakdown[row['priority']] = row['count']

    category_breakdown = {c[0]: 0 for c in Ticket.CATEGORY_CHOICES}
    for row in category_rows:
        category_breakdown[row['category']] = row['count']

    return Response({
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "avg_tickets_per_day": avg_per_day,
        "priority_breakdown": priority_breakdown,
        "category_breakdown": category_breakdown,
    })


@api_view(['POST'])
def classify_view(request):
    """
    Accepts {"description": "..."} and returns LLM-suggested category + priority.
    Returns 200 with null values if LLM is unavailable — never blocks ticket creation.
    """
    serializer = ClassifyRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = classify_ticket(serializer.validated_data['description'])

    if result is None:
        return Response({
            "suggested_category": None,
            "suggested_priority": None,
            "llm_available": False,
        })

    return Response({**result, "llm_available": True})
