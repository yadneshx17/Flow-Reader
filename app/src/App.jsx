import React, { useState, useEffect, useRef, useEffectEvent } from 'react';
import { 
  Play, Pause, RotateCcw, Type, Upload, FileText, Loader2, X, Settings2, CircleQuestionMark
} from 'lucide-react';

const App = () => {
  const [inputText, setInputText] = useState('');
  const [words, setWords] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(200); 
  const [mode, setMode] = useState('input');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [countDown, setCountDown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Animation for Reader Type 1
  // const text = "Reader".split("");
  // const [index, setIndex] = useState(0);
  // const [direction, setDirection] = useState(1); // 1 = left -> right, -1 = right -> left

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setIndex((prev) => {
  //       const next = prev + direction;

  //       if (next >= text.length - 1) {
  //         setDirection(-1); // change direction at the end
  //       } else if (next <= 0) {
  //         setDirection(1); // change direction at the start
  //       }

  //       return next;
  //     });
  //   }, 500); // speed

  //   return () => clearInterval(interval);
  // }, [direction, text.length]);

  // Animation for Reader Type 2
  // const text = "Reader".split(""); 
  // const [index, setIndex] = useState(0);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setIndex((prev) => (prev + 1) % text.length); // loops start→end→start
  //   }, 150);

  //   return () => clearInterval(interval);
  // }, [text.length]);
  
  // Animation type 3
  const text = "Reader".split("");
  const [index, setIndex] = useState(0);       // current end of the highlighted range (inclusive)
  const [direction, setDirection] = useState(1); // 1 = expanding, -1 = shrinking

   useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        // expanding
        if (direction === 1) {
          if (prev >= text.length - 1) {
            // reached end -> switch to shrinking on next tick
            setDirection(-1);
            return prev - 1; // step one back so the next state starts shrinking
          }
          return prev + 1;
        }

        // shrinking
        if (direction === -1) {
          if (prev <= 0) {
            // reached start -> switch to expanding on next tick
            setDirection(1);
            return prev + 1; // step one forward so expansion continues
          }
          return prev - 1;
        }

        return prev;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [direction, 400, text.length]);
  
  const activeWordRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const topSectionRef = useRef(null);

  // speed calculation
  const speedDelay = 60000 / wpm;

  // pdf loading
  const loadPdfLib = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js loaded but object not found'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF library script'));
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (file) => {
    setIsLoading(true);
    try {
      const pdfjs = await loadPdfLib();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }
      const cleanText = fullText.replace(/\s+/g, ' ').trim();
      if (cleanText.length === 0) {
        alert("This PDF seems to be empty or contains scanned images without text.");
      } else {
        setInputText(cleanText);
        setFileName(file.name);
      }
    } catch (error) {
      console.error("PDF Error:", error);
      alert(`Could not read PDF: ${error.message}. Ensure it is not password protected.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputText(e.target.result);
        setFileName(file.name);
      };
      reader.onerror = () => alert("Error reading text file");
      reader.readAsText(file);
    } else if (isPdf) {
      extractTextFromPdf(file);
    } else {
      alert('Please upload a valid .txt or .pdf file');
    }
    event.target.value = null;
  };

  // Countdown Timer
  useEffect(() => {
    let timer;
    if (isCountingDown) {
      timer = setInterval(() => {
        setCountDown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsCountingDown(false);
            setIsPlaying(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCountingDown]);

  // Handles Scroll of Text area
  useEffect(() => {
    if (!activeWordRef.current) return;

    activeWordRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, [currentIndex, showInfo]);

  // handle Escape
  useEffect(() => {
     const handleKeyDown = (e) => {
      if(e.key === "Escape") {
        setShowInfo(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInfo])

  // Kuch toh karta hai
  useEffect(() => {
    let interval = null;
    if (isPlaying && currentIndex < words.length) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {

          // checks if reached end
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            
            // auto return logic: waits for 1 second for user to see last word.
            setTimeout(() => {
                setMode('input');
                setCurrentIndex(0);
            }, 800);
            
            return prev;
          }
          return prev + 1;
        });
      }, speedDelay);
    } else if (currentIndex >= words.length) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, words.length, speedDelay, currentIndex]);

  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const word = activeWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();
      
      // Tighter scroll trigger for the scaled down view
      if (wordRect.bottom > containerRect.bottom - 60 || wordRect.top < containerRect.top + 60) {
        word.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const timer = setTimeout(() => {
        setCountDown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const handleStart = () => {
    if (!inputText.trim()) return;
    const splitWords = inputText.trim().split(/\s+/).filter(w => w.length > 0);
    setWords(splitWords);
    setMode('read');
    setCurrentIndex(0);
    setIsPlaying(false);
    setCountDown(3);
    setIsCountingDown(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleBackToEdit = () => {
    setIsPlaying(false);
    setMode('input');
  };

  const handleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <>
      <div className="min-h-screen bg-[#FDFDFD] text-[#111] font-body selection:bg-black selection:text-white flex flex-col items-center justify-center px-4 py-2 transition-colors duration-500">

         {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
            <div className="relative bg-white font-heading rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-heading font-bold mb-4">Why Speed Read?</h2>
              
              <div className="space-y-4 text-sm sm:text-base text-gray-600 font-body leading-relaxed">
                <div>
                  <h3 className="text-black font-semibold mb-1 font-heading">The Problem: Eye Travel</h3>
                  <p className='text-sm'>When you read normally, your eyes jerk from word to word (called <strong className='text-neutral-700'>_saccades</strong>). This mechanical movement slows down comprehension and speed.</p>
                </div>
                
                <div>
                  <h3 className="text-black font-semibold mb-1 font-heading">The Solution: Guided Highlighting</h3>
                  {/* <p><strong className='text-neutral-700'>R</strong>apid <strong className='text-neutral-700'>S</strong>erial <strong className='text-neutral-700'>V</strong>isual <strong className='text-neutral-700'>P</strong>resentation. By flashing words in a single fixed location (like a teleprompter), we eliminate eye movement.</p> */}
                  <p className='text-sm'>Flow Reader keeps the entire paragraph visible and <strong className='text-neutral-700'>highlights each word in sequence</strong>. Your eyes move naturally through the text, with a clear visual guide that reduces effort.</p>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-100 mt-2">
                  <h3 className="text-black font-semibold mb-1 p-3 font-heading text-xs uppercase tracking-wide">Key Benefits</h3>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Minimizes unnecessary rereading by providing a smooth reading path.</li>
                    <li>Improves focus because the active word stands out.</li>
                    <li>Helps you maintain momentum and read faster with less distraction.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="w-full max-w-2xl flex flex-col h-[80vh]">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-6 px-1">
            <div className="flex items-center font-instrumentSerif gap-2.5 group cursor-default">
              <div className="flex items-center justify-center">
                {/* <img src="./flowreader.svg" className="w-20 h-20" alt="FlowReader Logo" /> */}
                <h1 className="text-3xl flex font-semibold tracking-tight text-black leading-none">Flow{" "}
                  
                  {/* Type 1 
                  <span className="ml-2 flex">
                  {text.map((char, i) => (
                    <span
                      key={i}
                      className={`transition-all duration-400 ${
                        i === index
                          ? "text-white bg-black rounded-sm scale-110 tracking-wider"
                          : "text-black opacity-50"
                      }`}
                    >
                      {char}
                    </span>
                  ))}
                </span> */}

                {/* Type 2 
                <span className="ml-2 flex">
                {text.map((char, i) => (
                  <span
                    key={i}
                    className={`transition-all duration-150 
                      ${i === index ? "text-white bg-black rounded-sm scale-110" : "text-black/75"}
                    `}
                  >
                    {char}
                  </span>
                ))}
                </span>
                */}

                <span className="ml-2 flex">
                {text.map((char, i) => {
                  const isHighlighted = i <= index; // highlight the range 0..index
                  return (
                    <span
                      key={i}
                      className={`inline-block transition-all duration-150 px-0.25 ${
                        isHighlighted
                          ? "text-white tracking-wider bg-black scale-105 rounded-xs"
                          : "text-black/75"
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
                </h1>
              </div>
            </div>
            
            {mode === 'read' ? (
            <div className='flex items-center gap-2'>
              <button 
                onClick={handleBackToEdit}
                className="text-xs font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-md"
              >
                <Type size={14} /> Edit Text
              </button>

              <CircleQuestionMark size={18} className='text-gray-500 hover:text-black active:scale-90' onClick={handleInfo}/>
            </div>
            ) : (
              <CircleQuestionMark size={18} className='text-gray-500 hover:text-black active:scale-90' onClick={handleInfo}/>
            )}
          </header>

          {/* INPUT MODE */}
          {mode === 'input' && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-xs font-bold text-neutral-400 font-heading uppercase tracking-wider select-none">
                  Source Material
                </label>
                
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-md animate-pulse">
                       <Loader2 className="animate-spin" size={10} /> PROCESSING
                    </span>
                  )}
                  
                  {fileName && !isLoading && (
                    <span className="text-[11px] font-medium bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-700 flex items-center gap-1.5">
                      <FileText size={10} className="text-gray-400"/> 
                      <span className="max-w-[120px] truncate">{fileName}</span>
                      <button onClick={() => {setFileName(''); setInputText('');}} className="hover:text-red-600 transition-colors"><X size={10}/></button>
                    </span>
                  )}
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="text-[11px] font-bold flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
                  >
                    <Upload size={10} /> Upload TXT/PDF
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Text Area */}
              <div className="relative flex-1 rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-colors focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black">
                 <textarea
                  className="w-full h-full p-6 bg-transparent text-base font-body leading-relaxed resize-none focus:outline-none placeholder:text-gray-500/75 text-gray-800"
                  placeholder="Paste text or upload a file..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              {/* Controls Footer */}
              <div className="mt-6 flex items-center justify-between px-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 font-heading uppercase tracking-wider">Speed (WPM)</span>
                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-300">
                    <Settings2 size={12} className="text-gray-500" />
                    <input 
                      type="range" min="100" max="800" step="10"
                      value={wpm}
                      onChange={(e) => setWpm(Number(e.target.value))}
                      className="w-24 accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-heading text-sm font-bold text-black min-w-[3ch] text-right">{wpm}</span>
                  </div>
                </div>

                <div className='relative group inline-block'>

                  <button
                  onClick={handleStart}
                  disabled={!inputText.trim() || isLoading}
                  className="px-6 py-3 bg-black text-white rounded-lg font-heading font-bold text-sm hover:translate-y-[-1px] active:translate-y-[0px] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    START READING <Play size={14} fill="currentColor" />
                  </span>
                </button>

                {/* Tooltip */}
                <div 
                className={`absolute left-1/2 -translate-x-1/2 -top-10 px-3 py-2 w-[200px] flex items-center justify-center rounded-md text-xs font-medium text-white bg-black opacity-0 pointer-events-none translate-y-2 group-hover:-translate-y-2 transition-all duration-200 ${!inputText.trim() || isLoading ? 'group-hover:opacity-100' : 'group-hover:opacity-0'}`}
                >
                  Enter text to start reading
                  {/* Arrow */}
                  <div
                    className="
                      absolute left-1/2 top-full -translate-x-1/2 -translate-y-1
                      w-2 h-2 bg-black rotate-45
                    "
                  />
                </div>

                </div>
              </div>
            </div>
          )}

          {/* READING MODE */}
          {mode === 'read' && (
            <div 
            className="h-screen flex-1 overflow-y-auto no-scrollbar flex flex-col relative animate-in zoom-in-95 duration-300"
            >
              
              {isCountingDown ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-6xl font-bold text-black">{countDown}</div>
                </div>
              ) : (
                <div 
                  className="flex-1 relative overflow-y-auto no-scrollbar mask-gradient px-2 sm:px-8 py-8 text-center"
                  ref={topSectionRef}
                >
                  {/* Active Words */}
                  <div className="flex flex-wrap justify-center content-start gap-x-1.5 gap-y-4 text-xl sm:text-2xl leading-relaxed font-body text-gray-300 transition-all">
                    {words.map((word, index) => {
                      const isActive = index === currentIndex;
                      const isPast = index < currentIndex;
                      
                      return (
                        <span
                          key={index}
                          ref={isActive ? activeWordRef : null}
                          className={`
                            px-1.5 py-0.5 rounded transition-all duration-150
                            ${isActive 
                              ? 'bg-black text-white  shadow-md transform' 
                              : isPast ? 'text-gray-900 opacity-20' : 'text-gray-300 blur-[0.2px]'}
                          `}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reading Controls*/}
              <div className="sticky bottom-0 mt-4 bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center justify-between gap-4">
                
                {/* Progress barr*/}
                <div className="w-1/3 flex flex-col gap-1">
                   <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold text-gray-400 font-heading">
                        <span>Progress</span>
                        <span>{Math.round((currentIndex / words.length) * 100)}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${(currentIndex / words.length) * 100}%` }}
                      />
                   </div>
                </div>

                {/* Play/Pause */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleReset}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-black transition-all"
                    title="Restart"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                  </button>
                </div>

                {/* Speed Adjustment */}
                <div className="w-1/3 flex items-center justify-end">
                   <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                      <button 
                        onClick={() => setWpm(prev => Math.max(100, prev - 10))}
                        className="w-7 h-7 rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-black font-bold transition-all text-sm"
                      >-</button>
                      <span className="font-heading w-10 text-center text-sm font-bold text-black">{wpm}</span>
                      <button 
                        onClick={() => setWpm(prev => Math.min(1000, prev + 10))}
                        className="w-7 h-7 rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-black font-bold transition-all text-sm"
                      >+</button>
                   </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;