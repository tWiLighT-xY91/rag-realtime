import { useState } from "react";
import { sendMessage, uploadPDF } from "../api/api";

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus("Uploading PDF...");

      const data = await uploadPDF(selectedFile);

      setUploadStatus(data.message);
    } catch (error) {
      console.error(error);

      setUploadStatus("Upload failed.");
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = {
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const data = await sendMessage(query);
      console.log(data);

      const aiMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Backend connection failed.",
        },
      ]);
    }

    setQuery("");
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <header className="border-b border-zinc-800 p-4">
        <h1 className="text-2xl font-bold">AI Study Assistant 🗿</h1>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl ${
                msg.role === "user"
                  ? "bg-zinc-800 ml-auto max-w-xl"
                  : "bg-zinc-900 border border-zinc-700 max-w-xl"
              }`}
            >
              <p>{msg.content}</p>

              {msg.sources && (
                <div className="mt-3 text-sm text-zinc-400">
                  <p className="font-semibold mb-1">Sources:</p>

                  {msg.sources.map((source, idx) => (
                    <p key={idx}>• {source}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="text-sm"
          />

          <button
            onClick={handleUpload}
            className="bg-red-600 px-4 py-2 rounded-lg border-2 border-white"
          >
            Upload PDF
          </button>
        </div>

        {uploadStatus && (
          <p className="max-w-3xl mx-auto mt-2 text-sm text-zinc-400">
            {uploadStatus}
          </p>
        )}
      </div>

      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Ask something..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none"
          />

          <button
            onClick={handleSend}
            className="bg-white text-black px-6 rounded-lg font-semibold hover:bg-zinc-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
