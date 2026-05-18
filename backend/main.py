from database import engine
from models import Base
from sqlalchemy.orm import Session
from fastapi import Depends
from database import get_db
from models import Conversation, Message
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from rag1.utils import (
    load_and_split,
    add_documents_to_db,
    get_vectorstore,
    get_response,
)

app = FastAPI()
Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_memory = {}


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.post("/upload")
async def upload_pdf(conversation_id: int, file: UploadFile = File(...)):

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    docs = load_and_split(file_path)

    # attach metadata to every chunk
    for doc in docs:
        doc.metadata["conversation_id"] = conversation_id

    add_documents_to_db(docs)

    return {"message": f"{file.filename} uploaded successfully"}


@app.post("/conversations")
def create_conversation(db: Session = Depends(get_db)):

    new_convo = Conversation(title="New Chat")

    db.add(new_convo)
    db.commit()
    db.refresh(new_convo)

    return {"id": new_convo.id, "title": new_convo.title}


@app.get("/conversations")
def get_conversations(db: Session = Depends(get_db)):

    conversations = db.query(Conversation).all()

    return conversations


@app.get("/conversations/{conversation_id}")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):

    messages = (
        db.query(Message).filter(Message.conversation_id == conversation_id).all()
    )

    return messages


@app.post("/chat")
def chat(query: str, conversation_id: int, db: Session = Depends(get_db)):

    vectorstore = get_vectorstore()

    retriever = vectorstore.as_retriever(
        search_kwargs={"filter": {"conversation_id": conversation_id}}
    )

    if conversation_id not in conversation_memory:
        conversation_memory[conversation_id] = []

    chat_history = conversation_memory[conversation_id]

    answer, sources = get_response(retriever, query, chat_history)

    chat_history.append({"user": query, "assistant": answer})

    user_message = Message(conversation_id=conversation_id, role="user", content=query)

    db.add(user_message)
    db.commit()
    
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if (conversation and conversation.title == "New Chat"):
        conversation.title = query[:20]  # set title to first 20 chars of first query
        db.commit()



    ai_message = Message(
        conversation_id=conversation_id, role="assistant", content=answer
    )

    db.add(ai_message)
    db.commit()

    return {"answer": answer, "sources": sources}


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = (
        db.query(Conversation).filter(Conversation.id == conversation_id).first()
    )

    if not conversation:
        return {"error": "Conversation not found"}

    # delete messages first
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()

    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted successfully"}
