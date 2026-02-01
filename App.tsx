import React, { useState, useEffect } from 'react';
import { TiltCard } from './components/TiltCard';
import { ImageAsset, Step, LoadingState, HistoryItem } from './types';
import { PRESET_PERSON_IMAGES, PRESET_CLOTHING_IMAGES, STEP_DESCRIPTIONS } from './constants';
import { fileToBase64, urlToBase64 } from './utils';
import { generateClothingFromText, generateTryOnEffect } from './services/geminiService';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.SelectPerson);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data State
  const [personImage, setPersonImage] = useState<ImageAsset | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageAsset | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // Lists
  const [clothingList, setClothingList] = useState<ImageAsset[]>(PRESET_CLOTHING_IMAGES);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Inputs
  const [clothingPrompt, setClothingPrompt] = useState('');

  // Helper to ensure we have base64 for API calls
  const ensureBase64 = async (asset: ImageAsset): Promise<string> => {
    if (asset.base64) return asset.base64;
    setLoadingState('converting_preset');
    try {
      const b64 = await urlToBase64(asset.url);
      // Cache it back to state to avoid re-fetching
      if (asset.type === 'preset' && asset.id.startsWith('p')) { // Person presets
         // We don't modify the constant array directly, handled by logic flow usually
      } 
      return b64;
    } catch (e: any) {
      setErrorMessage(e.message || "图片转换失败");
      setLoadingState('idle');
      throw e;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'person' | 'clothing') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const newAsset: ImageAsset = {
          id: `upload_${Date.now()}`,
          url: base64, // Base64 serves as URL for display
          base64: base64,
          type: 'upload'
        };

        if (type === 'person') {
          setPersonImage(newAsset);
          setCurrentStep(Step.SelectClothing);
        } else {
          setClothingImage(newAsset);
          // Don't auto advance, user might want to generate instead
        }
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage("图片上传失败");
      }
    }
  };

  const handleGenerateClothing = async () => {
    if (!clothingPrompt.trim()) return;
    setLoadingState('generating_clothing');
    setErrorMessage(null);
    try {
      const b64 = await generateClothingFromText(clothingPrompt);
      const newAsset: ImageAsset = {
        id: `gen_${Date.now()}`,
        url: b64,
        base64: b64,
        type: 'generated'
      };
      setClothingList(prev => [newAsset, ...prev]);
      setClothingImage(newAsset);
      setClothingPrompt('');
    } catch (err) {
      setErrorMessage("生成服装失败，请稍后重试。");
    } finally {
      setLoadingState('idle');
    }
  };

  const handleGenerateTryOn = async () => {
    if (!personImage || !clothingImage) return;
    setLoadingState('generating_tryon');
    setErrorMessage(null);

    try {
      const pB64 = await ensureBase64(personImage);
      const cB64 = await ensureBase64(clothingImage);

      const resultB64 = await generateTryOnEffect(pB64, cB64);
      setResultImage(resultB64);
      
      // Save to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        personImage: personImage.url,
        clothingImage: clothingImage.url,
        resultImage: resultB64,
        timestamp: Date.now()
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      setCurrentStep(Step.Result);
    } catch (err) {
      setErrorMessage("生成试穿效果失败，可能是图片跨域问题或网络原因。建议使用本地上传的图片。");
    } finally {
      setLoadingState('idle');
    }
  };

  const resetProcess = () => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setCurrentStep(Step.SelectPerson);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tight">
          AI 变装工作室
        </h1>
        <p className="text-slate-500 text-sm mt-2">基于 Nano Banana (Gemini) 驱动</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 flex flex-col gap-8 pb-10">
        
        {/* Top: 3D Cards Visualizer */}
        <section className="flex justify-center items-center py-8 perspective-1000">
          <div className="flex space-x-[-15px] sm:space-x-[-30px] md:space-x-4 items-center justify-center">
            <div onClick={() => setCurrentStep(Step.SelectPerson)} className="cursor-pointer">
              <TiltCard 
                stepNumber={1} 
                label="模特" 
                imageSrc={personImage?.url || null} 
                isActive={currentStep === Step.SelectPerson} 
              />
            </div>
            <div onClick={() => personImage && setCurrentStep(Step.SelectClothing)} className={`cursor-pointer ${!personImage ? 'pointer-events-none' : ''}`}>
              <TiltCard 
                stepNumber={2} 
                label="服装" 
                imageSrc={clothingImage?.url || null} 
                isActive={currentStep === Step.SelectClothing} 
              />
            </div>
            <div className="cursor-default">
              <TiltCard 
                stepNumber={3} 
                label="试穿效果" 
                imageSrc={resultImage} 
                isActive={currentStep === Step.Result} 
              />
            </div>
          </div>
        </section>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center mx-auto max-w-lg">
            {errorMessage}
          </div>
        )}

        {/* Bottom: Operational Area */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 min-h-[400px] transition-all relative overflow-hidden">
          
          {loadingState !== 'idle' && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-900 font-medium animate-pulse">
                {loadingState === 'converting_preset' && '正在处理图片...'}
                {loadingState === 'generating_clothing' && '正在设计服装...'}
                {loadingState === 'generating_tryon' && '正在生成试穿效果...'}
              </p>
            </div>
          )}

          {/* STEP 1: Select Person */}
          {currentStep === Step.SelectPerson && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">第一步：选择或上传模特</h2>
                <label className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:bg-slate-700 transition shadow-md">
                  上传照片
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'person')} />
                </label>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {PRESET_PERSON_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setPersonImage(img);
                      setCurrentStep(Step.SelectClothing);
                    }}
                    className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${personImage?.id === img.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent hover:border-slate-300'}`}
                  >
                    <img src={img.url} alt="preset" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Select Clothing */}
          {currentStep === Step.SelectClothing && (
            <div className="animate-fadeIn">
              {/* Reference to Step 1 */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <img src={personImage?.url} alt="Current Model" className="w-full h-full object-cover" />
                </div>
                <div className="text-sm text-slate-500">
                  <span className="block font-medium text-slate-900">当前模特</span>
                  点击上方卡片可返回修改
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800">第二步：选择或生成服装</h2>
                <div className="flex gap-2 w-full md:w-auto">
                   <label className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:bg-slate-50 transition text-center">
                    上传图片
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'clothing')} />
                  </label>
                </div>
              </div>

              {/* Generate Clothing Section */}
              <div className="mb-8 relative">
                 <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={clothingPrompt}
                    onChange={(e) => setClothingPrompt(e.target.value)}
                    placeholder="描述你想要的衣服，例如：一件红色的丝绸晚礼服..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 placeholder-slate-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateClothing()}
                   />
                   <button 
                    onClick={handleGenerateClothing}
                    disabled={!clothingPrompt.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition disabled:opacity-50 disabled:scale-100"
                   >
                     生成
                   </button>
                 </div>
              </div>

              {/* Clothing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {clothingList.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setClothingImage(img)}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${clothingImage?.id === img.id ? 'border-purple-500 ring-2 ring-purple-200' : 'border-transparent hover:border-slate-300'}`}
                  >
                    <img src={img.url} alt="clothing" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {img.type === 'generated' && (
                      <span className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full">AI</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleGenerateTryOn}
                  disabled={!clothingImage}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>开始换装</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Result */}
          {currentStep === Step.Result && resultImage && (
            <div className="animate-fadeIn flex flex-col items-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">✨ 换装完成！</h2>
              
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img src={resultImage} alt="Result" className="w-full h-auto" />
              </div>

              <div className="flex gap-4 mt-8">
                 <button 
                  onClick={() => {
                    setResultImage(null);
                    setCurrentStep(Step.SelectClothing);
                  }}
                  className="px-6 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  试穿其他衣服
                </button>
                <button 
                  onClick={resetProcess}
                  className="px-6 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-medium transition shadow-lg"
                >
                  重新开始
                </button>
                <a 
                  href={resultImage} 
                  download={`tryon_${Date.now()}.png`}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg font-medium transition shadow-md flex items-center gap-2"
                >
                  下载图片
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Gallery */}
        {history.length > 0 && (
          <section className="mt-8">
            <h3 className="text-lg font-bold text-slate-700 mb-4 px-2">历史记录</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x">
              {history.map((item) => (
                <div key={item.id} className="snap-start shrink-0 w-32 md:w-40 flex flex-col gap-2">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-slate-100 bg-white">
                    <img src={item.resultImage} alt="history" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-1 h-8">
                    <img src={item.personImage} className="h-full w-8 rounded-md object-cover border border-slate-200" alt="p" />
                    <img src={item.clothingImage} className="h-full w-8 rounded-md object-cover border border-slate-200" alt="c" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;