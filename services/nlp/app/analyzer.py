import re
import math
from datetime import datetime, timezone
from typing import List, Dict, Tuple, Optional, Any

from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ModelInfo,
    ReadabilityResult,
    ReadabilityDetails,
    SentimentResult,
    PotentialBiasResult,
    BiasSignal,
    SubjectivityResult,
)

# Linguistic cues dictionary for experimental signal detection
LINGUISTIC_PATTERNS = [
    {
        "type": "loaded_language",
        "regex": r"\b(unmitigated disaster|catastrophic|disastrous|shocking|scandalous|abhorrent|miraculous|spectacular|grotesque|tyrannical|brainwashed|hysteria|appalling|atrocious|monstrous)\b",
        "explanation": "Strongly evaluative adjective/phrase expressing intense emotional stance rather than neutral factual description."
    },
    {
        "type": "absolute_claim",
        "regex": r"\b(undeniably|indisputably|without a shadow of doubt|unquestionably|unarguable|everyone knows that|categorically impossible)\b",
        "explanation": "Categorical assertion that dismisses alternative perspectives or uncertainty."
    },
    {
        "type": "sensationalism",
        "regex": r"\b(bombshell|jaw-dropping|you won't believe|obliterates|destroys|slams|rips into|eviscerates|mind-blowing)\b",
        "explanation": "Sensationalized verb or headline framing commonly used to amplify conflict or emotional engagement."
    },
    {
        "type": "subjective_framing",
        "regex": r"\b(obviously|clearly|naturally|needless to say|as everyone knows|it is plain to see)\b",
        "explanation": "Presupposition marker that frames subjective viewpoints as self-evident facts."
    }
]

# Common positive and negative words for fallback sentiment calculation
POSITIVE_WORDS = {
    "growth", "success", "breakthrough", "achieved", "improvement", "positive", "beneficial",
    "record", "milestone", "innovation", "strengthen", "gain", "optimistic", "recovery", "progress",
    "win", "triumph", "promising", "effective", "safe", "sustainable", "upbeat", "rally"
}

# Distinguish mild/standard news negatives from extreme loaded words
NEGATIVE_WORDS = {
    "decline", "fall", "drop", "loss", "warning", "risk", "concern", "crisis", "struggle",
    "delay", "deficit", "inflation", "slump", "challenge", "threat", "failure", "tension",
    "dispute", "investigation", "recession", "downturn", "criticism", "damage"
}

def count_syllables_in_word(word: str) -> int:
    word = word.lower().strip()
    if not word:
        return 0
    # Remove non-alpha
    word = re.sub(r"[^a-z]", "", word)
    if not word:
        return 0
    if len(word) <= 3:
        return 1

    # Count vowel groups
    word = re.sub(r"(?:[^laeiouy]|ed|es|e)$", "", word)
    word = re.sub(r"^y", "", word)
    syllables = len(re.findall(r"[aeiouy]{1,2}", word))
    return max(1, syllables)

def compute_readability(text: str) -> ReadabilityResult:
    # Clean text
    clean_text = text.strip()
    if not clean_text:
        return ReadabilityResult(
            score=50.0,
            gradeLevel="Not Assessed",
            label="moderate",
            method="Flesch-Kincaid & Flesch Reading Ease",
            details=ReadabilityDetails(
                fleschKincaidGrade=0.0,
                fleschReadingEase=50.0,
                automatedReadabilityIndex=0.0,
                wordsCount=0,
                sentencesCount=0,
                syllablesCount=0,
                syllablesPerWord=0.0
            )
        )

    # Sentences split on punctuation (. ! ?)
    raw_sentences = [s.strip() for s in re.split(r"[.!?]+", clean_text) if s.strip()]
    sentence_count = max(1, len(raw_sentences))

    # Words split on whitespace
    raw_words = re.findall(r"\b[A-Za-z0-9'-]+\b", clean_text)
    word_count = max(1, len(raw_words))

    # Syllables
    syllable_count = sum(count_syllables_in_word(w) for w in raw_words)
    syllables_per_word = syllable_count / word_count
    words_per_sentence = word_count / sentence_count

    # Flesch Reading Ease: 206.835 - (1.015 * ASL) - (84.6 * ASW)
    # Higher score = easier to read (0 to 100)
    raw_fre = 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)
    fre = round(max(0.0, min(100.0, raw_fre)), 1)

    # Flesch-Kincaid Grade Level: (0.39 * ASL) + (11.8 * ASW) - 15.59
    raw_fkg = (0.39 * words_per_sentence) + (11.8 * syllables_per_word) - 15.59
    fkg = round(max(1.0, min(18.0, raw_fkg)), 1)

    # Automated Readability Index (ARI)
    char_count = sum(len(w) for w in raw_words)
    raw_ari = 4.71 * (char_count / word_count) + 0.5 * words_per_sentence - 21.43
    ari = round(max(1.0, min(18.0, raw_ari)), 1)

    # Label assignment based on FRE
    if fre >= 80:
        label = "easy"
        grade_desc = "5th-6th Grade (Elementary)"
    elif fre >= 60:
        label = "moderate"
        grade_desc = "7th-9th Grade (Plain English)"
    elif fre >= 40:
        label = "complex"
        grade_desc = "10th-12th Grade (High School / College Entry)"
    else:
        label = "technical"
        grade_desc = "College Graduate / Specialized"

    return ReadabilityResult(
        score=fre,
        gradeLevel=grade_desc,
        label=label,
        method="Flesch Reading Ease (0-100 ease scale) & Flesch-Kincaid Grade Formula",
        details=ReadabilityDetails(
            fleschKincaidGrade=fkg,
            fleschReadingEase=fre,
            automatedReadabilityIndex=ari,
            wordsCount=word_count,
            sentencesCount=sentence_count,
            syllablesCount=syllable_count,
            syllablesPerWord=round(syllables_per_word, 2)
        )
    )

