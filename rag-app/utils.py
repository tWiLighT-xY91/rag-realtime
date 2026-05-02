from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI

def load_and_split(pdf_path):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )
    return splitter.split_documents(documents)

def create_vectorstore(docs):
    embeddings = OpenAIEmbeddings()
    return FAISS.from_documents(docs, embeddings)

def get_response(vectorstore, query):
    retriever = vectorstore.as_retriever()
    docs = retriever.get_relevant_documents(query)

    llm = ChatOpenAI(temperature=0)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    Answer the question based only on the context below:
    {context}

    Question: {query}
    """

    return llm.predict(prompt)