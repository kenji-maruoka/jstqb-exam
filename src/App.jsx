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

  // =========================================
  // Google Sheets API からデータを取得
  // =========================================
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('📡 Google Sheets から問題データをフェッチしています...');

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

              questions = jsonData.table.rows.map((row) => {
                const cols = row.c;
                if (!cols[0] || !cols[0].v) return null;

                return {
                  id: parseInt(cols[0].v),
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
              const lines = text.trim().split('\n');
              questions = lines.slice(1).map((line) => {
                // CSV パース（簡易版）
                const parts = line.split(',');
                if (!parts[0]) return null;

                return {
                  id: parseInt(parts[0]),
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

    const selected = shuffleArray(questions).slice(0, 50);
    setShuffledQuestions(selected);

    const optionsMappings = {};
    selected.forEach((q, idx) => {
      const shuffledOptions = shuffleArray(
        q.options.map((text, originalIdx) => ({ text, originalIdx }))
      );
      optionsMappings[idx] = shuffledOptions;
    });
    setOptionsMap(optionsMappings);

    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
  };

  const handleReset = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
    setShuffledQuestions([]);
    setOptionsMap({});
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswers[currentQuestion] !== undefined) return;

    const question = shuffledQuestions[currentQuestion];
    const mappedOptions = optionsMap[currentQuestion];
    const selectedOptionOriginalIndex = mappedOptions[answerIndex].originalIdx;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: selectedOptionOriginalIndex,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(selectedAnswers[currentQuestion - 1] !== undefined);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">データを読み込み中...</h2>
          <p className="text-gray-600 mb-4">Google Sheets から問題データを取得しています</p>
          <p className="text-xs text-gray-500">
            このプロセスに数秒かかる場合があります
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // レンダリング: エラー状態
  // =========================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-red-600 mb-2">⚠️ エラーが発生しました</h2>
            <p className="text-gray-700 text-sm whitespace-pre-wrap mb-4">{error}</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-gray-700">
            <p className="font-bold mb-2">【対応方法】</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Google Sheet ID が正しいか確認</li>
              <li>Google Sheet が公開されているか確認</li>
              <li>シート名が「questions」か確認</li>
            </ol>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">JSTQB Advanced Level</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Test Management V3.0.J02</h2>
          <p className="text-gray-600 mb-6">
            {questions.length}問の高度なテスト管理問題から、毎回ランダムに50問が出題されます
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left text-sm text-gray-700">
            <p className="font-semibold mb-2">📋 特徴：</p>
            <ul className="space-y-1 text-xs">
              <li>✓ 難易度：高（実務的な判断が必要）</li>
              <li>✓ 長文問題：プロジェクト状況に基づいた判定</li>
              <li>✓ 見積もり：SMART関連問題充実</li>
              <li>✓ 毎回異なる出題順と選択肢順</li>
              <li>✓ Google Sheets から自動取得</li>
              <li>✓ 問題追加時にコードの変更は不要</li>
            </ul>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            模試を開始
          </button>

          <p className="text-xs text-gray-500 mt-4">
            データソース: Google Sheets（リアルタイム更新）
          </p>

          <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
            最終デプロイ: {buildInfo.buildDate}
          </p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">テスト結果</h2>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-700 mb-2">総合スコア</p>
              <p className="text-5xl font-bold text-blue-600">{correctCount}/{questionList.length}</p>
              <p className="text-xl text-gray-600 mt-2">
                正答率：<span className="font-bold">{Math.round((correctCount / questionList.length) * 100)}%</span>
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">分野別成績</h3>
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">{category}</span>
                    <span className="text-sm font-bold text-blue-600">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-blue-600">
              問題 {currentQuestion + 1}/{questionList.length}
            </span>
            <span className="text-xs text-gray-500">{question.category} - {question.chapter}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questionList.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-6 leading-relaxed whitespace-pre-wrap">
          {question.question}
        </h2>

        <div className="space-y-3 mb-6">
          {displayOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswers[currentQuestion] !== undefined}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswers[currentQuestion] !== undefined
                  ? mappedOptions[index].originalIdx === correctAnswerIndex
                    ? 'border-green-500 bg-green-50'
                    : selectedAnswers[currentQuestion] === mappedOptions[index].originalIdx
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-bold text-lg text-gray-600 mt-0.5">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-700">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              selectedAnswers[currentQuestion] === correctAnswerIndex
                ? 'bg-green-50 border-l-4 border-green-500'
                : 'bg-blue-50 border-l-4 border-blue-500'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                selectedAnswers[currentQuestion] === correctAnswerIndex ? 'text-green-800' : 'text-blue-800'
              } mb-2`}
            >
              {selectedAnswers[currentQuestion] === correctAnswerIndex ? '✓ 正解' : 'ℹ 解説'}
            </p>
            <p className="text-sm text-gray-700 mb-3">{question.explanation}</p>
            <p className="text-xs text-gray-600">
              正解: <span className="font-bold">{String.fromCharCode(65 + correctAnswerIndex)}</span>. {displayOptions[correctAnswerIndex]}
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 font-bold py-3 px-4 rounded-lg border-2 border-white transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">前へ</span>
          </button>
          <button
            onClick={handleNext}
            disabled={!showExplanation || currentQuestion === questionList.length - 1}
            className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 font-bold py-3 px-4 rounded-lg border-2 border-white transition-colors flex items-center justify-center gap-2"
          >
            <span className="hidden sm:inline">次へ</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {showExplanation && currentQuestion === questionList.length - 1 && (
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            結果を確認
          </button>
        )}
      </div>
    </div>
  );
};

export default JSTQBExam;
