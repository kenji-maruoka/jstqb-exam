import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import buildInfo from '../build-info.json';

const JSTQBExam = () => {
  // =========================================
  // ★重要★ Google Sheets ID を設定
  // =========================================
  // YOUR_SHEET_ID を自分の Sheet ID に置き換えてください
  const SHEET_ID = '13y0AytiKRkgcFO43w9YQgpI85GHRUo8RIRnCVES_yCk';
  const SHEET_NAME = 'questions';

  // =========================================
  // State管理
  // =========================================
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [optionsMap, setOptionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pendingAnswer, setPendingAnswer] = useState(null); // 仮選択（未確定）
  const [sheetTitle, setSheetTitle] = useState('');

  // GAS WebアプリURL（スプレッドシートの最終更新日取得）
  const GAS_URL = '/api/last-updated';

  // =========================================
  // Google Sheets API からデータを取得
  // =========================================
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('📡 Google Sheets から問題データをフェッチしています...');
        console.log(`🔑 使用中の Sheet ID: ${SHEET_ID}`);
        console.log(`📄 使用中のシート名: ${SHEET_NAME}`);

        // CORS対応：複数のエンドポイントを試す
        const urls = [
          // 方法1: JSONP形式（推奨）
          `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/query?tqx=out:json&sheet=${SHEET_NAME}`,
          // 方法2: CSV形式をJSON に変換
          `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
        ];

        let questions = null;
        let lastError = null;

        // 複数の方法を試す
        for (const url of urls) {
          try {
            console.log('試行中:', url);
            const response = await fetch(url, {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json, text/plain, */*',
              }
            });

            if (!response.ok) continue;

            const text = await response.text();

            // JSON形式の場合
            if (text.includes('google.visualization')) {
              const jsonString = text.substring(47).slice(0, -2);
              const jsonData = JSON.parse(jsonString);

              // スプレッドシートのタイトルを取得（reqId前のtable.parsedNumHeadersやresponseHandler周辺には含まれないため別途取得）
              questions = jsonData.table.rows.map((row) => {
                const cols = row.c;
                if (!cols[0] || !cols[0].v) return null;

                return {
                  id: String(cols[0].v),
                  category: String(cols[1].v || ''),
                  chapter: String(cols[2].v || ''),
                  question: String(cols[3].v || ''),
                  options: [
                    String(cols[4].v || ''),
                    String(cols[5].v || ''),
                    String(cols[6].v || ''),
                    String(cols[7].v || '')
                  ],
                  correct: parseInt(cols[8].v) || 0,
                  explanation: String(cols[9].v || '')
                };
              }).filter(q => q !== null);
              break;
            }
            // CSV形式の場合
            else if (text.includes(',')) {
              // シンプルな改行対応CSVパーサー
              const parseCSVWithNewlines = (csv) => {
                const rows = [];
                let row = [];
                let field = '';
                let insideQuotes = false;

                for (let i = 0; i < csv.length; i++) {
                  const char = csv[i];
                  const nextChar = csv[i + 1];

                  if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                      // エスケープされたダブルクォート
                      field += '"';
                      i++;
                    } else {
                      // クォートのオン/オフ
                      insideQuotes = !insideQuotes;
                    }
                  } else if (char === ',' && !insideQuotes) {
                    // カンマで区切り（クォート外のみ）
                    row.push(field);
                    field = '';
                  } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                    // 改行で行終了（クォート外のみ）
                    if (field.trim() || row.length > 0) {
                      row.push(field);
                      rows.push(row);
                      row = [];
                      field = '';
                    }
                    // \r\n 対応
                    if (char === '\r' && nextChar === '\n') {
                      i++;
                    }
                  } else {
                    field += char;
                  }
                }

                // 最後のフィールドと行を追加
                if (field.trim() || row.length > 0) {
                  row.push(field);
                  rows.push(row);
                }

                return rows;
              };

              const rows = parseCSVWithNewlines(text);
              console.log(`📊 取得したCSV行数: ${rows.length}`);

              // ヘッダー行を除外
              questions = rows.slice(1).map((row) => {
                // ダブルクォートを削除してクリーンアップ
                const parts = row.map(cell => {
                  let s = cell.trim();
                  // ダブルクォートで囲まれている場合は削除
                  if (s.startsWith('"') && s.endsWith('"')) {
                    s = s.slice(1, -1);
                  }
                  // エスケープされたダブルクォートを戻す
                  s = s.replace(/""/g, '"');
                  return s;
                });

                if (!parts[0] || parts.length < 10) {
                  return null;
                }

                return {
                  id: parts[0] || '',
                  category: parts[1] || '',
                  chapter: parts[2] || '',
                  question: parts[3] || '',
                  options: [
                    parts[4] || '',
                    parts[5] || '',
                    parts[6] || '',
                    parts[7] || ''
                  ],
                  correct: parseInt(parts[8]) || 0,
                  explanation: parts[9] || ''
                };
              }).filter(q => q !== null);

              console.log(`✅ ${questions.length}問のデータを取得しました`);
              

              
              // デバッグ：最初の問題のデータ構造を確認
              if (questions.length > 0) {
                console.log('【最初の問題データ】');
                console.log('ID:', questions[0].id);
                console.log('Category:', questions[0].category);
                console.log('Chapter:', questions[0].chapter);
                console.log('Question:', questions[0].question?.substring(0, 50));
                console.log('Options:', questions[0].options);
                console.log('Correct:', questions[0].correct);
                console.log('Explanation:', questions[0].explanation?.substring(0, 50));
              }
              break;
            }
          } catch (err) {
            lastError = err;
            console.log('この方法は失敗:', err.message);
            continue;
          }
        }

        if (!questions || questions.length === 0) {
          throw new Error(
            'データが取得されませんでした。' +
            '【確認事項】\n' +
            '1. Google Sheet ID が正しいか確認してください\n' +
            '2. Google Sheet が「リンクを知っている人は表示可能」に設定されているか確認\n' +
            '3. シート名が「questions」か確認してください\n' +
            (lastError ? `\nエラー詳細: ${lastError.message}` : '')
          );
        }

        console.log(`✅ ${questions.length}問のデータを取得しました`);
        setQuestions(questions);

        // スプレッドシートのタイトルを取得
        try {
          // CSVエクスポートのContent-Dispositionヘッダーからファイル名を取得
          const titleRes = await fetch(
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
            { method: 'GET', mode: 'cors' }
          );
          if (titleRes.ok) {
            const disposition = titleRes.headers.get('Content-Disposition');
            console.log('📄 Content-Disposition:', disposition);
            if (disposition) {
              // filename*=UTF-8''ファイル名 または filename="ファイル名" を抽出
              const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
              const plainMatch = disposition.match(/filename="([^"]+)"/i);
              let fileName = utf8Match
                ? decodeURIComponent(utf8Match[1])
                : plainMatch
                ? plainMatch[1]
                : null;
              // ".csv" 拡張子を除去
              if (fileName) {
                fileName = fileName.replace(/\.csv$/i, '');
                setSheetTitle(fileName);
                console.log('📄 スプレッドシートタイトル:', fileName);
              }
            }
          }
        } catch (titleErr) {
          console.log('⚠️ タイトル取得に失敗:', titleErr.message);
        }

        // GASから最終更新日を取得
        try {
          const gasRes = await fetch(GAS_URL, { redirect: 'follow' });
          const text = await gasRes.text();
          // HtmlServiceはHTMLで返るのでJSONを抽出
          const match = text.match(/\{.*\}/s);
          if (match) {
            const gasData = JSON.parse(match[0]);
            if (gasData.lastUpdated) {
              setLastUpdated(gasData.lastUpdated);
              console.log('📅 最終更新日:', gasData.lastUpdated);
            }
          }
        } catch (gasErr) {
          console.log('⚠️ 最終更新日の取得に失敗:', gasErr.message);
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ エラーが発生しました:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // =========================================
  // ユーティリティ関数
  // =========================================

  // CSV パース関数（ダブルクォート内のカンマと改行を正しく処理）
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // =========================================
  // イベントハンドラ
  // =========================================

  const handleStartQuiz = () => {
    if (questions.length === 0) return;

    // 使用済みでない問題のみをフィルタリング
    const availableQuestions = questions.filter(q => !usedQuestionIds.has(q.id));

    let selected;
    
    // 利用可能な問題が50問未満の場合の処理
    if (availableQuestions.length < 50) {
      alert(`利用可能な問題が${availableQuestions.length}問です。\n新しい出題セットを始めるため、使用済み問題の記録をリセットします。`);
      // 使用済み記録をリセット
      setUsedQuestionIds(new Set());
      // リセット後に再度フィルタリング
      selected = shuffleArray(questions).slice(0, 50);
      // 今回選択した問題のIDを記録
      const newUsedIds = new Set(selected.map(q => q.id));
      setUsedQuestionIds(newUsedIds);
    } else {
      // 利用可能な問題から50問をランダムに選択
      selected = shuffleArray(availableQuestions).slice(0, 50);
      // 今回選択した問題のIDを記録（既存の使用済み記録に追加）
      const newUsedIds = new Set(usedQuestionIds);
      selected.forEach(q => newUsedIds.add(q.id));
      setUsedQuestionIds(newUsedIds);
    }

    // selected を使用して optionsMappings を生成（State更新前に実行）
    const optionsMappings = {};
    selected.forEach((q, idx) => {
      const shuffledOptions = shuffleArray(
        q.options.map((text, originalIdx) => ({ text, originalIdx }))
      );
      optionsMappings[idx] = shuffledOptions;
    });

    // State を一度に更新
    setShuffledQuestions(selected);
    setOptionsMap(optionsMappings);
    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
    setPendingAnswer(null);
  };

  const handleReset = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
    setShuffledQuestions([]);
    setOptionsMap({});
    setPendingAnswer(null);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswers[currentQuestion] !== undefined) return;
    // 仮選択（未確定）として記録
    setPendingAnswer(answerIndex);
  };

  const handleConfirmAnswer = () => {
    if (pendingAnswer === null || selectedAnswers[currentQuestion] !== undefined) return;

    const question = shuffledQuestions[currentQuestion];
    const mappedOptions = optionsMap[currentQuestion];
    const selectedOptionOriginalIndex = mappedOptions[pendingAnswer].originalIdx;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: selectedOptionOriginalIndex,
    }));
    setPendingAnswer(null);
    setShowExplanation(true);
  };

  const handleNext = () => {
    console.log(`[handleNext] currentQuestion: ${currentQuestion}, selectedAnswers[${currentQuestion}]: ${selectedAnswers[currentQuestion]}`);
    if (currentQuestion < shuffledQuestions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      console.log(`[handleNext] 次の問題: ${nextQuestion}, selectedAnswers[${nextQuestion}]: ${selectedAnswers[nextQuestion]}`);
      setCurrentQuestion(nextQuestion);
      setShowExplanation(false);
      setPendingAnswer(null);
    }
  };

  const handlePrev = () => {
    console.log(`[handlePrev] currentQuestion: ${currentQuestion}, selectedAnswers: `, selectedAnswers);
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(selectedAnswers[currentQuestion - 1] !== undefined);
      setPendingAnswer(null);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  // =========================================
  // レンダリング: ローディング状態
  // =========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-indigo-400 mx-auto mb-5"></div>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: エラー状態
  // =========================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
          <p className="text-red-400 text-xs tracking-widest uppercase mb-3">Error</p>
          <h2 className="text-xl font-semibold text-white mb-4">データの取得に失敗しました</h2>
          <p className="text-slate-400 text-sm whitespace-pre-wrap mb-6 leading-relaxed">{error}</p>
          <div className="border-t border-slate-700 pt-4 space-y-1 text-xs text-slate-500">
            <p>・Google Sheet ID が正しいか確認</p>
            <p>・スプレッドシートが公開設定になっているか確認</p>
            <p>・シート名が「questions」か確認</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: クイズ未開始状態
  // =========================================
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* タイトルエリア */}
          <div className="text-center mb-10">
            <p className="text-indigo-400 text-xs tracking-widest uppercase mb-4">Exam Simulator</p>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              {sheetTitle || 'JSTQB Advanced Level'}
            </h1>
            <p className="text-slate-400 text-sm">{SHEET_NAME}</p>
          </div>

          {/* 問題数バッジ */}
          <div className="flex justify-center gap-6 mb-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{questions.length}</p>
              <p className="text-slate-500 text-xs mt-1">総問題数</p>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50</p>
              <p className="text-slate-500 text-xs mt-1">出題数</p>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{questions.length - usedQuestionIds.size}</p>
              <p className="text-slate-500 text-xs mt-1">未出題</p>
            </div>
          </div>

          {/* 進捗バー */}
          {usedQuestionIds.size > 0 && (
            <div className="mb-8">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>進捗</span>
                <span>{usedQuestionIds.size} / {questions.length}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1">
                <div
                  className="bg-indigo-500 h-1 rounded-full transition-all"
                  style={{ width: `${(usedQuestionIds.size / questions.length) * 100}%` }}
                ></div>
              </div>
              <button
                onClick={() => {
                  if (confirm('使用済み問題の記録をリセットして、最初からやり直しますか？')) {
                    setUsedQuestionIds(new Set());
                  }
                }}
                className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
              >
                進捗をリセット
              </button>
            </div>
          )}

          {/* 開始ボタン */}
          <button
            onClick={handleStartQuiz}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/50 tracking-wide"
          >
            模試を開始
          </button>

          {/* フッター */}
          <div className="mt-8 text-center space-y-1">
            {lastUpdated && (
              <p className="text-slate-600 text-xs">最終更新: {lastUpdated}</p>
            )}
            <p className="text-slate-700 text-xs">Build: {buildInfo.buildDate}</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: 結果表示状態
  // =========================================
  if (showResults) {
    const questionList = shuffledQuestions;
    const correctCount = Object.entries(selectedAnswers).reduce((count, [qIdx, selectedIdx]) => {
      return count + (selectedIdx === questionList[qIdx].correct ? 1 : 0);
    }, 0);

    const categoryStats = {};
    questionList.forEach((q, idx) => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { total: 0, correct: 0 };
      }
      categoryStats[q.category].total += 1;
      if (selectedAnswers[idx] === q.correct) {
        categoryStats[q.category].correct += 1;
      }
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-indigo-400 text-xs tracking-widest uppercase text-center mb-8">Result</p>

          {/* スコア */}
          <div className="text-center mb-10">
            <p className="text-8xl font-bold text-white mb-2">{Math.round((correctCount / questionList.length) * 100)}<span className="text-3xl text-slate-500">%</span></p>
            <p className="text-slate-400 text-sm">{correctCount} / {questionList.length} 問正解</p>
          </div>

          {/* 分野別成績 */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
            <p className="text-slate-400 text-xs tracking-widest uppercase mb-5">分野別成績</p>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300">{category}</span>
                    <span className="text-sm text-slate-400">{stats.correct}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1">
                    <div
                      className="bg-indigo-500 h-1 rounded-full transition-all"
                      style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/50 flex items-center justify-center gap-2 tracking-wide"
          >
            <RotateCcw size={16} />
            もう一度チャレンジ
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: クイズ実施中
  // =========================================
  const questionList = shuffledQuestions;
  if (questionList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const question = questionList[currentQuestion];
  const mappedOptions = optionsMap[currentQuestion] || [];
  const correctAnswerIndex = question.correct;
  const displayOptions = mappedOptions.map((opt) => opt.text);

  // ★ 修正: 正解の表示位置を正しく計算 ★
  // シャッフル後の配列で、正解に対応するインデックスを探す
  const correctPositionInDisplay = mappedOptions.findIndex(opt => opt.originalIdx === correctAnswerIndex);
  const correctOptionText = mappedOptions[correctPositionInDisplay]?.text || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-indigo-400 text-sm font-medium">
              {currentQuestion + 1} <span className="text-slate-600">/ {questionList.length}</span>
            </span>
            <span className="text-xs text-slate-600">
              {question.category} · {question.chapter}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-0.5">
            <div
              className="bg-indigo-500 h-0.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questionList.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 問題カード */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-4">
          <p className="text-xs text-slate-500 mb-4">ID: {question.id}</p>
          <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-medium">
            {question.question}
          </p>
        </div>

        {/* 選択肢 */}
        <div className="space-y-2 mb-4">
          {displayOptions.map((option, index) => (
            <button
              key={`${currentQuestion}-${index}`}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswers[currentQuestion] !== undefined}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedAnswers[currentQuestion] !== undefined
                  ? mappedOptions[index].originalIdx === correctAnswerIndex
                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                    : selectedAnswers[currentQuestion] === mappedOptions[index].originalIdx
                    ? 'border-red-500 bg-red-900/30 text-red-300'
                    : 'border-slate-700 bg-slate-800/50 text-slate-500'
                  : pendingAnswer === index
                  ? 'border-indigo-500 bg-indigo-900/40 text-white cursor-pointer'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-xs font-bold mt-0.5 w-5 shrink-0 ${
                  selectedAnswers[currentQuestion] !== undefined
                    ? mappedOptions[index].originalIdx === correctAnswerIndex
                      ? 'text-emerald-400'
                      : selectedAnswers[currentQuestion] === mappedOptions[index].originalIdx
                      ? 'text-red-400'
                      : 'text-slate-600'
                    : pendingAnswer === index
                    ? 'text-indigo-400'
                    : 'text-slate-500'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-sm leading-relaxed">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 回答ボタン */}
        {selectedAnswers[currentQuestion] === undefined && (
          <div className="mb-4">
            <button
              onClick={handleConfirmAnswer}
              disabled={pendingAnswer === null}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl transition-all tracking-wide text-sm"
            >
              回答する
            </button>
          </div>
        )}

        {/* 解説 */}
        {showExplanation && (
          <div className={`rounded-xl p-5 mb-4 border ${
            selectedAnswers[currentQuestion] === correctAnswerIndex
              ? 'bg-emerald-900/20 border-emerald-800'
              : 'bg-slate-800 border-slate-700'
          }`}>
            <p className={`text-xs font-semibold tracking-widest uppercase mb-3 ${
              selectedAnswers[currentQuestion] === correctAnswerIndex ? 'text-emerald-400' : 'text-indigo-400'
            }`}>
              {selectedAnswers[currentQuestion] === correctAnswerIndex ? '✓ Correct' : 'Answer'}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
              {question.explanation}
            </p>
            <p className="text-xs text-slate-500">
              正解: <span className="text-slate-300 font-medium">{String.fromCharCode(65 + correctPositionInDisplay)}. {correctOptionText}</span>
            </p>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">前へ</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestion === questionList.length - 1}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span className="hidden sm:inline">次へ</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {showExplanation && currentQuestion === questionList.length - 1 && (
          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/50 tracking-wide text-sm"
          >
            結果を確認
          </button>
        )}
      </div>
    </div>
  );
};

export default JSTQBExam;
