import React, { useState, useEffect, useRef, useEffectEvent } from 'react';
import { 
  Play, Pause, RotateCcw, Type, Upload, FileText, Loader2, X, Settings2, CircleQuestionMark, Github
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
  const [isPulse, setIsPulse] = useState(true);

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
    setIsPulse(!isPulse);
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
                <h1 className="text-3xl flex font-instrumentSerif font-semibold tracking-tight text-black leading-none">Flow{" "}
                  
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

                <span className="ml-2 flex items-center">
                {mode === 'input' ? text.map((char, i) => {
                  const isHighlighted = i <= index; // highlight the range 0..index
                  return (
                    <span
                      key={i}
                      className={`inline-block transition-all duration-150 px-0.25 ${
                        isHighlighted
                          ? "text-white tracking-wider h-8 bg-black scale-105 rounded-xs"
                          : "text-black/75"
                      }`}
                    >
                      {char}
                    </span>
                  );
                }) : "Reader"}
              </span>
                </h1>
              </div>
            </div>
            
            {mode === 'read' ? (
            <div className='flex items-center gap-2'>
              <button 
                onClick={handleBackToEdit}
                className="text-sm font-medium text-gray-500 hover:text-black transition-colors transition-all duration-150 flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-200 rounded-md"
              >
                <Type size={14} /> Edit Text
              </button>
              <CircleQuestionMark size={18} className='text-gray-500 hover:text-black active:scale-90 cursor-pointer' onClick={handleInfo}/>
              <svg fill="#090909ff" viewBox="0 -0.5 25 25" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="m12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031c1.871 1.094 3.386 2.609 4.449 4.422l.031.058c1.04 1.769 1.654 3.896 1.654 6.166 0 5.406-3.483 10-8.327 11.658l-.087.026c-.063.02-.135.031-.209.031-.162 0-.312-.054-.433-.144l.002.001c-.128-.115-.208-.281-.208-.466 0-.005 0-.01 0-.014v.001q0-.048.008-1.226t.008-2.154c.007-.075.011-.161.011-.249 0-.792-.323-1.508-.844-2.025.618-.061 1.176-.163 1.718-.305l-.076.017c.573-.16 1.073-.373 1.537-.642l-.031.017c.508-.28.938-.636 1.292-1.058l.006-.007c.372-.476.663-1.036.84-1.645l.009-.035c.209-.683.329-1.468.329-2.281 0-.045 0-.091-.001-.136v.007c0-.022.001-.047.001-.072 0-1.248-.482-2.383-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479 0-.649-.145-1.263-.404-1.814l.011.026c-.115-.022-.246-.035-.381-.035-.334 0-.649.078-.929.216l.012-.005c-.568.21-1.054.448-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433c-.373-.214-.814-.421-1.272-.595l-.066-.022c-.293-.154-.64-.244-1.009-.244-.124 0-.246.01-.364.03l.013-.002c-.248.524-.393 1.139-.393 1.788 0 .531.097 1.04.275 1.509l-.01-.029c-.785.844-1.266 1.979-1.266 3.227 0 .025 0 .051.001.076v-.004c-.001.039-.001.084-.001.13 0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013c.354.435.782.793 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012c-.207.101-.448.183-.699.236l-.021.004c-.256.051-.549.08-.85.08-.022 0-.044 0-.066 0h.003c-.394-.008-.756-.136-1.055-.348l.006.004c-.371-.259-.671-.595-.881-.986l-.007-.015c-.198-.336-.459-.614-.768-.827l-.009-.006c-.225-.169-.49-.301-.776-.38l-.016-.004-.32-.048c-.023-.002-.05-.003-.077-.003-.14 0-.273.028-.394.077l.007-.003q-.128.072-.08.184c.039.086.087.16.145.225l-.001-.001c.061.072.13.135.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007c.045.002.097.002.15.002.261 0 .517-.021.767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001c-.119.089-.268.143-.431.143-.075 0-.147-.011-.214-.032l.005.001c-4.929-1.689-8.409-6.283-8.409-11.69 0-2.268.612-4.393 1.681-6.219l-.032.058c1.094-1.871 2.609-3.386 4.422-4.449l.058-.031c1.739-1.034 3.835-1.645 6.073-1.645h.098-.005zm-7.64 17.666q.048-.112-.112-.192-.16-.048-.208.032-.048.112.112.192.144.096.208-.032zm.497.545q.112-.08-.032-.256-.16-.144-.256-.048-.112.08.032.256.159.157.256.047zm.48.72q.144-.112 0-.304-.128-.208-.272-.096-.144.08 0 .288t.272.112zm.672.673q.128-.128-.064-.304-.192-.192-.32-.048-.144.128.064.304.192.192.32.044zm.913.4q.048-.176-.208-.256-.24-.064-.304.112t.208.24q.24.097.304-.096zm1.009.08q0-.208-.272-.176-.256 0-.256.176 0 .208.272.176.256.001.256-.175zm.929-.16q-.032-.176-.288-.144-.256.048-.224.24t.288.128.225-.224z"></path></g></svg>
            </div>
            ) : (
              <div className='flex items-center justify-center gap-1'> 
              
              <div className="relative inline-block group cursor-pointer" onClick={handleInfo}>
                <CircleQuestionMark size={18} className='text-gray-500 hover:text-black active:scale-90 cursor-pointer group-hover:text-black'/>

                {isPulse && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-black opacity-50 group-hover:opacity-100"></span>
                )}
              </div>

              <a 
                href="https://github.com/yadneshx17/Flow-Reader" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
              >
              <button className='active:scale-90 scale-100'>
                  <svg fill="#090909ff" viewBox="0 -0.5 25 25" xmlns="http://www.w3.org/2000/svg" className='w-5 h-5'><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="m12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031c1.871 1.094 3.386 2.609 4.449 4.422l.031.058c1.04 1.769 1.654 3.896 1.654 6.166 0 5.406-3.483 10-8.327 11.658l-.087.026c-.063.02-.135.031-.209.031-.162 0-.312-.054-.433-.144l.002.001c-.128-.115-.208-.281-.208-.466 0-.005 0-.01 0-.014v.001q0-.048.008-1.226t.008-2.154c.007-.075.011-.161.011-.249 0-.792-.323-1.508-.844-2.025.618-.061 1.176-.163 1.718-.305l-.076.017c.573-.16 1.073-.373 1.537-.642l-.031.017c.508-.28.938-.636 1.292-1.058l.006-.007c.372-.476.663-1.036.84-1.645l.009-.035c.209-.683.329-1.468.329-2.281 0-.045 0-.091-.001-.136v.007c0-.022.001-.047.001-.072 0-1.248-.482-2.383-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479 0-.649-.145-1.263-.404-1.814l.011.026c-.115-.022-.246-.035-.381-.035-.334 0-.649.078-.929.216l.012-.005c-.568.21-1.054.448-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433c-.373-.214-.814-.421-1.272-.595l-.066-.022c-.293-.154-.64-.244-1.009-.244-.124 0-.246.01-.364.03l.013-.002c-.248.524-.393 1.139-.393 1.788 0 .531.097 1.04.275 1.509l-.01-.029c-.785.844-1.266 1.979-1.266 3.227 0 .025 0 .051.001.076v-.004c-.001.039-.001.084-.001.13 0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013c.354.435.782.793 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012c-.207.101-.448.183-.699.236l-.021.004c-.256.051-.549.08-.85.08-.022 0-.044 0-.066 0h.003c-.394-.008-.756-.136-1.055-.348l.006.004c-.371-.259-.671-.595-.881-.986l-.007-.015c-.198-.336-.459-.614-.768-.827l-.009-.006c-.225-.169-.49-.301-.776-.38l-.016-.004-.32-.048c-.023-.002-.05-.003-.077-.003-.14 0-.273.028-.394.077l.007-.003q-.128.072-.08.184c.039.086.087.16.145.225l-.001-.001c.061.072.13.135.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007c.045.002.097.002.15.002.261 0 .517-.021.767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001c-.119.089-.268.143-.431.143-.075 0-.147-.011-.214-.032l.005.001c-4.929-1.689-8.409-6.283-8.409-11.69 0-2.268.612-4.393 1.681-6.219l-.032.058c1.094-1.871 2.609-3.386 4.422-4.449l.058-.031c1.739-1.034 3.835-1.645 6.073-1.645h.098-.005zm-7.64 17.666q.048-.112-.112-.192-.16-.048-.208.032-.048.112.112.192.144.096.208-.032zm.497.545q.112-.08-.032-.256-.16-.144-.256-.048-.112.08.032.256.159.157.256.047zm.48.72q.144-.112 0-.304-.128-.208-.272-.096-.144.08 0 .288t.272.112zm.672.673q.128-.128-.064-.304-.192-.192-.32-.048-.144.128.064.304.192.192.32.044zm.913.4q.048-.176-.208-.256-.24-.064-.304.112t.208.24q.24.097.304-.096zm1.009.08q0-.208-.272-.176-.256 0-.256.176 0 .208.272.176.256.001.256-.175zm.929-.16q-.032-.176-.288-.144-.256.048-.224.24t.288.128.225-.224z"></path></g></svg>
              </button>
              </a>
              </div>
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