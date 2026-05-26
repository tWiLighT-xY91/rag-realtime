from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOllama
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")
UPLOADS_PATH = os.path.join(BASE_DIR, "uploads")


def load_and_split(pdf_path):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    return splitter.split_documents(documents)


def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    return Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)


def add_documents_to_db(docs):
    vectorstore = get_vectorstore()
    vectorstore.add_documents(docs)
    vectorstore.persist()
    return vectorstore


def get_response(retriever, query, chat_history):

    docs = retriever.invoke(query)

    sources = []

    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", "N/A")

        source_info = f"{source} (Page {page + 1})"

        if source_info not in sources:
            sources.append(source_info)

    llm = ChatOllama(model="llama3")

    context = "\n".join([doc.page_content for doc in docs])

    conversation_context = ""

    for chat in chat_history:
        conversation_context += f"""
        User: {chat['user']}
        Assistant: {chat['assistant']}
        """

    prompt = f"""
    You MUST answer using:
    1. The provided document context
    2. The conversation history for continuity

    If the answer is not present in the documents, say:
    "I could not find this information in the provided documents."

    Conversation History:
    {conversation_context}

    Document Context:
    {context}

    Question:
    {query}
    """

    response = llm.invoke(prompt)

    return response.content, sources


def get_quiz_response(docs):

    llm = ChatOllama(model="qwen2.5:7b", format="json")

    context = "\n\n".join(docs)

    prompt = f"""
        You are a quiz generator.

        Based ONLY on the provided context, generate EXACTLY 5 multiple-choice questions.

        Return ONLY valid JSON.

        Do NOT write explanations outside JSON.
        Do NOT write markdown.
        Do NOT write text before or after JSON.
        Do NOT say "Here are the questions".

        STRICT JSON FORMAT:

        {{
            
            "quiz": [
                
                 {{
                     
                     "question": "Question text",
                     "options": [
                     "Option A",
                     "Option B",
                     "Option C",
                     "Option D"
           ],
            "correct_answer": 0,
            "explanation": "Short explanation"
          }}
    ]
    }}

        Context:
        
        {context}
       """

    response = llm.invoke(prompt)
    print(response.content)

    try:

        raw_response = response.content.strip()

        print("RAW RESPONSE:")
        print(response.content)

        quiz_json = json.loads(raw_response)

        quiz_items = quiz_json.get("quiz", [])

        return {"questions": quiz_items}

    except Exception as e:

        print("Raw LLM output:")
        print(response.content)

        print("Quiz JSON parsing failed:", e)

        return {"questions": []}
