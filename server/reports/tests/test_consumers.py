import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from channels.testing import WebsocketCommunicator
from reports.consumers import ReportConsumer


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestReportConsumer:
    async def test_connect(self):
        communicator = WebsocketCommunicator(ReportConsumer.as_asgi(), "/ws/reports/")
        connected, _ = await communicator.connect()
        assert connected
        await communicator.disconnect()

    async def test_report_new_event(self):
        communicator = WebsocketCommunicator(ReportConsumer.as_asgi(), "/ws/reports/")
        connected, _ = await communicator.connect()
        assert connected

        # Simulate report_new event
        await communicator.receive_nothing(timeout=0.1)
        await communicator.disconnect()
