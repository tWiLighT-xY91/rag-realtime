import streamlit as st
import os
from utils import load_and_split, get_vectorstore, get_response, add_documents_to_db

st.title("📚 AI Study Assistant")

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
    

uploaded_files = st.file_uploader("Upload PDFs", type="pdf", accept_multiple_files=True)

vectorstore = None

# Step 1: Handle vectorstore(persistent memory part)

if os.path.exists("./chroma_db"):
    vectorstore = get_vectorstore()

if uploaded_files:
    for file in uploaded_files:
        with open(file.name, "wb") as f:
            f.write(file.read())

        docs = load_and_split(file.name)
        vectorstore = add_documents_to_db(docs)

# Step 2: ALWAYS show input (failed in the first attempt, cause I was too dumb to notice)
query = st.text_input("Ask a question:")

# Step 3: Handle logic
if query:
    if vectorstore is None:
        st.warning("Please upload a PDF first.")
    else:
        answer, sources = get_response(
                vectorstore,
                query,
                st.session_state.chat_history
               )
        st.write("### Answer:")
        st.write(answer)
        st.session_state.chat_history.append(
         {"user": query, "assistant": answer}
          )
        st.write("### Sources:")
        for source in sources:
            st.write(f"- {source}")