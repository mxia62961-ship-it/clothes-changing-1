import { GoogleGenAI } from "@google/genai";
import { stripBase64Prefix } from "../utils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Using the prompt guidelines for "nano banana"
const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateClothingFromText = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key 未设置");

  const fullPrompt = `Generate a high-quality, flat-lay product photography of a piece of clothing. 
  Description: ${prompt}. 
  The background should be plain white or simple solid color. 
  Focus on the texture and design details of the garment.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullPrompt,
      config: {
        // No thinking budget needed for simple image gen
      }
    });

    // Check candidates for image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          // Add prefix for browser display
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("未能生成图片，请重试。");
  } catch (error) {
    console.error("Generate Clothing Error:", error);
    throw error;
  }
};

export const generateTryOnEffect = async (personBase64: string, clothBase64: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key 未设置");

  const personData = stripBase64Prefix(personBase64);
  const clothData = stripBase64Prefix(clothBase64);

  // Construct a multimodal prompt
  const parts = [
    {
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg/png, standardizing
        data: personData
      }
    },
    {
      text: "Look at the person in the previous image."
    },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: clothData
      }
    },
    {
      text: "Look at the clothing in the previous image. Generate a high-quality, realistic full-body photo of the person from the first image wearing the clothing from the second image. Maintain the person's pose, facial features, body shape, and the clothing's texture and design details. The lighting should be natural."
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
    });

     const resParts = response.candidates?.[0]?.content?.parts;
     if (resParts) {
       for (const part of resParts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
         }
       }
     }
     throw new Error("未能生成试穿效果，请重试。");
  } catch (error) {
    console.error("Generate Try-On Error:", error);
    throw error;
  }
};