from locust import HttpUser, task

class MineGameUser(HttpUser):
    @task
    def test_connect(self):
        self.client.get("http://localhost:8080/connect")


        