def extract_linguistic_signals(text: str) -> Tuple[List[BiasSignal], float, str]:
    signals: List[BiasSignal] = []
    text_lower = text.lower()

    for item in LINGUISTIC_PATTERNS:
        pattern = item["regex"]
        for match in re.finditer(pattern, text_lower):
            matched_phrase = match.group(0)
            start_pos = max(0, match.start() - 40)
            end_pos = min(len(text), match.end() + 40)
            context = ("..." if start_pos > 0 else "") + text[start_pos:end_pos].strip() + ("..." if end_pos < len(text) else "")

            # Avoid duplicates of identical phrase
            if not any(s.phrase.lower() == matched_phrase.lower() for s in signals):
                signals.append(BiasSignal(
                    type=item["type"],
                    phrase=matched_phrase,
                    context=context,
                    explanation=item["explanation"]
                ))
            if len(signals) >= 6:
                break

    # Intensity score
    count = len(signals)
    if count == 0:
        score = 0.05
        level = "minimal"
    elif count <= 2:
        score = round(0.15 + 0.10 * count, 2)
        level = "low"
    elif count <= 4:
        score = round(0.40 + 0.08 * count, 2)
        level = "moderate"
    else:
        score = min(0.95, round(0.65 + 0.05 * count, 2))
        level = "elevated"

    return signals, score, level

def compute_subjectivity(text: str, bias_score: float) -> SubjectivityResult:
    # Subjectivity: proportion of subjective/opinion indicators vs objective reporting verbs
    words = re.findall(r"\b[A-Za-z]+\b", text.lower())
    if not words:
        return SubjectivityResult(
            score=0.1,
            label="factual_reporting",
            explanation="Insufficient text to evaluate subjectivity."
        )

    opinion_words = {
        "think", "believe", "feel", "opinion", "arguably", "perhaps", "maybe",
        "outrageous", "magnificent", "terrible", "incredible", "view", "claims"
    }
    factual_verbs = {
        "reported", "stated", "confirmed", "announced", "published", "recorded",
        "documented", "analyzed", "released", "showed", "concluded"
    }

    opinion_count = sum(1 for w in words if w in opinion_words)
    factual_count = sum(1 for w in words if w in factual_verbs)

    # Base subjectivity from linguistic features
    base_subj = (opinion_count * 0.1) / max(1, (factual_count * 0.15 + 1))
    combined_score = round(max(0.05, min(0.95, 0.5 * base_subj + 0.5 * (bias_score or 0.1))), 2)

    if combined_score <= 0.25:
        label = "factual_reporting"
        explanation = "Predominantly objective reporting language, citations, and neutral factual descriptions."
    elif combined_score <= 0.50:
        label = "mostly_factual"
        explanation = "Primarily informative reporting with limited descriptive or evaluative modifiers."
    elif combined_score <= 0.70:
        label = "mixed"
        explanation = "Contains a mixture of factual events and subjective commentary or analysis."
    else:
        label = "subjective_opinion"
        explanation = "High concentration of opinion-oriented phrasing, emotional descriptors, or commentary framing."

    return SubjectivityResult(
        score=combined_score,
        label=label,
        explanation=explanation
    )

def compute_quality_score(
    readability: ReadabilityResult,
    subjectivity: SubjectivityResult,
    has_description: bool,
    has_content: bool,
    word_count: int
) -> float:
    # Transparent score out of 100 based on explicit criteria:
    # 1. Readability accessibility (0-30 pts): standard readable grade (50-80) gets full points
    r_score = readability.score
    if 50 <= r_score <= 80:
        readability_pts = 30.0
    elif r_score > 80:
        readability_pts = 28.0
    else:
        readability_pts = max(10.0, 30.0 - (50.0 - r_score) * 0.5)

    # 2. Content completeness & depth (0-35 pts)
    completeness_pts = 10.0  # title exists
    if has_description:
        completeness_pts += 10.0
    if has_content or word_count > 100:
        completeness_pts += 15.0
    elif word_count > 50:
        completeness_pts += 8.0

    # 3. Linguistic neutrality (0-25 pts): lower subjectivity / fewer sensationalist cues = higher score
    neutrality_pts = max(5.0, 25.0 * (1.0 - subjectivity.score * 0.7))

    # 4. Baseline structure (0-10 pts)
    structure_pts = 10.0

    total = readability_pts + completeness_pts + neutrality_pts + structure_pts
    return round(min(100.0, max(15.0, total)), 1)

