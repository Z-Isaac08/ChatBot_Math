// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Clé gratuite sur https://console.groq.com
});

app.use(cors());
app.use(express.json());

// ============================================
// SYSTEM PROMPTS PAR NIVEAU (7 niveaux)
// ============================================
const systemPrompts = {
  "6e": `Tu es un professeur de mathématiques bienveillant pour des élèves de 6ᵉ (11-12 ans).

RÈGLES STRICTES :
- Utilise des phrases COURTES et SIMPLES
- Donne des exemples CONCRETS (pommes, distances, objets du quotidien)
- ÉVITE le jargon technique
- Utilise LaTeX pour TOUTES les formules : $formule$ (inline) ou $$formule$$ (bloc centré)

EXEMPLE de réponse :
Question : "C'est quoi une fraction ?"
Réponse : "Une fraction, c'est quand tu partages quelque chose en parts égales ! 🍕

Si tu as une pizza coupée en 4 parts et que tu en manges 1, tu as mangé $\\frac{1}{4}$ de la pizza.

Le chiffre du bas (4) = nombre total de parts
Le chiffre du haut (1) = nombre de parts que tu prends"`,

  "5e": `Tu es un professeur de mathématiques pour des élèves de 5ᵉ (12-13 ans).

RÈGLES :
- Explications claires avec exemples progressifs
- Introduis les nombres relatifs, priorités opératoires, aires, angles
- Utilise LaTeX systématiquement : $x$ pour variables, $$\\text{formule}$$ pour équations
- Vocabulaire accessible mais plus précis qu'en 6ᵉ

EXEMPLE :
Question : "Comment calculer l'aire d'un triangle ?"
Réponse : "L'aire d'un triangle se calcule avec cette formule :

$$\\text{Aire} = \\frac{\\text{base} \\times \\text{hauteur}}{2}$$

Exemple : Si la base mesure $6 \\text{ cm}$ et la hauteur $4 \\text{ cm}$ :

$$\\text{Aire} = \\frac{6 \\times 4}{2} = \\frac{24}{2} = 12 \\text{ cm}^2$$"`,

  "4e": `Tu es un professeur de mathématiques pour des élèves de 4ᵉ (13-14 ans).

PROGRAMME : Théorème de Pythagore, calcul littéral, équations simples, proportionnalité, statistiques

RÈGLES :
- Explications structurées avec méthodologie
- Démontre les propriétés importantes
- LaTeX obligatoire pour toutes les expressions mathématiques
- Encourage le raisonnement

EXEMPLE :
Question : "Comment utiliser Pythagore ?"
Réponse : "Le théorème de Pythagore permet de calculer les côtés d'un triangle rectangle.

**Formule :** Dans un triangle rectangle, si $c$ est l'hypoténuse (côté le plus long) :

$$c^2 = a^2 + b^2$$

**Exemple :** Triangle avec $a = 3$ et $b = 4$

$$c^2 = 3^2 + 4^2 = 9 + 16 = 25$$
$$c = \\sqrt{25} = 5$$"`,

  "3e": `Tu es un professeur de mathématiques pour des élèves de 3ᵉ (14-15 ans).

PROGRAMME : Fonctions linéaires/affines, équations produit-nul, trigonométrie, probabilités, Thalès

RÈGLES :
- Méthodologie PAS-À-PAS rigoureuse
- Utilise les notations formelles : $f(x)$, $\\Delta$, etc.
- LaTeX pour TOUTES les équations et calculs
- Montre TOUTES les étapes de résolution

EXEMPLE :
Question : "Résous 2x + 5 = 13"
Réponse : "Pour résoudre cette équation, on isole $x$ :

**Étape 1 :** On soustrait 5 des deux côtés
$$2x + 5 - 5 = 13 - 5$$
$$2x = 8$$

**Étape 2 :** On divise par 2
$$\\frac{2x}{2} = \\frac{8}{2}$$
$$x = 4$$

**Vérification :** $2 \\times 4 + 5 = 8 + 5 = 13$ ✓"`,

  "2nde": `Tu es un professeur de mathématiques pour des élèves de Seconde (15-16 ans).

PROGRAMME : Fonctions (domaine, variations), vecteurs, statistiques, probabilités, géométrie repérée

RÈGLES :
- Rigueur mathématique accrue
- Notations formelles : $D_f$, $\\vec{u}$, tableaux de variations
- Justifications théoriques
- LaTeX pour toutes les expressions

EXEMPLE :
Question : "Étude de f(x) = x² - 4"
Réponse : "**Fonction :** $f(x) = x^2 - 4$

**Domaine :** $D_f = \\mathbb{R}$ (définie pour tout $x$ réel)

**Racines :** On résout $f(x) = 0$ :
$$x^2 - 4 = 0$$
$$(x-2)(x+2) = 0$$
$$x = -2 \\text{ ou } x = 2$$

**Variations :** Fonction polynôme du second degré avec $a = 1 > 0$
- Décroissante sur $]-\\infty; 0]$
- Croissante sur $[0; +\\infty[$"`,

  "1ere": `Tu es un professeur de mathématiques pour des élèves de Première (16-17 ans).

PROGRAMME : Dérivation, suites numériques, probabilités conditionnelles, produit scalaire, second degré approfondi

RÈGLES :
- Démonstrations formelles avec théorèmes
- Notations rigoureuses : $f'(x)$, $u_n$, $P(A|B)$
- LaTeX systématique avec mise en page claire
- Explicite les propriétés utilisées

EXEMPLE :
Question : "Dérivée de f(x) = 3x² - 5x + 2"
Réponse : "On utilise les formules de dérivation :

**Rappel :** $(x^n)' = nx^{n-1}$ et $(ax + b)' = a$

$$f(x) = 3x^2 - 5x + 2$$

**Dérivation terme par terme :**
$$f'(x) = 3 \\times 2x^{2-1} - 5 \\times 1 + 0$$
$$f'(x) = 6x - 5$$

**Signe de la dérivée :**
$f'(x) = 0 \\Leftrightarrow x = \\frac{5}{6}$

$f'(x) < 0$ sur $]-\\infty; \\frac{5}{6}[$ → $f$ décroissante
$f'(x) > 0$ sur $]\\frac{5}{6}; +\\infty[$ → $f$ croissante"`,

  tle: `Tu es un professeur de mathématiques pour des élèves de Terminale C (17-18 ans, niveau scientifique avancé).

PROGRAMME : Limites, continuité, intégration, nombres complexes, suites récurrentes, lois de probabilités continues

RÈGLES :
- Rigueur maximale avec démonstrations complètes
- Notations mathématiques universitaires : $\\lim$, $\\int$, $\\mathbb{C}$, $\\forall$, $\\exists$
- LaTeX obligatoire avec mise en forme professionnelle
- Mentionne les théorèmes utilisés
- Traite les cas limites et domaines de validité

EXEMPLE :
Question : "Intégrale de ln(x)"
Réponse : "Calcul de $\\displaystyle \\int \\ln(x) \\, dx$ par **intégration par parties**.

**Rappel :** $\\displaystyle \\int u \\, v' = uv - \\int u' \\, v$

**Posons :**
$$u = \\ln(x) \\quad \\Rightarrow \\quad u' = \\frac{1}{x}$$
$$v' = 1 \\quad \\Rightarrow \\quad v = x$$

**Application :**
$$\\int \\ln(x) \\, dx = x\\ln(x) - \\int x \\cdot \\frac{1}{x} \\, dx$$
$$= x\\ln(x) - \\int 1 \\, dx$$
$$= x\\ln(x) - x + C$$

**Résultat final :** 
$$\\boxed{\\int \\ln(x) \\, dx = x\\ln(x) - x + C, \\quad x > 0}$$

où $C \\in \\mathbb{R}$ est la constante d'intégration."`,
};

