from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOllama

def load_and_split(pdf_path):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )
    return splitter.split_documents(documents)

def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    return Chroma(
        persist_directory="./chroma_db",
        embedding_function=embeddings
    )

def add_documents_to_db(docs):
    vectorstore = get_vectorstore()
    vectorstore.add_documents(docs)
    vectorstore.persist()
    return vectorstore

def get_response(vectorstore, query):
    retriever = vectorstore.as_retriever()
    docs = retriever.invoke(query)

    llm = ChatOllama(model="llama3")
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
     You MUST answer ONLY from the provided context.

     If the answer is not present in the context, say:
     "I could not find this information in the provided documents."

     Context:
     {context}

     Question: {query}
     """

    response = llm.invoke(prompt)
    return response.content