def analyze_article_text(
    req: AnalyzeRequest,
    model_name: str,
    model_version: str,
    hf_pipeline: Optional[Any] = None
) -> AnalyzeResponse:
    analyzed_fields = ["title"]
    text_parts = [req.title.strip()]

    if req.description and req.description.strip():
        analyzed_fields.append("description")
        text_parts.append(req.description.strip())

    if req.content and req.content.strip():
        analyzed_fields.append("content")
        text_parts.append(req.content.strip())

    combined_text = " \n".join(text_parts)

    # 1. Readability Analysis
    readability = compute_readability(combined_text)

    # 2. Potential Bias & Linguistic Signals
    signals, bias_score, bias_level = extract_linguistic_signals(combined_text)
    potential_bias = PotentialBiasResult(
        score=bias_score,
        level=bias_level,
        signals=signals,
        limitations="Linguistic signals reflect language style, subjective framing, and emotional word choice in the text. "
                    "They DO NOT evaluate factual accuracy, truthfulness, or publisher reputation."
    )

    # 3. Subjectivity Assessment
    subjectivity = compute_subjectivity(combined_text, bias_score)

    # 4. Sentiment Classification (via Hugging Face pipeline if loaded, else rule-based fallback)
    if hf_pipeline is not None:
        try:
            # Truncate text to 512 characters or 128 words for quick sentiment inference
            truncated = combined_text[:512]
            hf_res = hf_pipeline(truncated)
            # HF sentiment pipeline returns list like [{'label': 'POSITIVE'/'NEGATIVE', 'score': 0.98}]
            top_res = hf_res[0] if isinstance(hf_res, list) else hf_res
            hf_label = top_res.get("label", "NEUTRAL").upper()
            hf_score = float(top_res.get("score", 0.5))

            if "POS" in hf_label:
                sentiment_label = "positive"
                scores = {"positive": round(hf_score, 3), "neutral": round(1.0 - hf_score, 3), "negative": 0.0}
            elif "NEG" in hf_label:
                sentiment_label = "negative"
                scores = {"negative": round(hf_score, 3), "neutral": round(1.0 - hf_score, 3), "positive": 0.0}
            else:
                sentiment_label = "neutral"
                scores = {"neutral": round(hf_score, 3), "positive": round((1.0 - hf_score)/2, 3), "negative": round((1.0 - hf_score)/2, 3)}

            sentiment = SentimentResult(
                label=sentiment_label,
                confidence=round(hf_score, 2),
                scores=scores
            )
            engine = "huggingface_transformers"
        except Exception as e:
            sentiment = _fallback_sentiment(combined_text)
            engine = "rule_based_fallback"
    else:
        sentiment = _fallback_sentiment(combined_text)
        engine = "rule_based_fallback"

    # 5. Quality Score
    quality_score = compute_quality_score(
        readability,
        subjectivity,
        has_description=bool(req.description),
        has_content=bool(req.content),
        word_count=readability.details.wordsCount
    )

    return AnalyzeResponse(
        articleId=req.articleId,
        model=ModelInfo(
            name=model_name,
            version=model_version,
            engine=engine
        ),
        readability=readability,
        sentiment=sentiment,
        potentialBias=potential_bias,
        subjectivity=subjectivity,
        qualityScore=quality_score,
        analyzedFields=analyzed_fields,
        analyzedAt=datetime.now(timezone.utc).isoformat()
    )

def _fallback_sentiment(text: str) -> SentimentResult:
    words = re.findall(r"\b[A-Za-z]+\b", text.lower())
    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)
    total_matches = pos_count + neg_count

    if total_matches == 0:
        return SentimentResult(
            label="neutral",
            confidence=0.85,
            scores={"positive": 0.10, "neutral": 0.85, "negative": 0.05}
        )

    pos_prob = pos_count / (total_matches + 2)
    neg_prob = neg_count / (total_matches + 2)
    neu_prob = 1.0 - (pos_prob + neg_prob)

    if pos_count > neg_count:
        return SentimentResult(
            label="positive",
            confidence=round(min(0.95, 0.60 + pos_prob), 2),
            scores={"positive": round(pos_prob, 2), "neutral": round(neu_prob, 2), "negative": round(neg_prob, 2)}
        )
    elif neg_count > pos_count:
        return SentimentResult(
            label="negative",
            confidence=round(min(0.95, 0.60 + neg_prob), 2),
            scores={"negative": round(neg_prob, 2), "neutral": round(neu_prob, 2), "positive": round(pos_prob, 2)}
        )
    else:
        return SentimentResult(
            label="neutral",
            confidence=round(max(0.65, neu_prob), 2),
            scores={"neutral": round(neu_prob, 2), "positive": round(pos_prob, 2), "negative": round(neg_prob, 2)}
        )
