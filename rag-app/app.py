import streamlit as st
import os
from utils import load_and_split, create_vectorstore, get_response

st.title("📚 AI Study Assistant")

uploaded_file = st.file_uploader("Upload a PDF", type="pdf")

if uploaded_file:
    with open("temp.pdf", "wb") as f:
        f.write(uploaded_file.read())

    docs = load_and_split("temp.pdf")
    vectorstore = create_vectorstore(docs)

    query = st.text_input("Ask a question:")

    if query:
        answer = get_response(vectorstore, query)
        st.write("### Answer:")
        st.write(answer)