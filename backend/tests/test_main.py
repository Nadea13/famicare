import pytest

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data
