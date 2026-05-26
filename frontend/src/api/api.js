import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const uploadPDF = async (file, conversationId) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await API.post(
    `/upload?conversation_id=${conversationId}`,
    formData,
  );

  return response.data;
};

export const sendMessage = async (query, conversationId) => {
  const response = await API.post(
    `/chat?query=${encodeURIComponent(query)}&conversation_id=${conversationId}`,
  );

  return response.data;
};

export const createConversation = async () => {
  const response = await API.post("/conversations");
  return response.data;
};

export const getConversations = async () => {
  const response = await API.get("/conversations");
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await API.get(`/conversations/${conversationId}`);

  return response.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await API.delete(`/conversations/${conversationId}`);

  return response.data;
};

export const renameConversation = async (conversationId, title) => {
  const response = await API.put(
    `/conversations/${conversationId}?title=${encodeURIComponent(title)}`,
  );

  return response.data;
};

export const generateQuiz = async (conversationId) => {
  const response = await API.post(
    `/generate-quiz?conversation_id=${conversationId}`
  );

  return response.data;
};