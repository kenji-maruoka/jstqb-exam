import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import buildInfo from '../build-info.json';

// =========================================
// 定数
// =========================================
const GAS_FILE_LIST_URL = 'https://script.google.com/macros/s/AKfycbxi1NOTkaDgFctucHZRweVOl7ZIg85VGUJ3QI9ozhOPWm8CG__-nvVj9TvazKWZatot_A/exec';
const SHEET_NAME = 'questions';
// questionsシートのK列（11列目）に出題数の数値を書いておくと、その値を出題数として使う
// （未記入・不正な値の場合はデフォルト値を使用）
const DEFAULT_QUESTION_COUNT = 10;

const JSTQBExam = () => {
  // =========================================
  // State管理
  // phase: 'select' | 'loading' | 'error' | 'home' | 'quiz' | 'results'
  // =========================================
  const [phase, setPhase] = useState('select');
  const [spreadsheetList, setSpreadsheetList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [optionsMap, setOptionsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pendingAnswers, setPendingAnswers] = useState(new Set());
  const [sheetTitle, setSheetTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);

  const GAS_URL = '/api/last-updated';

  // =========================================
  // 起動時: GAS WebアプリからSpreadsheet一覧を取得
  // =========================================
  useEffect(() => {
    const fetchFileList = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const res = await fetch(GAS_FILE_LIST_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!data.files || data.files.length === 0) throw new Error('ファイルが見つかりませんでした');
        setSpreadsheetList(data.files);
      } catch (err) {
        console.error('ファイル一覧の取得に失敗:', err.message);
        setListError(err.message);
      } finally {
        setListLoading(false);
      }
    };
    fetchFileList();
  }, []);

  // =========================================
  // Google Sheets からデータを取得
  // =========================================
  const fetchQuestions = async (sheetId) => {
    setLoading(true);
    setError(null);

    try {
      const urls = [
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/query?tqx=out:json&sheet=${SHEET_NAME}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
      ];

      let questions = null;
      let lastError = null;
      // questionsシートのK列（11列目）に書かれた数値を出題数として使う。
      // どの行のK列でも良い（1箇所だけ書いておけばOK）
      let extractedQuestionCount = null;

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json, text/plain, */*' }
          });

          if (!response.ok) continue;

          const text = await response.text();

          if (text.includes('google.visualization')) {
            const jsonString = text.substring(47).slice(0, -2);
            const jsonData = JSON.parse(jsonString);

            // K列（index 10）に出題数の数値があれば読み取る
            jsonData.table.rows.forEach((row) => {
              const kCell = row.c && row.c[10] ? row.c[10].v : null;
              if (kCell !== undefined && kCell !== null && String(kCell).trim() !== '') {
                const n = parseInt(kCell, 10);
                if (!isNaN(n) && n > 0) extractedQuestionCount = n;
              }
            });

            questions = jsonData.table.rows.map((row) => {
              const cols = row.c;
              if (!cols[0] || !cols[0].v) return null;
              const correctRaw = String(cols[8].v || '0');
              const correctArr = correctRaw.includes(',')
                ? correctRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                : [parseInt(correctRaw) || 0];
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
                correct: correctArr,
                explanation: String(cols[9].v || '')
              };
            }).filter(q => q !== null);
            break;
          } else if (text.includes(',')) {
            const parseCSVWithNewlines = (csv) => {
              const rows = [];
              let row = [];
              let field = '';
              let insideQuotes = false;
              for (let i = 0; i < csv.length; i++) {
                const char = csv[i];
                const nextChar = csv[i + 1];
                if (char === '"') {
                  if (insideQuotes && nextChar === '"') { field += '"'; i++; }
                  else insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                  row.push(field); field = '';
                } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                  if (field.trim() || row.length > 0) {
                    row.push(field); rows.push(row); row = []; field = '';
                  }
                  if (char === '\r' && nextChar === '\n') i++;
                } else {
                  field += char;
                }
              }
              if (field.trim() || row.length > 0) { row.push(field); rows.push(row); }
              return rows;
            };

            const rows = parseCSVWithNewlines(text);

            // K列（index 10）に出題数の数値があれば読み取る
            rows.slice(1).forEach((row) => {
              let kCell = row[10];
              if (kCell !== undefined && kCell !== null) {
                kCell = String(kCell).trim();
                if (kCell.startsWith('"') && kCell.endsWith('"')) kCell = kCell.slice(1, -1);
                if (kCell !== '') {
                  const n = parseInt(kCell, 10);
                  if (!isNaN(n) && n > 0) extractedQuestionCount = n;
                }
              }
            });

            questions = rows.slice(1).map((row) => {
              const parts = row.map(cell => {
                let s = cell.trim();
                if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
                s = s.replace(/""/g, '"');
                return s;
              });
              if (!parts[0] || parts.length < 10) return null;
              const correctRaw = parts[8] || '0';
              const correctArr = correctRaw.includes(',')
                ? correctRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                : [parseInt(correctRaw) || 0];
              return {
                id: parts[0] || '',
                category: parts[1] || '',
                chapter: parts[2] || '',
                question: parts[3] || '',
                options: [parts[4] || '', parts[5] || '', parts[6] || '', parts[7] || ''],
                correct: correctArr,
                explanation: parts[9] || ''
              };
            }).filter(q => q !== null);
            break;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!questions || questions.length === 0) {
        throw new Error(
          'データが取得されませんでした。\n' +
          '・スプレッドシートが「リンクを知っている人は表示可能」に設定されているか確認してください\n' +
          '・シート名が「questions」か確認してください\n' +
          (lastError ? `\nエラー詳細: ${lastError.message}` : '')
        );
      }

      setQuestions(questions);

      // 出題数の設定（questionsシートのK列から読み取った値。無ければデフォルト）
      setQuestionCount(extractedQuestionCount || DEFAULT_QUESTION_COUNT);
      if (extractedQuestionCount) {
        console.log(`✅ K列から出題数を取得しました: ${extractedQuestionCount}問`);
      } else {
        console.log(`ℹ️ K列に出題数の設定が見つからないため、デフォルトの${DEFAULT_QUESTION_COUNT}問を使用します`);
      }

      // タイトル取得
      try {
        const titleRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
          { method: 'GET', mode: 'cors' }
        );
        if (titleRes.ok) {
          const disposition = titleRes.headers.get('Content-Disposition');
          if (disposition) {
            const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
            const plainMatch = disposition.match(/filename="([^"]+)"/i);
            let fileName = utf8Match
              ? decodeURIComponent(utf8Match[1])
              : plainMatch ? plainMatch[1] : null;
            if (fileName) {
              fileName = fileName.replace(/\.csv$/i, '');
              setSheetTitle(fileName);
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
        const match = text.match(/\{.*\}/s);
        if (match) {
          const gasData = JSON.parse(match[0]);
          if (gasData.lastUpdated) setLastUpdated(gasData.lastUpdated);
        }
      } catch (gasErr) {
        console.log('⚠️ 最終更新日の取得に失敗:', gasErr.message);
      }

      setLoading(false);
      setPhase('home');
    } catch (err) {
      console.error('❌ エラー:', err);
      setError(err.message);
      setLoading(false);
      setPhase('error');
    }
  };

  // =========================================
  // ファイル選択ハンドラ
  // =========================================
  const handleSelectSheet = (sheetId, sheetName) => {
    setSelectedSheetId(sheetId);
    setSelectedSheetName(sheetName);
    setUsedQuestionIds(new Set());
    setSheetTitle('');
    setQuestionCount(DEFAULT_QUESTION_COUNT);
    setPhase('loading');
    fetchQuestions(sheetId);
  };

  const handleBackToSelect = () => {
    setPhase('select');
    setQuestions([]);
    setSheetTitle('');
    setSelectedSheetId(null);
    setSelectedSheetName('');
    setShuffledQuestions([]);
    setSelectedAnswers({});
    setShowExplanation(false);
    setPendingAnswers(new Set());
    setQuestionCount(DEFAULT_QUESTION_COUNT);
  };

  // =========================================
  // ユーティリティ
  // =========================================
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // =========================================
  // クイズ操作ハンドラ
  // =========================================
  const handleStartQuiz = () => {
    if (questions.length === 0) return;
    // 出題数はファイルごとのconfig設定値（questionCount）を使用。
    // ただし総問題数を超えないようにする。
    const targetCount = Math.min(questionCount, questions.length);
    const availableQuestions = questions.filter(q => !usedQuestionIds.has(q.id));
    let selected;
    if (availableQuestions.length < targetCount) {
      alert(`利用可能な問題が${availableQuestions.length}問です。\n使用済み問題の記録をリセットします。`);
      setUsedQuestionIds(new Set());
      selected = shuffleArray(questions).slice(0, targetCount);
      setUsedQuestionIds(new Set(selected.map(q => q.id)));
    } else {
      selected = shuffleArray(availableQuestions).slice(0, targetCount);
      const newUsedIds = new Set(usedQuestionIds);
      selected.forEach(q => newUsedIds.add(q.id));
      setUsedQuestionIds(newUsedIds);
    }
    const optionsMappings = {};
    selected.forEach((q, idx) => {
      optionsMappings[idx] = shuffleArray(q.options.map((text, originalIdx) => ({ text, originalIdx })));
    });
    setShuffledQuestions(selected);
    setOptionsMap(optionsMappings);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setPendingAnswers(new Set());
    setPhase('quiz');
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setShuffledQuestions([]);
    setOptionsMap({});
    setPendingAnswers(new Set());
    setPhase('home');
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswers[currentQuestion] !== undefined) return;
    const question = shuffledQuestions[currentQuestion];
    const isMulti = question.correct.length > 1;
    if (isMulti) {
      setPendingAnswers(prev => {
        const next = new Set(prev);
        if (next.has(answerIndex)) next.delete(answerIndex);
        else next.add(answerIndex);
        return next;
      });
    } else {
      setPendingAnswers(new Set([answerIndex]));
    }
  };

  const handleConfirmAnswer = () => {
    if (pendingAnswers.size === 0 || selectedAnswers[currentQuestion] !== undefined) return;
    const mappedOptions = optionsMap[currentQuestion];
    const selectedOriginalIndices = Array.from(pendingAnswers)
      .map(displayIdx => mappedOptions[displayIdx].originalIdx)
      .sort((a, b) => a - b);
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: selectedOriginalIndices }));
    setPendingAnswers(new Set());
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setShowExplanation(selectedAnswers[nextQuestion] !== undefined);
      setPendingAnswers(new Set());
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(selectedAnswers[currentQuestion - 1] !== undefined);
      setPendingAnswers(new Set());
    }
  };

  const handleSubmit = () => {
    setPhase('results');
  };

  // =========================================
  // レンダリング: ファイル選択画面（プルダウン）
  // =========================================
  if (phase === 'select') {
    return (
      <SelectScreen
        listLoading={listLoading}
        listError={listError}
        spreadsheetList={spreadsheetList}
        onSelect={handleSelectSheet}
        buildDate={buildInfo.buildDate}
      />
    );
  }

  // =========================================
  // レンダリング: ローディング
  // =========================================
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-indigo-400 mx-auto mb-5"></div>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Loading</p>
          {selectedSheetName && (
            <p className="text-slate-600 text-xs mt-2 max-w-xs mx-auto truncate">{selectedSheetName}</p>
          )}
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: エラー
  // =========================================
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
          <p className="text-red-400 text-xs tracking-widest uppercase mb-3">Error</p>
          <h2 className="text-xl font-semibold text-white mb-4">データの取得に失敗しました</h2>
          <p className="text-slate-400 text-sm whitespace-pre-wrap mb-6 leading-relaxed">{error}</p>
          <button
            onClick={handleBackToSelect}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-xl transition-all text-sm"
          >
            ← ファイル選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: ホーム（クイズ未開始）
  // =========================================
  if (phase === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <p className="text-indigo-400 text-xs tracking-widest uppercase mb-4">Exam Simulator</p>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              {sheetTitle || selectedSheetName || 'JSTQB Advanced Level'}
            </h1>
            <p className="text-slate-400 text-sm">{SHEET_NAME}</p>
          </div>

          <div className="flex justify-center gap-6 mb-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{questions.length}</p>
              <p className="text-slate-500 text-xs mt-1">総問題数</p>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{Math.min(questionCount, questions.length)}</p>
              <p className="text-slate-500 text-xs mt-1">出題数</p>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{questions.length - usedQuestionIds.size}</p>
              <p className="text-slate-500 text-xs mt-1">未出題</p>
            </div>
          </div>

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

          <button
            onClick={handleStartQuiz}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/50 tracking-wide mb-3"
          >
            模試を開始
          </button>

          <button
            onClick={handleBackToSelect}
            className="w-full bg-transparent hover:bg-slate-800 text-slate-500 hover:text-slate-300 font-medium py-2.5 px-6 rounded-xl transition-all text-sm border border-slate-700 hover:border-slate-600"
          >
            別のファイルを選択
          </button>

          <div className="mt-8 text-center space-y-1">
            {lastUpdated && <p className="text-slate-600 text-xs">最終更新: {lastUpdated}</p>}
            <p className="text-slate-700 text-xs">Build: {buildInfo.buildDate}</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: 結果
  // =========================================
  if (phase === 'results') {
    const questionList = shuffledQuestions;
    const correctCount = Object.entries(selectedAnswers).reduce((count, [qIdx, selectedArr]) => {
      const q = questionList[qIdx];
      const correctArr = [...q.correct].sort((a, b) => a - b);
      const answeredArr = [...selectedArr].sort((a, b) => a - b);
      const isCorrect = correctArr.length === answeredArr.length && correctArr.every((v, i) => v === answeredArr[i]);
      return count + (isCorrect ? 1 : 0);
    }, 0);

    const categoryStats = {};
    questionList.forEach((q, idx) => {
      if (!categoryStats[q.category]) categoryStats[q.category] = { total: 0, correct: 0 };
      categoryStats[q.category].total += 1;
      const selectedArr = selectedAnswers[idx] || [];
      const correctArr = [...q.correct].sort((a, b) => a - b);
      const answeredArr = [...selectedArr].sort((a, b) => a - b);
      if (correctArr.length === answeredArr.length && correctArr.every((v, i) => v === answeredArr[i])) {
        categoryStats[q.category].correct += 1;
      }
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-indigo-400 text-xs tracking-widest uppercase text-center mb-8">Result</p>
          <div className="text-center mb-10">
            <p className="text-8xl font-bold text-white mb-2">
              {Math.round((correctCount / questionList.length) * 100)}
              <span className="text-3xl text-slate-500">%</span>
            </p>
            <p className="text-slate-400 text-sm">{correctCount} / {questionList.length} 問正解</p>
          </div>
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/50 flex items-center justify-center gap-2 tracking-wide mb-3"
          >
            <RotateCcw size={16} />
            もう一度チャレンジ
          </button>
          <button
            onClick={handleBackToSelect}
            className="w-full bg-transparent hover:bg-slate-800 text-slate-500 hover:text-slate-300 font-medium py-2.5 px-6 rounded-xl transition-all text-sm border border-slate-700 hover:border-slate-600"
          >
            別のファイルを選択
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
  const correctAnswerIndices = question.correct;
  const isMultiAnswer = correctAnswerIndices.length > 1;
  const displayOptions = mappedOptions.map((opt) => opt.text);

  const correctPositionsInDisplay = mappedOptions
    .map((opt, displayIdx) => ({ displayIdx, originalIdx: opt.originalIdx }))
    .filter(({ originalIdx }) => correctAnswerIndices.includes(originalIdx))
    .map(({ displayIdx }) => displayIdx);

  const answered = selectedAnswers[currentQuestion] !== undefined;
  const answeredOriginalIndices = answered ? selectedAnswers[currentQuestion] : [];

  const isAnswerCorrect = answered && (() => {
    const correctArr = [...correctAnswerIndices].sort((a, b) => a - b);
    const answeredArr = [...answeredOriginalIndices].sort((a, b) => a - b);
    return correctArr.length === answeredArr.length && correctArr.every((v, i) => v === answeredArr[i]);
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
      <div className="max-w-3xl mx-auto">
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

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-4">
          <p className="text-xs text-slate-500 mb-4">ID: {question.id}</p>
          {isMultiAnswer && (
            <p className="text-xs text-indigo-400 mb-3 font-medium">※ 正解は {correctAnswerIndices.length} つあります（複数選択）</p>
          )}
          <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-medium">
            {question.question}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {displayOptions.map((option, index) => {
            const optOriginalIdx = mappedOptions[index]?.originalIdx;
            const isCorrectOption = correctAnswerIndices.includes(optOriginalIdx);
            const isSelectedOption = answered
              ? answeredOriginalIndices.includes(optOriginalIdx)
              : pendingAnswers.has(index);

            let buttonClass = 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer';
            if (answered) {
              if (isCorrectOption) buttonClass = 'border-emerald-500 bg-emerald-900/30 text-emerald-300';
              else if (isSelectedOption) buttonClass = 'border-red-500 bg-red-900/30 text-red-300';
              else buttonClass = 'border-slate-700 bg-slate-800/50 text-slate-500';
            } else if (isSelectedOption) {
              buttonClass = 'border-indigo-500 bg-indigo-900/40 text-white cursor-pointer';
            }

            let labelClass = 'text-slate-500';
            if (answered) {
              if (isCorrectOption) labelClass = 'text-emerald-400';
              else if (isSelectedOption) labelClass = 'text-red-400';
              else labelClass = 'text-slate-600';
            } else if (isSelectedOption) {
              labelClass = 'text-indigo-400';
            }

            return (
              <button
                key={`${currentQuestion}-${index}`}
                onClick={() => handleAnswerSelect(index)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl border transition-all ${buttonClass}`}
              >
                <div className="flex items-start gap-3">
                  {isMultiAnswer && !answered ? (
                    <span className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                      isSelectedOption ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500'
                    }`}>
                      {isSelectedOption && <span className="text-white text-xs font-bold">✓</span>}
                    </span>
                  ) : (
                    <span className={`text-xs font-bold mt-0.5 w-5 shrink-0 ${labelClass}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                  )}
                  <span className="text-sm leading-relaxed">{option}</span>
                  {answered && isCorrectOption && (
                    <span className="ml-auto text-emerald-400 text-xs font-bold shrink-0">✓ 正解</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!answered && (
          <div className="mb-4">
            <button
              onClick={handleConfirmAnswer}
              disabled={pendingAnswers.size === 0 || (isMultiAnswer && pendingAnswers.size < correctAnswerIndices.length)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl transition-all tracking-wide text-sm"
            >
              {isMultiAnswer
                ? `回答する（${pendingAnswers.size} / ${correctAnswerIndices.length} 選択中）`
                : '回答する'}
            </button>
          </div>
        )}

        {showExplanation && (
          <div className={`rounded-xl p-5 mb-4 border ${
            isAnswerCorrect ? 'bg-emerald-900/20 border-emerald-800' : 'bg-slate-800 border-slate-700'
          }`}>
            <p className={`text-xs font-semibold tracking-widest uppercase mb-3 ${
              isAnswerCorrect ? 'text-emerald-400' : 'text-indigo-400'
            }`}>
              {isAnswerCorrect ? '✓ Correct' : 'Answer'}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
              {question.explanation}
            </p>
            <p className="text-xs text-slate-500">
              正解:{' '}
              {correctPositionsInDisplay.map((displayIdx, i) => (
                <span key={displayIdx} className="text-slate-300 font-medium">
                  {i > 0 && '、'}
                  {String.fromCharCode(65 + displayIdx)}. {mappedOptions[displayIdx]?.text}
                </span>
              ))}
            </p>
          </div>
        )}

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

// =========================================
// ファイル選択画面コンポーネント（プルダウン）
// =========================================
const SelectScreen = ({ listLoading, listError, spreadsheetList, onSelect, buildDate }) => {
  const [selectedId, setSelectedId] = useState('');

  const handleStart = () => {
    if (!selectedId) return;
    const file = spreadsheetList.find(f => f.id === selectedId);
    if (file) onSelect(file.id, file.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <p className="text-indigo-400 text-xs tracking-widest uppercase mb-4">Exam Simulator</p>
          <h1 className="text-3xl font-bold text-white leading-tight mb-2">模試アプリ</h1>
          <p className="text-slate-400 text-sm">使用する模試ファイルを選択してください</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          {listLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-indigo-400 mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm">ファイル一覧を取得中...</p>
            </div>
          ) : listError ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-xs tracking-widest uppercase mb-3">Error</p>
              <p className="text-slate-400 text-sm leading-relaxed">{listError}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs tracking-widest uppercase mb-3 block">
                  模試ファイル
                </label>
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full appearance-none bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer pr-10"
                  >
                    <option value="" disabled className="text-slate-500">-- 選択してください --</option>
                    {spreadsheetList.map(file => (
                      <option key={file.id} value={file.id} className="bg-slate-700 text-white">
                        {file.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {selectedId && (() => {
                  const f = spreadsheetList.find(f => f.id === selectedId);
                  return f?.modifiedTime ? (
                    <p className="text-slate-500 text-xs mt-2 pl-1">
                      最終更新: {new Date(f.modifiedTime).toLocaleDateString('ja-JP')}
                    </p>
                  ) : null;
                })()}
              </div>

              <button
                onClick={handleStart}
                disabled={!selectedId}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/50 tracking-wide text-sm"
              >
                開始する
              </button>
            </div>
          )}
        </div>

        <p className="text-slate-700 text-xs text-center mt-6">Build: {buildDate}</p>
      </div>
    </div>
  );
};

export default JSTQBExam;
