import React, { useState, useEffect, useRef } from 'react';

// --- 固定デモデータ定義 (APIなしで必ず動く) ---
// どんな入力（主語）が来ても、比較的自然に繋がるような汎用的な述語・展開を用意
const DEMO_SCENARIOS = {
  normal: {
    label: "標準",
    desc: "汎用的な説明・未来予測",
    theme: "gray",
    style: "自然な",
    // 入力が「〜は」で終わっていない場合、最初のステップで助詞を補うロジックをコード側で追加
    steps: [
      { word: "は", candidates: [{w:"は", p:90, t:"助詞"}, {w:"が", p:8, t:"助詞"}, {w:"も", p:2, t:"助詞"}], type: "particle" },
      { word: "、", candidates: [{w:"、", p:85, t:"記号"}, {w:"まさに", p:10, t:"副詞"}, {w:"実は", p:5, t:"副詞"}] },
      { word: "未来を", candidates: [{w:"未来を", p:70, t:"目的語"}, {w:"世界を", p:20, t:"目的語"}, {w:"明日を", p:10, t:"目的語"}] },
      { word: "大きく", candidates: [{w:"大きく", p:60, t:"副詞"}, {w:"少し", p:30, t:"副詞"}, {w:"変える", p:10, t:"動詞"}] },
      { word: "変える", candidates: [{w:"変える", p:80, t:"動詞"}, {w:"創る", p:15, t:"動詞"}, {w:"拓く", p:5, t:"動詞"}] },
      { word: "可能性を", candidates: [{w:"可能性を", p:75, t:"目的語"}, {w:"力を", p:20, t:"目的語"}, {w:"夢を", p:5, t:"目的語"}] },
      { word: "秘めて", candidates: [{w:"秘めて", p:85, t:"動詞"}, {w:"持って", p:10, t:"動詞"}, {w:"含んで", p:5, t:"動詞"}] },
      { word: "います", candidates: [{w:"います", p:90, t:"助動詞"}, {w:"いる", p:5, t:"動詞"}, {w:"ある", p:5, t:"動詞"}] },
      { word: "。", candidates: [{w:"。", p:95, t:"記号"}, {w:"！", p:3, t:"記号"}, {w:"？", p:2, t:"記号"}] }
    ]
  },
  logical: {
    label: "論理的",
    desc: "定義・構造の説明",
    theme: "blue",
    style: "論理的な",
    steps: [
      { word: "とは", candidates: [{w:"とは", p:85, t:"格助詞"}, {w:"というのは", p:10, t:"連語"}, {w:"における", p:5, t:"連語"}], type: "particle" },
      { word: "、", candidates: [{w:"、", p:95, t:"記号"}, {w:"すなわち", p:3, t:"接続詞"}, {w:"つまり", p:2, t:"接続詞"}] },
      { word: "複雑な", candidates: [{w:"複雑な", p:60, t:"形容動詞"}, {w:"高度な", p:30, t:"形容動詞"}, {w:"多層的な", p:10, t:"形容動詞"}] },
      { word: "情報の", candidates: [{w:"情報の", p:70, t:"名詞"}, {w:"データの", p:20, t:"名詞"}, {w:"計算の", p:10, t:"名詞"}] },
      { word: "組み合わせ", candidates: [{w:"組み合わせ", p:65, t:"名詞"}, {w:"処理", p:25, t:"名詞"}, {w:"構造", p:10, t:"名詞"}] },
      { word: "によって", candidates: [{w:"によって", p:80, t:"連語"}, {w:"から", p:15, t:"格助詞"}, {w:"で", p:5, t:"格助詞"}] },
      { word: "構成", candidates: [{w:"構成", p:85, t:"名詞"}, {w:"成立", p:10, t:"名詞"}, {w:"定義", p:5, t:"名詞"}] },
      { word: "されています", candidates: [{w:"されています", p:90, t:"動詞"}, {w:"されます", p:5, t:"動詞"}, {w:"される", p:5, t:"動詞"}] },
      { word: "。", candidates: [{w:"。", p:98, t:"記号"}, {w:"？", p:1, t:"記号"}, {w:"！", p:1, t:"記号"}] }
    ]
  },
  emotional: {
    label: "感情・共感",
    desc: "主観的な感想・呼びかけ",
    theme: "pink",
    style: "感情豊かな",
    steps: [
      { word: "って", candidates: [{w:"って", p:70, t:"副助詞"}, {w:"は", p:20, t:"助詞"}, {w:"こそ", p:10, t:"助詞"}], type: "particle" },
      { word: "、", candidates: [{w:"、", p:80, t:"記号"}, {w:"ね、", p:15, t:"終助詞"}, {w:"本当に", p:5, t:"副詞"}] },
      { word: "見ている", candidates: [{w:"見ている", p:60, t:"動詞"}, {w:"考える", p:30, t:"動詞"}, {w:"聞く", p:10, t:"動詞"}] },
      { word: "だけで", candidates: [{w:"だけで", p:85, t:"副助詞"}, {w:"と", p:10, t:"格助詞"}, {w:"なら", p:5, t:"助動詞"}] },
      { word: "なんだか", candidates: [{w:"なんだか", p:70, t:"副詞"}, {w:"とても", p:20, t:"副詞"}, {w:"すごく", p:10, t:"副詞"}] },
      { word: "ワクワク", candidates: [{w:"ワクワク", p:80, t:"副詞"}, {w:"ドキドキ", p:15, t:"副詞"}, {w:"楽しく", p:5, t:"形容詞"}] },
      { word: "して", candidates: [{w:"して", p:90, t:"動詞"}, {w:"し", p:5, t:"動詞"}, {w:"する", p:5, t:"動詞"}] },
      { word: "きませんか", candidates: [{w:"きませんか", p:85, t:"動詞"}, {w:"くるね", p:10, t:"動詞"}, {w:"きます", p:5, t:"動詞"}] },
      { word: "？", candidates: [{w:"？", p:90, t:"記号"}, {w:"！", p:5, t:"記号"}, {w:"♪", p:5, t:"記号"}] }
    ]
  },
  fantasy: {
    label: "ファンタジー",
    desc: "物語の導入・劇的展開",
    theme: "purple",
    style: "劇的な",
    steps: [
      { word: "から", candidates: [{w:"から", p:70, t:"格助詞"}, {w:"より", p:20, t:"格助詞"}, {w:"へ", p:10, t:"格助詞"}], type: "particle" },
      { word: "、", candidates: [{w:"、", p:90, t:"記号"}, {w:"突然", p:5, t:"副詞"}, {w:"そして", p:5, t:"接続詞"}] },
      { word: "未知なる", candidates: [{w:"未知なる", p:65, t:"連体詞"}, {w:"伝説の", p:25, t:"名詞"}, {w:"魔法の", p:10, t:"名詞"}] },
      { word: "冒険の", candidates: [{w:"冒険の", p:70, t:"名詞"}, {w:"世界の", p:20, t:"名詞"}, {w:"扉の", p:10, t:"名詞"}] },
      { word: "扉が", candidates: [{w:"扉が", p:80, t:"主語"}, {w:"幕が", p:15, t:"主語"}, {w:"道が", p:5, t:"主語"}] },
      { word: "今", candidates: [{w:"今", p:75, t:"副詞"}, {w:"ついに", p:20, t:"副詞"}, {w:"静かに", p:5, t:"副詞"}] },
      { word: "開かれようと", candidates: [{w:"開かれようと", p:85, t:"動詞"}, {w:"始まろうと", p:10, t:"動詞"}, {w:"動こうと", p:5, t:"動詞"}] },
      { word: "しています", candidates: [{w:"しています", p:90, t:"動詞"}, {w:"している", p:5, t:"動詞"}, {w:"した", p:5, t:"動詞"}] },
      { word: "！", candidates: [{w:"！", p:95, t:"記号"}, {w:"！！", p:3, t:"記号"}, {w:"。", p:2, t:"記号"}] }
    ]
  }
};

