#!/usr/bin/env python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/notifications/?token=52bd1b9fb85936051de8310674c22b8598b03036"
    try:
        print(f"Attempting to connect to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("WebSocket connected successfully!")
            # Keep connection open for a few seconds
            await asyncio.sleep(5)
            print("Test completed successfully")
    except Exception as e:
        print(f"WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
