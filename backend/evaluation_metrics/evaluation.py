import json
import time
import sys
import os
import re

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)

sys.path.append(backend_dir)

from rag1.utils import get_vectorstore

vectorstore = get_vectorstore()

with open("evaluation_metrics/benchmark.json", "r") as f:
    benchmark = json.load(f)

results = []


def clean_text(text):
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


for item in benchmark:

    question = item["question"]
    acceptable_keywords = item["acceptable_keywords"]

    start_time = time.time()

    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    docs = retriever.invoke(question)

    latency = time.time() - start_time

    context = " ".join([doc.page_content for doc in docs])

    print("\n===================")
    print("QUESTION:", question)
    print("ACCEPTABLE KEYWORDS:", acceptable_keywords)

    print("\nRETRIEVED CONTEXT:")
    print(context[:800])

    cleaned_context = clean_text(context)

    matched_keywords = sum(
        clean_text(keyword) in cleaned_context for keyword in acceptable_keywords
    )

    match_ratio = matched_keywords / len(acceptable_keywords)

    retrieved_correctly = match_ratio >= 0.4

    print("MATCH:", retrieved_correctly)
    print("===================\n")

    results.append(
        {
            "question": question,
            "retrieved_correctly": retrieved_correctly,
            "latency": round(latency, 2),
        }
    )

total = len(results)

correct = sum(r["retrieved_correctly"] for r in results)

accuracy = (correct / total) * 100

avg_latency = sum(r["latency"] for r in results) / total

print("\n========== RESULTS ==========")
print(f"Retrieval Accuracy: {accuracy:.2f}%")
print(f"Average Latency: {avg_latency:.2f}s")
print("=============================")
