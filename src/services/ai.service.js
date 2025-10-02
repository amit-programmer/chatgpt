const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({})

async function generateResponse(content) {
  // history is already formatted before calling this function
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: content,
  });

  // response.text might be undefined, so handle safely
  return response.text || "";
}


async function generateVector(content) {
  const response = await ai.models.embedContent({
    model: "gemini-embed-001",
    content: content  // Changed: Simplified content structure
  });

  return response.embedding.values;
}

module.exports = {
   generateResponse,
   generateVector
};


//rag = retrival augmented generation