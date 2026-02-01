import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { stripBase64Prefix, getMimeTypeFromBase64 } from "../utils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Using the prompt guidelines for "nano banana"
const MODEL_NAME = 'gemini-2.5-flash-image';

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

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
        safetySettings,
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
  
  const personMime = getMimeTypeFromBase64(personBase64);
  const clothMime = getMimeTypeFromBase64(clothBase64);

  // Construct a multimodal prompt
  const parts = [
    {
      inlineData: {
        mimeType: personMime,
        data: personData
      }
    },
    {
      text: "This is the person."
    },
    {
      inlineData: {
        mimeType: clothMime,
        data: clothData
      }
    },
    {
      text: "This is the clothing. Generate a realistic full-body photo of the person wearing the clothing. Preserve the person's identity, pose, and body shape. Preserve the clothing's details and texture. Ensure high quality and natural lighting."
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: {
        safetySettings,
      }
    });

     const resParts = response.candidates?.[0]?.content?.parts;
     if (resParts) {
       // Search for image part
       for (const part of resParts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
         }
       }
       // If no image, check for text to provide better error
       const textPart = resParts.find(p => p.text);
       if (textPart && textPart.text) {
          throw new Error(`模型未生成图片，返回信息: ${textPart.text.substring(0, 100)}...`);
       }
     }
     
     // Additional check for finish reason if available
     const candidate = response.candidates?.[0];
     if (candidate && candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`生成因 ${candidate.finishReason} 停止，可能触发了安全策略。`);
     }

     throw new Error("未能生成试穿效果，请重试。");
  } catch (error) {
    console.error("Generate Try-On Error:", error);
    throw error;
  }
};

export const editGeneratedImage = async (base64Image: string, prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key 未设置");

  const imageMime = getMimeTypeFromBase64(base64Image);
  const imageData = stripBase64Prefix(base64Image);

  const parts = [
    {
      inlineData: {
        mimeType: imageMime,
        data: imageData
      }
    },
    {
      text: `Edit this image. ${prompt}. Maintain the main subject's identity and key elements unless specified otherwise. Output high quality image.`
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: {
        safetySettings,
      }
    });

    const resParts = response.candidates?.[0]?.content?.parts;
    if (resParts) {
      for (const part of resParts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      const textPart = resParts.find(p => p.text);
      if (textPart && textPart.text) {
         throw new Error(`模型未生成编辑图片: ${textPart.text.substring(0, 100)}...`);
      }
    }
    throw new Error("未能完成图片编辑，请重试。");
  } catch (error) {
    console.error("Edit Image Error:", error);
    throw error;
  }
};