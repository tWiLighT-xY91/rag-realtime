import { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  uploadPDF,
  createConversation,
  getConversations,
  getMessages,
  deleteConversation,
  renameConversation,
  generateQuiz,
} from "../api/api";
import QuizPanel from "../components/QuizPanel";

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [typingMessage, setTypingMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    let conversationId = activeConversation;

    // auto create chat if none exists
    if (!conversationId) {
      const newChat = await createConversation();

      conversationId = newChat.id;

      setActiveConversation(conversationId);

      await fetchConversations();
    }

    try {
      setUploadStatus("Uploading PDFs...");

      // upload files one by one
      for (const file of selectedFiles) {
        await uploadPDF(file, conversationId);
      }

      setUploadStatus("All PDFs uploaded successfully.");

      setSelectedFiles([]);
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed.");
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await getConversations();

      setConversations(data);
    } catch (error) {
      console.error(error);
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

      // reset upload state
      setSelectedFiles([]);
      setUploadStatus("");

      const data = await getMessages(conversationId);

      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const typeMessage = async (text) => {
    setTypingMessage("");

    for (let i = 0; i < text.length; i++) {
      setTypingMessage((prev) => prev + text[i]);

      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    return text;
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    let conversationId = activeConversation;

    // Auto-create chat
    if (!conversationId) {
      const newChat = await createConversation();

      setConversations((prev) => [...prev, newChat]);
      setActiveConversation(newChat.id);

      conversationId = newChat.id;
    }

    const currentQuery = query;

    const userMessage = {
      role: "user",
      content: currentQuery,
    };

    setMessages((prev) => [...prev, userMessage]);

    setQuery("");
    setLoading(true);

    try {
      const data = await sendMessage(currentQuery, conversationId);

      await typeMessage(data.answer);

      const aiMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      setTypingMessage("");

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

  const handleDeleteChat = async (conversationId) => {
    try {
      await deleteConversation(conversationId);

      setConversations((prev) =>
        prev.filter((chat) => chat.id !== conversationId),
      );

      // reset if active chat deleted
      if (activeConversation === conversationId) {
        setActiveConversation(null);
        setMessages([]);
        setSelectedFiles([]);
        setUploadStatus("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeConversation) return;

    try {
      setQuizLoading(true);

      const data = await generateQuiz(activeConversation);

      setQuiz(data);
      setShowQuiz(true);
    } catch (error) {
      console.error(error);
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`border-r border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="p-3 border-b border-zinc-800 flex justify-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 text-zinc-400 hover:text-white transition"
          >
            ☰
          </button>
        </div>
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={handleNewChat}
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-zinc-300 transition"
          >
            {sidebarOpen ? "+ New Chat" : "+"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {conversations.length === 0
            ? sidebarOpen && (
                <p className="text-zinc-500 text-sm p-2">No chats yet</p>
              )
            : conversations.map((chat) => (
                <div key={chat.id} className="relative group">
                  <button
                    onClick={() => handleSelectChat(chat.id)}
                    className={`cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 w-full p-3 rounded-lg transition ${
                      sidebarOpen ? "text-left" : "flex justify-center"
                    } ${
                      activeConversation === chat.id
                        ? "bg-zinc-800 border border-zinc-600"
                        : "bg-zinc-900 hover:bg-zinc-800"
                    }`}
                  >
                    {sidebarOpen &&
                      (editingChatId === chat.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={async () => {
                            if (!editingTitle.trim()) {
                              setEditingChatId(null);
                              return;
                            }

                            await renameConversation(chat.id, editingTitle);

                            setConversations((prev) =>
                              prev.map((c) =>
                                c.id === chat.id
                                  ? {
                                      ...c,
                                      title: editingTitle,
                                    }
                                  : c,
                              ),
                            );

                            setEditingChatId(null);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              await renameConversation(chat.id, editingTitle);

                              setConversations((prev) =>
                                prev.map((c) =>
                                  c.id === chat.id
                                    ? {
                                        ...c,
                                        title: editingTitle,
                                      }
                                    : c,
                                ),
                              );

                              setEditingChatId(null);
                            }

                            if (e.key === "Escape") {
                              setEditingChatId(null);
                            }
                          }}
                          className="
        bg-zinc-800
        text-white
        rounded-md
        px-2
        py-1
        outline-none
        border border-zinc-600
        w-full
      "
                        />
                      ) : (
                        chat.title
                      ))}
                  </button>

                  <button
                    onClick={() => {
                      setEditingChatId(chat.id);
                      setEditingTitle(chat.title);
                    }}
                    className="
    absolute top-2 right-8
    opacity-0 group-hover:opacity-100
    transition text-blue-400
    hover:text-blue-300
    cursor-pointer
  "
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150
      absolute top-2 right-2
      opacity-0 group-hover:opacity-100
      transition text-red-400
      hover:text-red-300
    "
                  >
                    {sidebarOpen ? "✕" : "🗑"}
                  </button>
                </div>
              ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="border-b border-zinc-800 p-4">
          <h1 className="text-2xl font-bold">AccuSearch </h1>
        </header>

        {/* CHAT AREA */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4 h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Ready to search smarter? 🔍
                </h1>

                <p className="text-zinc-500 text-lg mb-8 max-w-md">
                  Upload PDFs and ask questions from your study materials
                  instantly.
                </p>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button className="cursor-pointer bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-xl px-5 py-3 transition">
                    📄 Upload PDFs
                  </button>

                  <button className="cursor-pointer bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-xl px-5 py-3 transition">
                    🧠 Explain Concepts
                  </button>

                  <button className="cursor-pointer bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-xl px-5 py-3 transition">
                    🔍 Ask Questions
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl max-w-xl ${
                    msg.role === "user"
                      ? "bg-zinc-800 ml-auto"
                      : "bg-zinc-900 border border-zinc-700"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs text-zinc-500 mt-2 text-right">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "Asia/Kolkata",
                        })
                      : ""}
                  </p>

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
              ))
            )}

            {typingMessage && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 max-w-xl">
                <p>{typingMessage}</p>
              </div>
            )}

            {loading && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 max-w-xl transition-all duration-300 animate-pulse">
                <div className="space-y-3">
                  <div className="h-3 bg-zinc-700 rounded w-3/4"></div>

                  <div className="h-3 bg-zinc-700 rounded w-full"></div>

                  <div className="h-3 bg-zinc-700 rounded w-5/6"></div>
                </div>
              </div>
            )}

            <QuizPanel
              showQuiz={showQuiz}
              quiz={quiz}
              quizLoading={quizLoading}
            />
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
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg border border-zinc-600 transition"
            >
              Choose PDFs
            </label>

            <label
              htmlFor="pdfUpload"
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 bg-zinc-600 hover:bg-zinc-500 px-4 py-2 rounded-lg font-bold transition"
            >
              +
            </label>

            <button
              onClick={handleUpload}
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg border border-zinc-600 transition"
            >
              Upload
            </button>

            <button
              onClick={handleGenerateQuiz}
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg border border-zinc-600 transition"
            >
              Generate Quiz
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
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 bg-white text-black px-6 rounded-lg font-semibold hover:bg-zinc-300 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
