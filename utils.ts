export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,) usually handled by splitting,
      // but we return full string here for display, strip later for API
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return await fileToBase64(new File([blob], "image.jpg", { type: blob.type }));
  } catch (error) {
    console.warn("CORS or network error converting URL to base64, usually due to browser security on external images.", error);
    // In a real production app, you'd use a proxy. 
    // For this demo, we might fail if the image isn't CORS enabled.
    // We return the URL itself just to keep the UI from crashing, but the API call will likely fail later if it's not base64.
    throw new Error("无法读取该图片数据（可能受跨域限制），请尝试下载后上传。");
  }
};

export const stripBase64Prefix = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, '');
};

export const getMimeTypeFromBase64 = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};