// ============================================
// FILTRAGE MATHÉMATIQUE STRICT
// ============================================
// const mathKeywords = [
//   // Opérations de base
//   "calcul",
//   "calculer",
//   "résoudre",
//   "résous",
//   "trouve",
//   "combien",

//   // Concepts mathématiques
//   "équation",
//   "inéquation",
//   "fonction",
//   "dérivée",
//   "intégrale",
//   "limite",
//   "suite",
//   "série",
//   "somme",
//   "produit",
//   "facteur",
//   "diviseur",

//   // Géométrie
//   "triangle",
//   "carré",
//   "cercle",
//   "rectangle",
//   "angle",
//   "aire",
//   "volume",
//   "périmètre",
//   "pythagore",
//   "thalès",
//   "vecteur",
//   "coordonnées",

//   // Algèbre
//   "fraction",
//   "racine",
//   "puissance",
//   "exposant",
//   "logarithme",
//   "exponentielle",
//   "polynôme",
//   "factoriser",
//   "développer",
//   "simplifier",

//   // Probabilités & Stats
//   "probabilité",
//   "statistique",
//   "moyenne",
//   "médiane",
//   "écart-type",
//   "variance",
//   "loi",
//   "distribution",

//   // Mots clés généraux
//   "mathématique",
//   "maths",
//   "math",
//   "nombre",
//   "chiffre",
//   "géométrie",
//   "algèbre",
//   "analyse",
//   "arithmétique",
//   "trigonométrie",
// ];

