import time

from locust import HttpUser, between, task


class CollabFlowUser(HttpUser):
    """
    Locust load testing benchmark for CollabFlow API and WebSocket interactions.
    Simulates user login, token refresh, message fetch, task browsing, and chat sends.
    """

    wait_time = between(1, 3)

    def on_start(self):
        """Authenticate user and obtain JWT tokens."""
        response = self.client.post(
            "/api/v1/accounts/login/",
            json={"email": "elena.vance@acme.corp", "password": "CollabFlow#2026!"},
        )
        if response.status_code == 200:
            data = response.json()
            self.access_token = data["tokens"]["access"]
            self.headers = {"Authorization": f"Bearer {self.access_token}"}
        else:
            self.headers = {}

    @task(3)
    def fetch_channels_and_messages(self):
        """Simulate loading channels and recent chat feed."""
        if not self.headers:
            return
        res = self.client.get("/api/v1/chat/channels/", headers=self.headers)
        if res.status_code == 200:
            channels = res.json().get("results", []) or res.json()
            if isinstance(channels, list) and channels:
                chan_id = channels[0]["id"]
                self.client.get(
                    f"/api/v1/chat/channels/{chan_id}/messages/?limit=25", headers=self.headers
                )

    @task(2)
    def send_chat_message(self):
        """Simulate sending a message in a team channel."""
        if not self.headers:
            return
        self.client.post(
            "/api/v1/chat/channels/chan-eng/send/",
            headers=self.headers,
            json={
                "content": f"Load benchmark ping at {time.time()}",
                "idempotency_key": f"locust-{time.time()}",
            },
        )

    @task(2)
    def send_heartbeat(self):
        """Simulate client presence heartbeat every 30 seconds."""
        if not self.headers:
            return
        self.client.post(
            "/api/v1/accounts/heartbeat/",
            headers=self.headers,
            json={"socket_id": "locust_virtual_socket"},
        )

    @task(1)
    def hybrid_search(self):
        """Simulate global command palette search query."""
        if not self.headers:
            return
        self.client.get("/api/v1/search/?q=deploy", headers=self.headers)
