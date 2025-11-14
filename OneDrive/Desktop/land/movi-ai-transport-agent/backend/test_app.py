from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/stops")
def stops():
    return [
        {"stop_id": 1, "name": "Campus Gate"},
        {"stop_id": 2, "name": "Tech Park"},
    ]
