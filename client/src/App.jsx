import { BookOpen, Check, Copy, Layers, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Configuration KaTeX (CDN déjà chargé via <head>)
const renderLatex = (text) => {
  if (typeof window.katex === "undefined") return text;

  try {
    // Blocs $$...$$ (centré)
    let rendered = text.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
      try {
        return `<div class="my-4 text-center overflow-x-auto">${window.katex.renderToString(
          formula,
          { displayMode: true, throwOnError: false }
        )}</div>`;
      } catch {
        return match;
      }
    });

    // Inline $...$
    rendered = rendered.replace(/\$(.*?)\$/g, (match, formula) => {
      try {
        return window.katex.renderToString(formula, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    });

    return rendered;
  } catch {
    return text;
  }
};

export default function MathChatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Bonjour ! 👋 Je suis ton assistant en **mathématiques**.\n\nJe peux t'aider de la 6ᵉ à la Terminale avec :\n- Calculs et résolutions d'équations\n- Géométrie, théorèmes\n- Fonctions, dérivées, intégrales\n- Probabilités, statistiques\n\nChoisis ton niveau et pose-moi une question ! 📐✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState("3e");
  const [stepByStep, setStepByStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const levels = [
    { value: "6e", label: "6ᵉ", color: "bg-pink-500" },
    { value: "5e", label: "5ᵉ", color: "bg-purple-500" },
    { value: "4e", label: "4ᵉ", color: "bg-indigo-500" },
    { value: "3e", label: "3ᵉ", color: "bg-blue-500" },
    { value: "2nde", label: "2ⁿᵈᵉ", color: "bg-cyan-500" },
    { value: "1ere", label: "1ʳᵉ", color: "bg-teal-500" },
    { value: "tle", label: "Tˡᵉ", color: "bg-green-500" },
  ];

  const exampleQuestions = [
    "Comment résoudre 2x + 5 = 13 ?",
    "C'est quoi le théorème de Pythagore ?",
    "Calcule l'aire d'un cercle de rayon 5",
    "Quelle est la dérivée de x² + 3x ?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          level,
          stepByStep,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          filtered: data.filtered,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "❌ Erreur de connexion au serveur. Vérifie que le backend est démarré sur le port 3001.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = (content, index) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, ""));
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Conversation effacée ! 🗑️\n\nPose-moi une nouvelle question de mathématiques. 📐",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">

      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-7 h-7" />
                MathBot IA
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Assistant mathématiques • 6ᵉ → Terminale
              </p>
            </div>
            <button
              onClick={clearChat}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Effacer la conversation"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Sélecteur de niveau */}
          <div className="mt-4 flex flex-wrap gap-2">
            {levels.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  level === l.value
                    ? `${l.color} text-white scale-110 shadow-lg`
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Mode étape par étape */}
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={stepByStep}
              onChange={(e) => setStepByStep(e.target.checked)}
              className="w-4 h-4 accent-blue-300"
            />
            <Layers className="w-4 h-4" />
            <span className="text-sm">Mode étape par étape</span>
          </label>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : msg.error
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                }`}
              >
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: renderLatex(
                      msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>")
                    ),
                  }}
                />

                {msg.role === "assistant" && !msg.error && (
                  <button
                    onClick={() => copyMessage(msg.content, idx)}
                    className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {copied === idx ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copier
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Exemples de questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Exemples de questions :
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Pose ta question en mathématiques..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-xl transition flex items-center gap-2 font-semibold"
            >
              <Send className="w-5 h-5" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
