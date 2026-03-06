from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'category', 'priority', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_category(self, value):
        valid = [c[0] for c in Ticket.CATEGORY_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f"Must be one of: {valid}")
        return value

    def validate_priority(self, value):
        valid = [p[0] for p in Ticket.PRIORITY_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f"Must be one of: {valid}")
        return value

    def validate_status(self, value):
        valid = [s[0] for s in Ticket.STATUS_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f"Must be one of: {valid}")
        return value


class ClassifyRequestSerializer(serializers.Serializer):
    description = serializers.CharField(min_length=10)