const THEME_COLORS = {
  gray: { bg: "bg-gray-700", border: "border-gray-500", text: "text-gray-300", accent: "#9CA3AF" },
  blue: { bg: "bg-blue-900/40", border: "border-blue-500", text: "text-blue-300", accent: "#3B82F6" },
  pink: { bg: "bg-pink-900/40", border: "border-pink-500", text: "text-pink-300", accent: "#EC4899" },
  purple: { bg: "bg-purple-900/40", border: "border-purple-500", text: "text-purple-300", accent: "#A855F7" },
};

export default function App() {
  const [inputText, setInputText] = useState("AIの仕組み");
  const [mode, setMode] = useState("normal");
  const [sequenceData, setSequenceData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // タイマー管理用Ref
  const timeoutRefs = useRef([]);

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // --- データ生成ロジック (APIなし・固定データ使用) ---
  const generateSequence = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setErrorMsg("");
    setSequenceData(null);

    // 擬似的なローディング時間
    await new Promise(r => setTimeout(r, 800));

    try {
      const scenario = DEMO_SCENARIOS[mode] || DEMO_SCENARIOS.normal;
      let currentContext = inputText;
      
      // 入力テキストの末尾チェック（助詞の重複回避）
      // 「は」「が」「も」「って」「とは」「から」などで終わっているか？
      const lastChar = inputText.slice(-1);
      const lastTwoChars = inputText.slice(-2);
      
      // シナリオの最初のステップが「助詞(particle)」タイプの場合、
      // 入力がすでに助詞で終わっていたらスキップする
      let stepsToUse = [...scenario.steps];
      const firstStep = stepsToUse[0];
      
      if (firstStep.type === "particle") {
        const particle = firstStep.word; // "は", "とは", "って", "から"
        
        // 完全一致チェック (例: 入力が「AIとは」で、最初のステップが「とは」ならスキップ)
        if (inputText.endsWith(particle)) {
          stepsToUse.shift();
        } 
        // 1文字助詞チェック (例: 入力が「私は」で、最初のステップが「は」ならスキップ)
        else if (particle.length === 1 && lastChar === particle) {
          stepsToUse.shift();
        }
        // 「とは」などの複合助詞の一部チェックは複雑になるので、
        // 簡易的に「は」「が」で終わっていて、次が「は」ならスキップする程度にする
        else if (particle === "は" && (lastChar === "は" || lastChar === "が")) {
           stepsToUse.shift();
        }
      }

      const sequence = stepsToUse.map((stepData) => {
        const item = {
          context: currentContext,
          candidates: stepData.candidates.map((c, i) => ({
            word: c.w,
            prob: c.p,
            tag: c.t,
            color: i === 0 ? THEME_COLORS[scenario.theme].accent : "#6B7280"
          })),
          chosen: stepData.word,
          result: currentContext + stepData.word
        };
        currentContext += stepData.word;
        return item;
      });

      setSequenceData(sequence);
      setStep(0);
      setPhase(0);
      setIsPlaying(true);
    } catch (e) {
      console.error("Generation Error:", e);
      setErrorMsg("データの生成中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 比較用データ生成 ---
  const generateComparison = async () => {
    if (!inputText.trim()) return;
    setIsComparing(true);
    setErrorMsg("");
    setComparisonData(null);

    await new Promise(r => setTimeout(r, 1000));

    try {
      const data = {};
      
      // 入力テキストの末尾チェック（助詞の重複回避）
      const lastChar = inputText.slice(-1);
      
      Object.keys(DEMO_SCENARIOS).forEach(key => {
        const scenario = DEMO_SCENARIOS[key];
        let stepsToUse = [...scenario.steps];
        const firstStep = stepsToUse[0];
        
        // generateSequenceと同じロジックでスキップ判定
        if (firstStep.type === "particle") {
          const particle = firstStep.word;
          if (inputText.endsWith(particle)) {
            stepsToUse.shift();
          } else if (particle.length === 1 && lastChar === particle) {
            stepsToUse.shift();
          } else if (particle === "は" && (lastChar === "は" || lastChar === "が")) {
             stepsToUse.shift();
          }
        }

        // 全ステップの単語を結合して生成テキストを作成
        const fullGenerated = stepsToUse.map(s => s.word).join("");
        
        // 最初のステップ（スキップされた場合は次のステップ）の候補
        // もし全てスキップされて空ならダミーを入れる
        const displayFirstStep = stepsToUse.length > 0 ? stepsToUse[0] : { candidates: [] };
        
        data[key] = {
          firstStepCandidates: displayFirstStep.candidates.map(c => ({
            word: c.w,
            prob: c.p,
            tag: c.t
          })),
          generatedText: inputText + fullGenerated
        };
      });
      setComparisonData(data);
    } catch (e) {
      console.error("Comparison Error:", e);
      setErrorMsg("比較データの生成に失敗しました。");
    } finally {
      setIsComparing(false);
    }
  };

  const isFinished = sequenceData && step >= sequenceData.length;
  const currentData = sequenceData && sequenceData.length > 0 ? sequenceData[Math.min(step, sequenceData.length - 1)] : null;

  // --- アニメーションループ ---
  useEffect(() => {
    // 既存のタイマーをクリア
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    if (!sequenceData || !isPlaying || isFinished) return;

    const runSequence = async () => {
      try {
        setPhase(0);
        await wait(800); if (!isPlaying) return;
        
        setPhase(1); // Input -> Brain
        await wait(800); if (!isPlaying) return;
        
        setPhase(2); // Brain Processing
        await wait(1500); if (!isPlaying) return;
        
        setPhase(3); // Brain -> Candidates
        await wait(1200); if (!isPlaying) return;
        
        setPhase(4); // Candidates -> Output
        await wait(1000); if (!isPlaying) return;
        
        setPhase(5); // Update Context
        await wait(600); if (!isPlaying) return;
        
        setStep(s => s + 1);
      } catch (e) {
        console.error("Animation Error:", e);
      }
    };

    runSequence();
  }, [step, isPlaying, isFinished, sequenceData]);

  const wait = (ms) => new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    timeoutRefs.current.push(id);
  });

  const handleReset = () => {
    setStep(0);
    setPhase(0);
    setIsPlaying(true);
  };

  const handleBackToInput = () => {
    setSequenceData(null);
    setComparisonData(null);
    setStep(0);
    setPhase(0);
    setErrorMsg("");
  };

  // SVG Transform Helpers
  const getTokenTransform = () => {
    switch(phase) {
      case 0: return 'translate(150px, 130px) scale(1)';
      case 1: case 2: return 'translate(500px, 250px) scale(0.8)';
      case 3: return 'translate(850px, 130px) scale(0)';
      default: return 'translate(850px, 130px) scale(0)';
    }
  };
  
  const getOutputTokenTransform = () => {
    switch(phase) {
      case 0: case 1: case 2: case 3: return 'translate(850px, 120px) scale(1)';
      case 4: return 'translate(500px, 490px) scale(1.2)';
      case 5: return 'translate(500px, 490px) scale(0)';
      default: return 'translate(850px, 120px) scale(1)';
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center overflow-hidden font-sans relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashFlow { to { stroke-dashoffset: -20; } }
        @keyframes pulseBrain { 0%, 100% { fill: #38bdf8; opacity: 1; } 50% { fill: #f0abfc; opacity: 0.5; } }
        .flow-line { animation: dashFlow 1s linear infinite; }
        .brain-node-active { animation: pulseBrain 0.5s ease-in-out infinite; }
      `}} />

      <div className="absolute top-4 text-center z-10 w-full px-4">
        <h1 className="text-3xl font-bold mb-1 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          生成AIが文章をつくる仕組み
        </h1>
        <p className="text-gray-300 text-sm">自分で言葉を入れて、AIがどう続きを予測するか見てみよう！</p>
      </div>

      <div className="w-full max-w-6xl h-[85vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden relative border border-gray-700 mt-12 flex flex-col">
        
        {/* === 入力画面 === */}
        {!sequenceData && !comparisonData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-30 p-8">
            {isGenerating || isComparing ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold text-cyan-300 animate-pulse">
                  {isComparing ? "4つの思考回路を同時に分析中..." : "AIが言葉の繋がりを計算中..."}
                </p>
                <p className="text-gray-400 mt-2 text-sm">最適な「チャンク（言葉の塊）」を選んでいます</p>
              </div>
            ) : (
              <div className="w-full max-w-lg bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">スタートする言葉を入力</h2>
                
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="例：吾輩は"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 mb-8 text-xl transition-colors text-center"
                />

                <div className="w-full space-y-6">
                  {/* アニメーション用 */}
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-xl">
                    <p className="text-sm text-gray-400 mb-3 text-center font-bold">▶ 1つのモードをじっくり見る</p>
                    <div className="flex gap-2 justify-center flex-wrap mb-4">
                      {Object.entries(DEMO_SCENARIOS).map(([key, config]) => (
                        <button 
                          key={key} 
                          onClick={() => setMode(key)} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mode === key ? 'shadow-lg text-white ring-2 ring-white scale-105' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} 
                          style={mode === key ? {backgroundColor: THEME_COLORS[config.theme].accent} : {}}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={generateSequence} 
                      disabled={!inputText.trim()} 
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 font-bold rounded-lg transition-transform transform hover:scale-105"
                    >
                      アニメーションで再生
                    </button>
                  </div>

                  {/* 比較用 */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl blur opacity-30"></div>
                    <button 
                      onClick={generateComparison} 
                      disabled={!inputText.trim()} 
                      className="relative w-full py-4 bg-gray-900 border border-gray-600 hover:border-gray-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xl flex flex-col items-center justify-center gap-1 group"
                    >
                      <span className="text-lg group-hover:scale-105 transition-transform flex items-center gap-2">✨ 4つのモードを一気に比較する</span>
                      <span className="text-xs text-gray-400">タグや予測の違いが一覧で見られます</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {errorMsg && <p className="text-yellow-400 font-bold text-sm mt-4 bg-gray-900 border border-yellow-600 px-4 py-2 rounded-lg shadow-lg">{errorMsg}</p>}
          </div>
        )}

        {/* === 比較ダッシュボード画面 === */}
        {comparisonData && (
          <div className="w-full h-full flex flex-col bg-gray-900 p-4 sm:p-6 overflow-y-auto relative">
             {errorMsg && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-2 rounded-full font-bold text-sm shadow-xl backdrop-blur-md">
                {errorMsg}
              </div>
            )}
            <div className="flex justify-between items-center mb-6 pt-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-gray-400 text-lg">入力:</span>
                <span className="text-white bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">{inputText}</span>
              </h2>
              <button onClick={handleBackToInput} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition-colors">← 戻る</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-grow">
              {Object.entries(DEMO_SCENARIOS).map(([key, config]) => {
                const data = comparisonData[key];
                if (!data) return null;
                const theme = THEME_COLORS[config.theme];
                
                return (
                  <div key={key} className={`rounded-xl border ${theme.border} bg-gray-800/80 overflow-hidden flex flex-col shadow-lg`}>
                    <div className={`${theme.bg} p-3 border-b ${theme.border} flex justify-between items-center`}>
                      <span className="font-bold text-lg">{config.label}</span>
                      <span className="text-xs opacity-80">{config.desc}</span>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-4 flex-grow">
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2 font-bold">▶ 最初の一言の予測（頭の中）</p>
                        <div className="flex flex-col gap-2">
                          {data.firstStepCandidates?.map((cand, i) => (
                            <div key={i} className="relative w-full h-8 bg-gray-800 rounded flex items-center px-2 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full opacity-30 transition-all" style={{ width: `${cand.prob}%`, backgroundColor: i === 0 ? theme.accent : '#6B7280' }}></div>
                              <div className="relative z-10 w-full flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${i === 0 ? 'text-white' : 'text-gray-300'}`}>{cand.word}</span>
                                  {cand.tag && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold" style={{ color: i===0 ? theme.accent : '#9CA3AF', borderColor: i===0 ? theme.accent : '#4B5563' }}>
                                      {cand.tag}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>{cand.prob}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-grow">
                        <p className="text-xs text-gray-400 mb-1 font-bold">▶ そのまま生成し続けた結果</p>
                        <p className="text-white text-base leading-relaxed bg-gray-800 p-3 rounded-lg border border-gray-700">
                          <span className="text-gray-400">{inputText}</span>
                          <span className={theme.text + " font-bold drop-shadow-md"}>
                            {String(data.generatedText || '').replace(inputText, '')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === アニメーション画面 === */}
        {sequenceData && !comparisonData && (
          <div className="w-full h-full relative">
            {errorMsg && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-2 rounded-full font-bold text-sm shadow-xl backdrop-blur-md">
                {errorMsg}
              </div>
            )}
            
            <svg viewBox="0 0 1000 600" className="w-full h-full select-none">
               <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                <filter id="glow-magenta" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1E3A8A" /><stop offset="100%" stopColor="#4C1D95" /></linearGradient>
              </defs>

              {/* Flow Lines */}
              <path d="M 270 130 L 380 250" stroke={phase >= 1 && phase <= 2 ? "#22d3ee" : "#374151"} strokeWidth="4" strokeDasharray="10 10" className={phase >= 1 && phase <= 2 ? "flow-line" : ""} />
              <path d="M 620 250 L 730 130" stroke={phase >= 2 && phase <= 3 ? "#f472b6" : "#374151"} strokeWidth="4" strokeDasharray="10 10" className={phase >= 2 && phase <= 3 ? "flow-line" : ""} />
              <path d="M 850 250 L 850 490 L 750 490" stroke={phase >= 4 && phase <= 4 ? "#34d399" : "#374151"} strokeWidth="4" strokeDasharray="10 10" className={phase >= 4 && phase <= 4 ? "flow-line" : ""} />
              <path d="M 250 490 L 150 490 L 150 200" stroke={phase === 5 ? "#e879f9" : "#374151"} strokeWidth="4" strokeDasharray="10 10" fill="none" className={phase === 5 ? "flow-line" : ""} />
              {phase === 5 && <polygon points="145,210 155,210 150,200" fill="#e879f9" />}

              {/* 1. Context Box */}
              <g transform="translate(50, 60)">
                <rect width="200" height="140" rx="12" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                <text x="100" y="30" fill="#9ca3af" fontSize="14" textAnchor="middle" fontWeight="bold">① これまでの文章</text>
                <foreignObject x="10" y="50" width="180" height="80">
                  <div className="w-full h-full flex items-center justify-center text-center font-bold text-white text-lg break-all leading-tight px-2">
                    {step === 0 && phase === 0 ? "" : currentData?.context}
                  </div>
                </foreignObject>
              </g>

              {/* 2. AI Brain */}
              <g transform="translate(380, 150)">
                <rect width="240" height="200" rx="20" fill="url(#ai-grad)" stroke={phase === 2 ? "#c084fc" : "#4c1d95"} strokeWidth={phase === 2 ? "4" : "2"} filter={phase === 2 ? "url(#glow-magenta)" : "none"} />
                <text x="120" y="35" fill="#e5e7eb" fontSize="16" textAnchor="middle" fontWeight="bold">② 大規模言語モデル</text>
                <text x="120" y="180" fill="#a78bfa" fontSize="12" textAnchor="middle">確率分布を計算中...</text>
                <g transform="translate(40, 60)">
                  {[0, 1, 2].map(i => <circle key={`in-${i}`} cx="20" cy={15 + i*25} r="5" fill="#38bdf8" className={phase === 2 ? "brain-node-active" : ""} style={{ animationDelay: `${i*0.1}s` }} />)}
                  {[0, 1, 2, 3].map(i => <circle key={`hid-${i}`} cx="80" cy={5 + i*25} r="5" fill="#818cf8" className={phase === 2 ? "brain-node-active" : ""} style={{ animationDelay: `${0.2 + i*0.1}s` }} />)}
                  {[0, 1, 2].map(i => <circle key={`out-${i}`} cx="140" cy={15 + i*25} r="5" fill="#c084fc" className={phase === 2 ? "brain-node-active" : ""} style={{ animationDelay: `${0.4 + i*0.1}s` }} />)}
                  <path d="M 25 15 L 75 5 M 25 15 L 75 30 M 25 40 L 75 30 M 25 40 L 75 55 M 25 65 L 75 55 M 25 65 L 75 80 M 85 5 L 135 15 M 85 30 L 135 15 M 85 30 L 135 40 M 85 55 L 135 40 M 85 55 L 135 65 M 85 80 L 135 65" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </g>
              </g>

              {/* 3. Candidates */}
              <g transform="translate(730, 60)">
                <rect width="240" height="190" rx="12" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                <text x="120" y="30" fill="#9ca3af" fontSize="14" textAnchor="middle" fontWeight="bold">③ 次に来る確率の予測</text>
                <foreignObject x="10" y="45" width="220" height="135" style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s' }}>
                  <div className="w-full h-full flex flex-col gap-3 justify-center">
                    {currentData?.candidates?.map((cand, i) => (
                      <div key={i} className="relative w-full h-9 bg-gray-700 rounded overflow-hidden flex items-center px-2">
                        <div className="absolute left-0 top-0 h-full opacity-40 transition-all duration-500" style={{ width: `${cand.prob}%`, backgroundColor: cand.color }}></div>
                        <div className="relative z-10 w-full flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-base">{cand.word}</span>
                            {cand.tag && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold whitespace-nowrap" style={{ color: cand.color, borderColor: cand.color, backgroundColor: `${cand.color}20` }}>
                                {cand.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-white text-sm font-bold">{cand.prob}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </foreignObject>
              </g>

              {/* 4. Output Box */}
              <g transform="translate(250, 440)">
                <rect width="500" height="100" rx="12" fill="#111827" stroke="#22d3ee" strokeWidth="2" filter="url(#glow-cyan)" />
                <text x="250" y="30" fill="#22d3ee" fontSize="14" textAnchor="middle" fontWeight="bold">④ 生成された文章</text>
                <foreignObject x="20" y="45" width="460" height="50">
                  <div className="w-full h-full flex items-center justify-center text-center font-bold text-white text-2xl break-all">
                    {phase === 5 ? currentData?.result : currentData?.context}
                  </div>
                </foreignObject>
              </g>

              {/* Flying Tokens */}
              <g style={{ transform: getTokenTransform(), transition: 'transform 0.8s ease-in-out, opacity 0.3s', opacity: phase <= 1 ? 1 : 0 }}>
                <rect x="-80" y="-20" width="160" height="40" rx="20" fill="#2563eb" filter="url(#glow-cyan)" />
                <foreignObject x="-70" y="-15" width="140" height="30">
                  <div className="w-full h-full flex items-center justify-center text-center font-bold text-white text-sm break-all truncate">
                    {currentData?.context}
                  </div>
                </foreignObject>
              </g>
              <g style={{ transform: getOutputTokenTransform(), transition: 'transform 0.8s ease-in-out, opacity 0.3s', opacity: phase >= 4 && phase < 5 ? 1 : 0 }}>
                <rect x="-50" y="-20" width="100" height="40" rx="8" fill="#10B981" filter="url(#glow-cyan)" />
                <text x="0" y="5" fill="#fff" fontSize="18" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">{currentData?.chosen}</text>
              </g>
            </svg>

            {/* 完了オーバーレイ */}
            {isFinished && sequenceData && (
              <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-8 overflow-y-auto">
                <h2 className="text-4xl font-bold text-white mb-6 mt-10">生成完了！</h2>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 mb-6 max-w-3xl w-full text-center shadow-xl">
                  <p className="text-gray-400 mb-2 text-sm">最終結果：</p>
                  <p className="text-2xl md:text-3xl text-cyan-400 font-bold mb-4 break-all">
                    {sequenceData[sequenceData.length - 1]?.result}
                  </p>
                </div>

                <div className="flex gap-4 pb-10">
                  <button onClick={handleReset} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all">もう一度見る</button>
                  <button onClick={handleBackToInput} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)]">別の言葉で試す</button>
                </div>
              </div>
            )}
            
            {sequenceData && !isFinished && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-40">
                <button onClick={() => setIsPlaying(!isPlaying)} className="px-6 py-2 bg-gray-700/80 hover:bg-gray-600 rounded-lg font-bold backdrop-blur-sm">
                  {isPlaying ? '一時停止' : '再生'}
                </button>
                <button onClick={handleBackToInput} className="px-6 py-2 bg-gray-800/80 border border-gray-600 hover:bg-gray-700 rounded-lg font-bold backdrop-blur-sm">
                  入力をやり直す
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

