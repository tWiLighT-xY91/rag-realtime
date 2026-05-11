import axios from "axios"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
})

export const uploadPDF = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await API.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data
}

export const sendMessage = async (query) => {
  const response = await API.post(
    `/chat?query=${encodeURIComponent(query)}`
  )

  return response.data
}
