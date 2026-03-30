import json
import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class ReportConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time report updates."""

    async def connect(self):
        await self.channel_layer.group_add('reports', self.channel_name)
        await self.accept()
        logger.info(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('reports', self.channel_name)
        logger.info(f"WebSocket disconnected: {self.channel_name}")

    async def report_new(self, event):
        """Broadcast new report to all connected clients."""
        await self.send_json({
            'type': 'new_report',
            'report': event['report'],
        })
