import { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  uploadPDF,
  createConversation,
  getConversations,
  getMessages,
} from "../api/api";

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");

  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();

        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchConversations();
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadStatus("Uploading PDFs...");

      for (const file of selectedFiles) {
        await uploadPDF(file);
      }

      setUploadStatus("All PDFs uploaded successfully.");
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed.");
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createConversation();

      setConversations((prev) => [...prev, newChat]);

      setActiveConversation(newChat.id);

      setMessages([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectChat = async (conversationId) => {
    try {
      setActiveConversation(conversationId);

      const data = await getMessages(conversationId);

      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    if (!activeConversation) {
      alert("Create a new chat first.");
      return;
    }

    const userMessage = {
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentQuery = query;
    setQuery("");

    setLoading(true);

    try {
      const data = await sendMessage(currentQuery, activeConversation);

      const aiMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
      await fetchConversations();
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Backend connection failed.",
        },
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={handleNewChat}
            className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-zinc-300 transition"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-zinc-500 text-sm p-2">No chats yet</p>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  activeConversation === chat.id
                    ? "bg-zinc-800 border border-zinc-600"
                    : "bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {chat.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="border-b border-zinc-800 p-4">
          <h1 className="text-2xl font-bold">Mi9A3 🗿</h1>
        </header>

        {/* CHAT AREA */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl max-w-xl ${
                  msg.role === "user"
                    ? "bg-zinc-800 ml-auto"
                    : "bg-zinc-900 border border-zinc-700"
                }`}
              >
                <p>{msg.content}</p>

                {msg.sources && (
                  <div className="mt-3 text-sm text-zinc-400">
                    <p className="font-semibold mb-1">Sources:</p>

                    {msg.sources.map((source, idx) => {
                      const cleanedSource = source
                        .replace("uploads/", "")
                        .replace("temp.pdf", "Uploaded PDF")
                        .replace(/\(Page/g, " — Page");

                      return <p key={idx}>• {cleanedSource}</p>;
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="bg-zinc-900 border border-zinc-700 max-w-xl p-4 rounded-xl animate-pulse">
                Thinking...
              </div>
            )}
          </div>
        </main>

        {/* UPLOAD SECTION */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-3xl mx-auto flex gap-2 items-center flex-wrap">
            <input
              type="file"
              accept=".pdf"
              multiple
              id="pdfUpload"
              className="hidden"
              onChange={(e) =>
                setSelectedFiles((prev) => [
                  ...prev,
                  ...Array.from(e.target.files),
                ])
              }
            />

            <label
              htmlFor="pdfUpload"
              className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg border border-zinc-600 transition"
            >
              Choose PDFs
            </label>

            <label
              htmlFor="pdfUpload"
              className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold transition"
            >
              +
            </label>

            <button
              onClick={handleUpload}
              className="bg-red-600 px-4 py-2 rounded-lg border border-white hover:bg-red-500 transition"
            >
              Upload
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="max-w-3xl mx-auto mt-3 text-sm text-zinc-400">
              <p className="mb-1 font-semibold">Selected PDFs:</p>

              {selectedFiles.map((file, index) => (
                <p key={index}>• {file.name}</p>
              ))}
            </div>
          )}

          {uploadStatus && (
            <p className="max-w-3xl mx-auto mt-2 text-sm text-zinc-400">
              {uploadStatus}
            </p>
          )}
        </div>

        {/* INPUT SECTION */}
        <div className="border-t border-zinc-800 p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Ask something..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none"
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-white text-black px-6 rounded-lg font-semibold hover:bg-zinc-300 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
