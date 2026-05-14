from database import engine
from models import Base
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from rag1.utils import (
    load_and_split,
    add_documents_to_db,
    get_vectorstore,
    get_response
)

app = FastAPI()
Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_history = []

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    docs = load_and_split(file_path)
    add_documents_to_db(docs)

    return {"message": f"{file.filename} uploaded successfully"}

@app.post("/chat")
def chat(query: str):

    vectorstore = get_vectorstore()

    answer, sources = get_response(
        vectorstore,
        query,
        chat_history
    )

    chat_history.append({
        "user": query,
        "assistant": answer
    })

    return {
        "answer": answer,
        "sources": sources
    }