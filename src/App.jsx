import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

// ここに jstqb_exam.jsx の内容をすべて貼り付け
// const JSTQBExam = () => { ... } の部分

const JSTQBExam = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [optionsMap, setOptionsMap] = useState({});

  // 配列をシャッフルする関数
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 基本問題データ
  const baseQuestions = [
    {
      id: 1,
      category: "テスト活動のマネジメント",
      chapter: "1.1 テストプロセス",
      question: "テスト計画プロセスで最初に行うべき活動は次のどれか？",
      options: [
        "テストケースを詳細に設計する",
        "組織のコンテキストとテストのスコープを理解する",
        "テスト環境をセットアップする",
        "欠陥レポートを作成する"
      ],
      correct: 1,
      explanation: "テスト計画では、組織的コンテキスト、テスト戦略、およびテストスコープを理解することが最初の重要なステップです。これにより、効果的なテスト計画書の開発が可能になります。"
    },
    {
      id: 2,
      category: "テスト活動のマネジメント",
      chapter: "1.1 テストプロセス",
      question: "テストモニタリングとテストコントロールの違いについて正しい説明はどれか？",
      options: [
        "モニタリングは追跡、コントロールは是正措置を実施する",
        "モニタリングはコントロール活動の後に実施される",
        "コントロールは計画段階で、モニタリングは実行段階で行われる",
        "モニタリングとコントロールは同じ活動である"
      ],
      correct: 0,
      explanation: "テストモニタリングはテスト進捗や結果の追跡を行い、テストコントロールは計画からの逸脱に対して是正措置を実施します。"
    },
    {
      id: 3,
      category: "テスト活動のマネジメント",
      chapter: "1.1 テストプロセス",
      question: "テスト計画書に含めるべき要素として適切でないのはどれか？",
      options: [
        "テスト目的とテストスコープ",
        "テストリソースとテストスケジュール",
        "天気予報情報",
        "テストリスクと対応アプローチ"
      ],
      correct: 2,
      explanation: "テスト計画書には、テスト目的、スコープ、アプローチ、リソース、スケジュール、リスク対応などを含める必要があります。天気予報情報は無関係です。"
    },
    {
      id: 4,
      category: "テスト活動のマネジメント",
      chapter: "1.1 テストプロセス",
      question: "テスト完了時に実施すべき活動は次のどれか？",
      options: [
        "新しいテストプロジェクトを開始する",
        "テスト成果物の保管、教訓の文書化、テスト環境のクリーンアップ",
        "全テスト担当者を解雇する",
        "テストデータの削除"
      ],
      correct: 1,
      explanation: "テスト完了では、テスト成果物の保管、学んだ教訓の文書化、テスト環境のクリーンアップなど、重要なクローズアウト活動を実施します。"
    },
    {
      id: 5,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "テストステークホルダーマトリクスにおいて、『推進者』の特徴は次のどれか？",
      options: [
        "影響力が高く、関心が高い",
        "影響力が高く、関心が低い",
        "影響力が低く、関心が高い",
        "影響力が低く、関心が低い"
      ],
      correct: 0,
      explanation: "推進者は高い影響力と関心を持つ主要な協力者で、テスト戦略やテスト計画の形成に不可欠です。"
    },
    {
      id: 6,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "『潜在的協力者』に対して最も適切なステークホルダー管理方法は？",
      options: [
        "定期的なメール報告のみ",
        "資源配置やプロジェクト方向性での決定に関与させる",
        "完全に無視する",
        "日々の詳細報告を行う"
      ],
      correct: 1,
      explanation: "潜在的協力者は影響力は高いが関心は低いため、リソース配置や高位の方向性決定に関与させることが重要です。"
    },
    {
      id: 7,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "ハイブリッドソフトウェア開発モデルにおけるテストマネジメントの特徴は次のどれか？",
      options: [
        "完全にアジャイル手法を採用する",
        "完全にシーケンシャル手法を採用する",
        "従来の手法とアジャイル手法の両要素を統合する",
        "テストを実施しない"
      ],
      correct: 2,
      explanation: "ハイブリッドソフトウェア開発は、シーケンシャルアプローチとアジャイルプラクティスの両要素を統合したアプローチです。"
    },
    {
      id: 8,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "シーケンシャル開発モデル（V字モデル）でのテスト見積り特性は？",
      options: [
        "イテレーティブな見積り",
        "テストレベルごとの早期詳細見積り",
        "継続的な見積りの更新",
        "見積りを行わない"
      ],
      correct: 1,
      explanation: "シーケンシャル開発モデルでは、各テストレベルに対して早期に詳細な見積りを行う特性があります。"
    },
    {
      id: 9,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "イテレーティブ開発モデル（スクラム）でのテストアプローチの特徴は？",
      options: [
        "事前にすべてのテストスケジュールを決定する",
        "適応性とフィードバックに重点を置き、イテレーション内に組み込む",
        "テストを後段階に延期する",
        "テストを実施しない"
      ],
      correct: 1,
      explanation: "イテレーティブ開発では、テストは各イテレーション内に組み込まれ、継続的なフィードバックに基づいて適応されます。"
    },
    {
      id: 10,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "コンポーネントテストのテストマネジメントで重点を置くべき活動は？",
      options: [
        "ユーザー受け入れテストの実施",
        "コンポーネント（ユニット）テストのスコープ・目的・完了基準の定義",
        "システム統合テストのみ",
        "運用テストの実施"
      ],
      correct: 1,
      explanation: "コンポーネントテストのマネジメントでは、明確なスコープ、目的、完了基準の定義が重要です。"
    },
    {
      id: 11,
      category: "テスト活動のマネジメント",
      chapter: "1.2 テストのコンテキスト",
      question: "システムテストのテストマネジメントで重要な活動は？",
      options: [
        "コードレビューの実施",
        "リソース配置、ツール選択、スケジュール調整とSDLCへの適合",
        "ユニットテストの実施",
        "デプロイメントの実施"
      ],
      correct: 1,
      explanation: "システムテストのマネジメントでは、リソース配置、ツール選択、スケジューリングを慎重に行い、SDLC モデルに適合させることが重要です。"
    },
    {
      id: 12,
      category: "テスト活動のマネジメント",
      chapter: "1.3 リスクベースドテスト",
      question: "リスク軽減活動としてのテストの役割について、正しい説明はどれか？",
      options: [
        "すべてのリスクを完全に排除する",
        "特定のプロダクトリスクに対応するために実施される",
        "組織的リスクのみを対象にする",
        "リスクマネジメントとは無関係である"
      ],
      correct: 1,
      explanation: "テストは品質リスクを軽減するために実施される活動であり、特定のプロダクトリスクに対応する適切なテストアプローチを選択することが重要です。"
    },
    {
      id: 13,
      category: "テスト活動のマネジメント",
      chapter: "1.3 リスクベースドテスト",
      question: "プロダクト品質リスクのレベルを決定する主要な要因は次のどれか？",
      options: [
        "プロジェクトの予算のみ",
        "リスクの影響度と発生可能性",
        "テストマネージャーの経験年数のみ",
        "開発チームのサイズ"
      ],
      correct: 1,
      explanation: "リスクレベルは、リスクの影響度（影響）とリスク発生の可能性（確率）の組み合わせにより決定されます。"
    },
    {
      id: 14,
      category: "テスト活動のマネジメント",
      chapter: "1.3 リスクベースドテスト",
      question: "品質リスクの識別に使用できる技法として適切でないのは？",
      options: [
        "エキスパートインタビュー",
        "要件分析",
        "ブレーンストーミング",
        "天気予報の分析"
      ],
      correct: 3,
      explanation: "品質リスク識別には、エキスパートインタビュー、要件分析、ブレーンストーミングなどが有効です。天気予報は無関係です。"
    },
    {
      id: 15,
      category: "テスト活動のマネジメント",
      chapter: "1.3 リスクベースドテスト",
      question: "リスクベースドテストに関連する困難さの例として正しいのは？",
      options: [
        "リスク識別が簡単である",
        "すべてのリスクを完全に識別できる",
        "リスク優先順位の判断が複雑である",
        "リスク分析が不要である"
      ],
      correct: 2,
      explanation: "リスクベースドテストの困難さには、すべてのリスクを識別することの難しさ、リスク優先順位の判断の複雑さなどが含まれます。"
    },
    {
      id: 16,
      category: "テスト活動のマネジメント",
      chapter: "1.4 プロジェクトテスト戦略",
      question: "テストアプローチの選択に影響を与える要因は次のどれか？",
      options: [
        "組織的テスト戦略とプロジェクトのコンテキストのみ",
        "テスト技術者のスキルレベルのみ",
        "予算とスケジュールのみ",
        "顧客の名前"
      ],
      correct: 0,
      explanation: "適切なテストアプローチは、組織的テスト戦略、プロジェクトのコンテキスト、規制標準、およびリスク対応アプローチに基づいて選択されます。"
    },
    {
      id: 17,
      category: "テスト活動のマネジメント",
      chapter: "1.4 プロジェクトテスト戦略",
      question: "リスクベースドテスト戦略の特徴として正しいのは？",
      options: [
        "すべてのテスト領域に同じ資源を配分する",
        "高リスク領域に集中してテストリソースを配分する",
        "リスク分析を実施しない",
        "テストを実施しない"
      ],
      correct: 1,
      explanation: "リスクベースドテスト戦略では、識別した高リスク領域に集中してテストリソースを配分することが特徴です。"
    },
    {
      id: 18,
      category: "テスト活動のマネジメント",
      chapter: "1.4 プロジェクトテスト戦略",
      question: "SMART法則を使用してテスト目的を定義する場合、以下のどれが重要な特性か？",
      options: [
        "曖昧で柔軟である",
        "高額である",
        "測定可能である",
        "無制限である"
      ],
      correct: 2,
      explanation: "SMART法則では、テスト目的は具体的(Specific)、測定可能(Measurable)、達成可能(Achievable)、関連性がある(Relevant)、時間制限がある(Time-bound)である必要があります。"
    },
    {
      id: 19,
      category: "テスト活動のマネジメント",
      chapter: "1.4 プロジェクトテスト戦略",
      question: "適切なテスト終了基準の設定に影響を与える要因は？",
      options: [
        "テスト担当者の好み",
        "テスト目的、ビジネス要件、リスク",
        "天気状況",
        "チームメンバーの誕生日"
      ],
      correct: 1,
      explanation: "テスト終了基準は、テスト目的、ビジネス要件、リスク評価に基づいて定義されるべきです。"
    },
    {
      id: 20,
      category: "テスト活動のマネジメント",
      chapter: "1.5 テストプロセス改善",
      question: "IDEALモデルの5つのフェーズの正しい順序は？",
      options: [
        "Initiate, Diagnose, Establish, Act, Learn",
        "Establish, Initiate, Diagnose, Act, Learn",
        "Learn, Act, Establish, Diagnose, Initiate",
        "Act, Diagnose, Initiate, Learn, Establish"
      ],
      correct: 0,
      explanation: "IDEALモデルの5つのフェーズは、Initiate(開始)、Diagnose(診断)、Establish(確立)、Act(実行)、Learn(学習)の順序です。"
    },
    {
      id: 21,
      category: "テスト活動のマネジメント",
      chapter: "1.5 テストプロセス改善",
      question: "IDEALモデルにおける『Establish』フェーズの主な目的は？",
      options: [
        "改善の実装を行う",
        "改善ソリューションの計画と準備を行う",
        "現在のプロセスを診断する",
        "改善効果を評価する"
      ],
      correct: 1,
      explanation: "『Establish』フェーズでは、改善ソリューションの計画と準備を行い、実装のための基盤を整えます。"
    },
    {
      id: 22,
      category: "テスト活動のマネジメント",
      chapter: "1.5 テストプロセス改善",
      question: "ふりかえり(レトロスペクティブ)の主な目的は次のどれか？",
      options: [
        "テスト実行中のバグを修正する",
        "テストプロセス中に学んだ教訓を議論・文書化する",
        "テスト環境をセットアップする",
        "欠陥データベースを更新する"
      ],
      correct: 1,
      explanation: "ふりかえりはテスト完了時に行われる活動で、テストプロセス中に学んだ重要な教訓を議論・文書化し、将来の改善に活かします。"
    },
    {
      id: 23,
      category: "テスト活動のマネジメント",
      chapter: "1.5 テストプロセス改善",
      question: "テストプロセス改善における分析ベースアプローチの特徴は？",
      options: [
        "モデルに基づく改善のみ",
        "テストメトリクスや欠陥データを分析して改善機会を特定する",
        "分析を実施しない",
        "ふりかえりのみに依存する"
      ],
      correct: 1,
      explanation: "分析ベースアプローチは、テストメトリクス、欠陥データ、その他の定量データを分析して、具体的な改善機会を特定します。"
    },
    {
      id: 24,
      category: "テスト活動のマネジメント",
      chapter: "1.5 テストプロセス改善",
      question: "モデルベースのテストプロセス改善で使用されるTPI NEXTについて正しいのは？",
      options: [
        "テスト自動化のみを対象にする",
        "テスト成熟度を評価し、改善キーエリアをガイドする",
        "分析を行わない",
        "費用対効果を無視する"
      ],
      correct: 1,
      explanation: "TPI NEXTはテスト成熟度モデルで、キーエリアを通じてテストプロセス改善のガイダンスを提供します。"
    },
    {
      id: 25,
      category: "テスト活動のマネジメント",
      chapter: "1.6 テストツール",
      question: "テストツール導入時の最良実践として正しいのはどれか？",
      options: [
        "最初から全機能を導入する",
        "パイロットプロジェクトから開始し、段階的に導入する",
        "ツール選定を機械的に行う",
        "チーム全体の意見は不要である"
      ],
      correct: 1,
      explanation: "ツール導入の最良実践は、パイロットプロジェクトから始めて段階的に導入し、組織の成熟度に合わせて進めることです。"
    },
    {
      id: 26,
      category: "テスト活動のマネジメント",
      chapter: "1.6 テストツール",
      question: "ツール選定の際に考慮すべきビジネス的側面は次のどれか？",
      options: [
        "ツールの技術仕様のみ",
        "ROI（投資効果）、コスト、サポート、メンテナンス",
        "ツールの色の好み",
        "開発言語の種類"
      ],
      correct: 1,
      explanation: "ツール選定では、ROI、導入コスト、ベンダーサポート、メンテナンスコストなどのビジネス的側面を考慮する必要があります。"
    },
    {
      id: 27,
      category: "テスト活動のマネジメント",
      chapter: "1.6 テストツール",
      question: "ツールのライフサイクルステージとして適切なのは？",
      options: [
        "導入のみ",
        "運用のみ",
        "選定、導入、運用、保守・廃棄",
        "廃棄のみ"
      ],
      correct: 2,
      explanation: "ツールのライフサイクルには、選定、導入、運用、保守・廃棄の各段階が含まれます。"
    },
    {
      id: 28,
      category: "テスト活動のマネジメント",
      chapter: "1.6 テストツール",
      question: "テストツール選定の際のリスク分析で考慮すべき要素は？",
      options: [
        "ツールのコストのみ",
        "技術的リスク、運用リスク、組織的リスク",
        "天気予報",
        "チームメンバーの意見は不要"
      ],
      correct: 1,
      explanation: "ツール選定のリスク分析では、技術的なリスク（統合性、互換性）、運用リスク（サポート、保守）、組織的リスク（採用、変更管理）を考慮します。"
    },
    {
      id: 29,
      category: "プロダクトのマネジメント",
      chapter: "2.1 テストメトリクス",
      question: "テストメトリクスを使用する主な目的は次のどれか？",
      options: [
        "テスト進捗をモニタリングし、テスト目的への達成状況をアセスメントする",
        "全テスト技術者を削減する",
        "テストケースの削除を決定する",
        "テスト実行を停止する"
      ],
      correct: 0,
      explanation: "テストメトリクスは、テスト進捗のモニタリング、テスト目的への到達を評価し、テストコントロール活動を支援するために使用されます。"
    },
    {
      id: 30,
      category: "プロダクトのマネジメント",
      chapter: "2.1 テストメトリクス",
      question: "テスト実行率メトリクスが示すのは？",
      options: [
        "検出された欠陥の数",
        "計画されたテストのうち、実行したテストの割合",
        "テストの品質",
        "チームの生産性のみ"
      ],
      correct: 1,
      explanation: "テスト実行率は、計画されたテストのうちどの程度実行されたかを示す重要なメトリクスです。"
    },
    {
      id: 31,
      category: "プロダクトのマネジメント",
      chapter: "2.1 テストメトリクス",
      question: "テスト報告において、プロジェクトステークホルダーが理解しやすい形で提示することが重要な理由は？",
      options: [
        "テスト報告は技術的な内容のみを含める",
        "ステークホルダーの背景や関心に応じた適切な情報を提供するため",
        "報告書のページ数を増やすため",
        "テスト実行時間を短縮するため"
      ],
      correct: 1,
      explanation: "効果的なテスト報告は、異なるステークホルダーの関心に合わせて情報を提示する必要があります。例えば、経営層には高位の情報を、技術者には詳細な情報を提供します。"
    },
    {
      id: 32,
      category: "プロダクトのマネジメント",
      chapter: "2.1 テストメトリクス",
      question: "GQM（ゴール・クエスチョン・メトリクス）フレームワークの構成要素は？",
      options: [
        "目標、質問、メトリクスの3層構造",
        "予算のみ",
        "人数のみ",
        "日時のみ"
      ],
      correct: 0,
      explanation: "GQMフレームワークは、高位の目標を定義し、それを実現するための質問を立て、その質問に答えるためのメトリクスを選択する3層構造です。"
    },
    {
      id: 33,
      category: "プロダクトのマネジメント",
      chapter: "2.2 テスト見積り",
      question: "テスト工数見積りの際に影響を与える可能性のある要因は次のどれか？",
      options: [
        "テスト計画書の長さのみ",
        "要件の複雑さ、テスト対象範囲、チーム経験、利用可能なツール",
        "プロジェクトマネージャーの名前",
        "使用するプログラミング言語"
      ],
      correct: 1,
      explanation: "テスト工数見積りに影響を与える要因には、要件分析の深さ、対象の複雑さ、チームスキル、テスト環境の準備状況、利用可能なツールなどが含まれます。"
    },
    {
      id: 34,
      category: "プロダクトのマネジメント",
      chapter: "2.2 テスト見積り",
      question: "類推見積り技法の特徴は？",
      options: [
        "過去のプロジェクトデータを参考にして見積りを行う",
        "数学的パラメータのみに基づく",
        "エキスパートの経験のみに依存する",
        "見積りを行わない"
      ],
      correct: 0,
      explanation: "類推見積りは、過去の類似したプロジェクトのデータを参考にして、現在のプロジェクトの見積りを行う技法です。"
    },
    {
      id: 35,
      category: "プロダクトのマネジメント",
      chapter: "2.2 テスト見積り",
      question: "複数のテスト見積り技法を組み合わせることのメリットは？",
      options: [
        "見積りプロセスを複雑にする",
        "複数の視点から見積りの精度を高める",
        "最もシンプルな技法のみを使用する",
        "見積りを実施しない"
      ],
      correct: 1,
      explanation: "複数の見積り技法（類推見積り、パラメータ見積り、経験値基準見積りなど）を組み合わせることで、見積りの精度と信頼性が向上します。"
    },
    {
      id: 36,
      category: "プロダクトのマネジメント",
      chapter: "2.2 テスト見積り",
      question: "見積りの信頼度を向上させるために重要な活動は？",
      options: [
        "見積りを1回のみ実施する",
        "定期的に見積りを見直し、実績データと比較して改善する",
        "見積りを修正しない",
        "見積りプロセスを簡潔にする"
      ],
      correct: 1,
      explanation: "見積りの精度向上には、実績データとの比較、定期的なレビュー、改善が必要です。"
    },
    {
      id: 37,
      category: "プロダクトのマネジメント",
      chapter: "2.3 欠陥マネジメント",
      question: "欠陥のライフサイクルにおいて、『オープン』状態の意味は次のどれか？",
      options: [
        "欠陥が存在しない",
        "欠陥が報告され、未解決である",
        "欠陥が修正され、テスト完了している",
        "欠陥レポートが削除されている"
      ],
      correct: 1,
      explanation: "欠陥のオープン状態は、欠陥が報告されたが、まだ解決されていない状態を表します。修正または却下されるまで継続します。"
    },
    {
      id: 38,
      category: "プロダクトのマネジメント",
      chapter: "2.3 欠陥マネジメント",
      question: "欠陥のライフサイクルステージとして適切なものは？",
      options: [
        "報告のみ",
        "報告、割り当て、修正、検証、終了",
        "修正のみ",
        "削除のみ"
      ],
      correct: 1,
      explanation: "欠陥のライフサイクルには、報告、割り当て、修正、検証、終了の各ステージが含まれます。"
    },
    {
      id: 39,
      category: "プロダクトのマネジメント",
      chapter: "2.3 欠陥マネジメント",
      question: "アジャイルチームにおける欠陥マネジメントの特徴は次のどれか？",
      options: [
        "欠陥報告を行わない",
        "バックログアイテムとしてプロダクトバックログで管理する",
        "欠陥を無視する",
        "欠陥レポートを手作業で管理する"
      ],
      correct: 1,
      explanation: "アジャイルチームでは、欠陥はプロダクトバックログアイテムとして管理され、スプリント計画時に優先順位付けされることが多いです。"
    },
    {
      id: 40,
      category: "プロダクトのマネジメント",
      chapter: "2.3 欠陥マネジメント",
      question: "欠陥レポートに含めるべき重要な情報は次のどれか？",
      options: [
        "テスト担当者の名前のみ",
        "欠陥の説明、再現手順、期待される結果、実際の結果、重大度、優先度",
        "プロジェクトの色",
        "天気情報"
      ],
      correct: 1,
      explanation: "効果的な欠陥レポートには、欠陥の説明、再現方法、期待結果と実際の結果、環境情報、重大度、優先度などが含まれるべきです。"
    },
    {
      id: 41,
      category: "プロダクトのマネジメント",
      chapter: "2.3 欠陥マネジメント",
      question: "欠陥の重大度と優先度の違いについて正しい説明は？",
      options: [
        "同じものである",
        "重大度はビジネスへの影響、優先度は修正の順序を示す",
        "重大度はテスト担当者のみが決定する",
        "優先度は考慮しない"
      ],
      correct: 1,
      explanation: "重大度はシステムへの影響度を示し、優先度はビジネスニーズに基づいた修正の順序を示します。"
    },
    {
      id: 42,
      category: "チームのマネジメント",
      chapter: "3.1 テストチーム",
      question: "テストチームメンバーに求められる4つの能力領域は次のどれか？",
      options: [
        "身体、精神、感情、精神",
        "技術、人間関係、マネジメント、ドメイン",
        "色、形、大きさ、重さ",
        "音、光、温度、湿度"
      ],
      correct: 1,
      explanation: "テストチームメンバーに求められる4つの能力領域は、技術的能力、人間関係スキル、マネジメント能力、ドメイン知識です。"
    },
    {
      id: 43,
      category: "チームのマネジメント",
      chapter: "3.1 テストチーム",
      question: "テストチームメンバーのスキルアセスメントの目的は？",
      options: [
        "全員を解雇する",
        "各メンバーの強みと改善が必要な領域を特定し、スキル開発計画を策定する",
        "給与を決定するのみ",
        "チームメンバーを批判する"
      ],
      correct: 1,
      explanation: "スキルアセスメントは、各チームメンバーの強みと弱点を理解し、個人および組織のスキル開発ニーズを特定するために実施されます。"
    },
    {
      id: 44,
      category: "チームのマネジメント",
      chapter: "3.1 テストチーム",
      question: "テストチームのモチベーションを向上させる要因として正しいのは？",
      options: [
        "過度な時間外労働",
        "不明確な期待",
        "明確な目標設定と定期的なフィードバック",
        "チームとのコミュニケーション不足"
      ],
      correct: 2,
      explanation: "モチベーション向上の要因には、明確な目標、定期的なフィードバック、認識、キャリア発展の機会などが含まれます。"
    },
    {
      id: 45,
      category: "チームのマネジメント",
      chapter: "3.1 テストチーム",
      question: "テストチームのモチベーションを低下させる要因として正しいのは？",
      options: [
        "明確な目標設定",
        "定期的なフィードバック",
        "認識と報酬",
        "過度な時間外労働と不明確な期待"
      ],
      correct: 3,
      explanation: "モチベーション低下の要因には、過度な業務負荷、不明確な期待、適切な認識の欠如、キャリア発展の機会の不足などが含まれます。"
    },
    {
      id: 46,
      category: "チームのマネジメント",
      chapter: "3.1 テストチーム",
      question: "テストチームの効果的なマネジメントに必要なマネジメントスキルは次のどれか？",
      options: [
        "技術スキルのみ",
        "リーダーシップ、コミュニケーション、問題解決、紛争管理",
        "プログラミングスキルのみ",
        "テストスキルのみ"
      ],
      correct: 1,
      explanation: "効果的なテストマネージャーには、リーダーシップスキル、コミュニケーション能力、問題解決スキル、紛争管理スキルなどが必要です。"
    },
    {
      id: 47,
      category: "チームのマネジメント",
      chapter: "3.2 ステークホルダーとの関係",
      question: "品質コストの概念において、予防コストとは何か？",
      options: [
        "欠陥の修正コスト",
        "本番環境での障害コスト",
        "テストプロセス改善やトレーニングのコスト",
        "チーム構成のコスト"
      ],
      correct: 2,
      explanation: "予防コストは、欠陥を予防するための活動（テスト改善、トレーニング、ベストプラクティス導入など）にかかるコストです。"
    },
    {
      id: 48,
      category: "チームのマネジメント",
      chapter: "3.2 ステークホルダーとの関係",
      question: "品質コストの概念において、失敗コストとは何か？",
      options: [
        "テスト実施のコスト",
        "欠陥を検出・修正するコスト、欠陥が本番環境で発生した場合のコスト",
        "テスト計画書作成のコスト",
        "プロジェクト管理のコスト"
      ],
      correct: 1,
      explanation: "失敗コストは、テスト中に検出された欠陥の修正コスト、および本番環境で発生した欠陥によるビジネス損失を含みます。"
    },
    {
      id: 49,
      category: "チームのマネジメント",
      chapter: "3.2 ステークホルダーとの関係",
      question: "テストの費用対効果を示すためにビジネスケースで重視されるべき要素は？",
      options: [
        "テストに費やした時間のみ",
        "投資（コスト）と期待される利益（検出されるリスク軽減）",
        "テスト担当者の数のみ",
        "テスト環境の色"
      ],
      correct: 1,
      explanation: "ビジネスケースは、テストへの投資（コスト）と期待される利益（品質向上、リスク軽減、ビジネス価値）のバランスを示す必要があります。"
    },
    {
      id: 50,
      category: "チームのマネジメント",
      chapter: "3.2 ステークホルダーとの関係",
      question: "ステークホルダーとのコミュニケーション計画に含めるべき要素は？",
      options: [
        "通信方法のみ",
        "対象者、メッセージ、通信方法、頻度、責任者",
        "テスト担当者の名前のみ",
        "コミュニケーションを行わない"
      ],
      correct: 1,
      explanation: "効果的なコミュニケーション計画には、誰に、何を、どのように、どの頻度で伝えるか、誰が責任を持つかが含まれるべきです。"
    }
  ];

  // クイズ開始時に問題と選択肢をシャッフル
  useEffect(() => {
    if (quizStarted && shuffledQuestions.length === 0) {
      // 問題をシャッフル
      const shuffled = shuffleArray(baseQuestions);
      setShuffledQuestions(shuffled);

      // 各問題の選択肢をシャッフル
      const optionsMap = {};
      shuffled.forEach((q, qIdx) => {
        const optionsWithIndices = q.options.map((opt, optIdx) => ({
          text: opt,
          originalIndex: optIdx
        }));
        const shuffledOpts = shuffleArray(optionsWithIndices);
        optionsMap[qIdx] = shuffledOpts;
      });
      setOptionsMap(optionsMap);
    }
  }, [quizStarted, shuffledQuestions.length]);

  const questions = shuffledQuestions;
  const question = questions.length > 0 ? questions[currentQuestion] : null;

  // 正解のインデックスを取得（シャッフル後の正解肢の位置）
  const getCorrectAnswerIndex = () => {
    if (!question || !optionsMap[currentQuestion]) return -1;
    const originalCorrect = question.correct;
    const shuffledOpts = optionsMap[currentQuestion];
    return shuffledOpts.findIndex(opt => opt.originalIndex === originalCorrect);
  };

  const correctAnswerIndex = getCorrectAnswerIndex();

  const handleAnswerSelect = (answer) => {
    if (!selectedAnswers.hasOwnProperty(currentQuestion)) {
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQuestion]: answer
      });
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const handleSubmit = () => {
    if (currentQuestion === questions.length - 1) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
    setQuizStarted(false);
    setShuffledQuestions([]);
    setOptionsMap({});
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (optionsMap[idx]) {
        const shuffledOpts = optionsMap[idx];
        const correctIdx = shuffledOpts.findIndex(opt => opt.originalIndex === q.correct);
        if (selectedAnswers[idx] === correctIdx) {
          correct++;
        }
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  const score = calculateScore();

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">JSTQB Advanced Level</h1>
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">Test Management 模試</h2>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700">問題数</span>
              <span className="font-bold text-blue-700">{baseQuestions.length}問</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700">出題範囲</span>
              <span className="font-bold text-blue-700">全領域</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700">選択肢</span>
              <span className="font-bold text-blue-700">ランダム</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">対応</span>
              <span className="font-bold text-blue-700">iPhone対応</span>
            </div>
          </div>

          <button
            onClick={() => setQuizStarted(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            模試を開始
          </button>

          <div className="mt-6 text-xs text-gray-600 text-center">
            <p>このアプリはJSTQB Advanced Level Test Management</p>
            <p>Version 3.0.J02に基づいています。</p>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const categoryStats = {};
    questions.forEach((q, idx) => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { correct: 0, total: 0 };
      }
      categoryStats[q.category].total++;
      
      if (optionsMap[idx]) {
        const shuffledOpts = optionsMap[idx];
        const correctIdx = shuffledOpts.findIndex(opt => opt.originalIndex === q.correct);
        if (selectedAnswers[idx] === correctIdx) {
          categoryStats[q.category].correct++;
        }
      }
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4">
        <div className="max-w-md mx-auto pt-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 mb-4">
            <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">答案完了</h1>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-blue-700 mb-2">{score.percentage}%</div>
                <div className="text-gray-700 font-semibold">{score.correct}/{score.total}問正解</div>
              </div>
              
              {score.percentage >= 80 && <p className="text-green-600 font-bold text-center">合格！</p>}
              {score.percentage >= 60 && score.percentage < 80 && <p className="text-yellow-600 font-bold text-center">あと少しです！</p>}
              {score.percentage < 60 && <p className="text-red-600 font-bold text-center">復習をおすすめします</p>}
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="font-bold text-gray-800 text-sm">分野別成績</h3>
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="font-bold text-blue-600">{stats.correct}/{stats.total}</span>
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

            <button
              onClick={handleReset}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={18} />
              もう一度実施
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question || optionsMap[currentQuestion] === undefined) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4 flex items-center justify-center">
      <div className="text-white text-center">読込中...</div>
    </div>;
  }

  const displayOptions = optionsMap[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="max-w-md mx-auto pt-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">
              第{currentQuestion + 1}問 / {questions.length}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {question.category}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h3 className="text-xs text-gray-600 mb-2">{question.chapter}</h3>
          <h2 className="text-lg font-bold text-gray-800 mb-6">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {displayOptions.map((optionData, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === idx
                    ? showExplanation
                      ? idx === correctAnswerIndex
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-600 bg-blue-50'
                    : showExplanation && idx === correctAnswerIndex
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start">
                  <div className={`min-w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-sm font-bold ${
                    selectedAnswers[currentQuestion] === idx
                      ? showExplanation
                        ? idx === correctAnswerIndex
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-red-500 border-red-500 text-white'
                        : 'bg-blue-600 border-blue-600 text-white'
                      : showExplanation && idx === correctAnswerIndex
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-sm text-gray-800">{optionData.text}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`mt-6 p-4 rounded-lg ${selectedAnswers[currentQuestion] === correctAnswerIndex ? 'bg-green-50 border-l-4 border-green-500' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
              <p className={`text-sm font-semibold ${selectedAnswers[currentQuestion] === correctAnswerIndex ? 'text-green-800' : 'text-blue-800'} mb-2`}>
                {selectedAnswers[currentQuestion] === correctAnswerIndex ? '✓ 正解' : 'ℹ 解説'}
              </p>
              <p className="text-sm text-gray-700 mb-3">{question.explanation}</p>
              <p className="text-xs text-gray-600">
                正解: <span className="font-bold">{String.fromCharCode(65 + correctAnswerIndex)}</span>. {displayOptions[correctAnswerIndex].text}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-4">
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
            disabled={!showExplanation || currentQuestion === questions.length - 1}
            className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 font-bold py-3 px-4 rounded-lg border-2 border-white transition-colors flex items-center justify-center gap-2"
          >
            <span className="hidden sm:inline">次へ</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Final Submit */}
        {showExplanation && currentQuestion === questions.length - 1 && (
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
```

---

#### **ファイル7: `.gitignore`**
```
# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