function stripAccents(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const mathKeywordsRaw = [
  // Opérations / verbes
  "calcul",
  "calculer",
  "résoudre",
  "résous",
  "trouve",
  "combien",

  // Concepts
  "equation",
  "inequation",
  "fonction",
  "derivee",
  "derivée",
  "integrale",
  "intégrale",
  "limite",
  "suite",
  "serie",
  "somme",
  "produit",
  "facteur",
  "diviseur",

  // Géométrie
  "triangle",
  "carre",
  "cercle",
  "rectangle",
  "angle",
  "aire",
  "volume",
  "perimetre",
  "pythagore",
  "thales",
  "vecteur",
  "coordonnees",

  // Algèbre
  "fraction",
  "racine",
  "puissance",
  "exposant",
  "logarithme",
  "exponentielle",
  "polynome",
  "polynôme",
  "factoriser",
  "developper",
  "simplifier",

  // Probabilités & Stats
  "probabilite",
  "probabilité",
  "statistique",
  "moyenne",
  "mediane",
  "ecart-type",
  "variance",
  "loi",

  // Spécifiques / second degré
  "second degre",
  "second degré",
  "degre",
  "discriminant",
  "delta",
  "quadratique",
  "x^2",
  "ax^2",

  // Mots généraux
  "math",
  "maths",
  "mathematique",
  "mathematiques",
  "arithmetique",
  "trigonometrie",
];

// Pré-calcul : mots-clés sans accents, en minuscule
const mathKeywords = mathKeywordsRaw.map((k) => stripAccents(k.toLowerCase()));

function isMathQuestion(text) {
  if (!text || typeof text !== "string") return false;

  const lowerText = stripAccents(text.toLowerCase());

  // 1) Vérifie mots-clés (avec word boundaries pour éviter faux positifs)
  const hasKeyword = mathKeywords.some((kw) => {
    // si mot-clé contient espace, teste la phrase complète, sinon mot entier
    if (kw.includes(" ")) {
      return lowerText.includes(kw);
    } else {
      return new RegExp(`\\b${kw}\\b`).test(lowerText);
    }
  });

  // 2) Détection d'expressions mathématiques (ex : "3x + 5", "x^2", "ax^2 + bx + c")
  const hasMathExpression =
    /\d+\s*[+\-×*/^=]\s*\d+/.test(text) || // opérations avec chiffres
    /[a-z]\s*\^\s*2/.test(lowerText) || // x^2 ou x ^2
    /\b(ax\^2|x\^2|ax2|x2|delta|discriminant)\b/.test(lowerText) ||
    /[xyztuv]\s*[+\-*/=]/.test(lowerText) || // variable suivie d'un opérateur
    /\b(sin|cos|tan|log|ln)\b/.test(lowerText);

  // 3) Phrases clés (ex: "second degre", "equation du second degre", "resolution")
  const phraseKeys = [
    "second degre",
    "equation du second degre",
    "resolution du second degre",
    "resoudre un polynome",
  ];
  const hasPhrase = phraseKeys.some((p) => lowerText.includes(stripAccents(p)));

  return hasKeyword || hasMathExpression || hasPhrase;
}

// ============================================
// ROUTE PRINCIPALE /api/chat
// ============================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, level, history = [], stepByStep = false } = req.body;

    // Validation
    if (!message || !level) {
      return res.status(400).json({ error: "Message et niveau requis" });
    }

    // 🚫 FILTRAGE : Refuse si pas mathématiques
    if (!isMathQuestion(message)) {
      return res.json({
        response:
          "Désolé — je suis spécialisé uniquement en **mathématiques** (niveaux 6ᵉ → Terminale). Je ne peux pas répondre à ce sujet. 😅\n\nSi tu as une question de **mathématiques**, je peux t'aider avec plaisir ! 📐✨",
        filtered: true,
      });
    }

    // System prompt de base
    let systemPrompt = systemPrompts[level] || systemPrompts["3e"];

    // Mode "étape par étape" activé
    if (stepByStep) {
      systemPrompt += `\n\n🔹 MODE ÉTAPE PAR ÉTAPE ACTIVÉ :
- Décompose la résolution en étapes NUMÉROTÉES
- Explique CHAQUE étape en détail
- Utilise des titres pour chaque étape : **Étape 1 :**, **Étape 2 :**, etc.
- Conclus avec un résumé final`;
    }

    // Construction du contexte (historique limité aux 6 derniers messages)
    const recentHistory = history.slice(-6);
    const conversationContext = recentHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Appel API Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Modèle gratuit ultra-rapide
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationContext,
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
      stream: false,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "Désolé, je n'ai pas pu générer de réponse.";

    res.json({
      response,
      filtered: false,
      model: "llama-3.3-70b-versatile",
    });
  } catch (error) {
    console.error("Erreur API Groq:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message,
    });
  }
});

// ============================================
// ROUTE HEALTH CHECK
// ============================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Math Chatbot API",
    timestamp: new Date().toISOString(),
  });
});

console.log(isMathQuestion("Explique la résolution d'une équation du second dégré")); // true
console.log(isMathQuestion("Comment calculer l'aire d'un triangle ?")); // true
console.log(isMathQuestion("Qui est le président ?")); // false
console.log(isMathQuestion("Résous 3x + 5 = 11")); // true

// ============================================
// DÉMARRAGE SERVEUR
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend Math Chatbot démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api/chat`);
});

// ============================================
// FICHIER .env À CRÉER
// ============================================
// GROQ_API_KEY=gsk_votre_clé_ici
// PORT=3001

// ============================================
// INSTALLATION DÉPENDANCES
// ============================================
// npm init -y
// npm install express cors groq-sdk dotenv
// node server.js
