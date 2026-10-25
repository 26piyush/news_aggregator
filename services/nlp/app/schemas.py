from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AnalyzeRequest(BaseModel):
    articleId: str = Field(..., description="Unique identifier of the article")
    title: str = Field(..., description="Article headline")
    description: Optional[str] = Field(None, description="Article summary or description")
    content: Optional[str] = Field(None, description="Article body text if legally available")

class BatchAnalyzeRequest(BaseModel):
    articles: List[AnalyzeRequest]

class ReadabilityDetails(BaseModel):
    fleschKincaidGrade: float
    fleschReadingEase: float
    automatedReadabilityIndex: float
    wordsCount: int
    sentencesCount: int
    syllablesCount: int
    syllablesPerWord: float

class ReadabilityResult(BaseModel):
    score: float = Field(..., description="Normalized 0-100 ease of reading score (higher = easier to read)")
    gradeLevel: str = Field(..., description="Estimated school reading level")
    label: str = Field(..., description="easy | moderate | complex | technical")
    method: str = Field(..., description="Formulas used e.g. Flesch-Kincaid & Flesch Reading Ease")
    details: ReadabilityDetails

class SentimentResult(BaseModel):
    label: str = Field(..., description="positive | neutral | negative")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    scores: Dict[str, float] = Field(..., description="Probabilities for each class")

class BiasSignal(BaseModel):
    type: str = Field(..., description="loaded_language | sensationalism | absolute_claim | subjective_framing")
    phrase: str = Field(..., description="Identified linguistic phrase or cue")
    context: str = Field(..., description="Textual context snippet where signal was found")
    explanation: str = Field(..., description="Transparent rationale why this linguistic signal was noted")

class PotentialBiasResult(BaseModel):
    score: Optional[float] = Field(None, description="0.0 to 1.0 experimental intensity score, or null if unassessed")
    level: str = Field(..., description="minimal | low | moderate | elevated | not_assessed")
    signals: List[BiasSignal] = Field(default_factory=list)
    limitations: str = Field(
        default="Linguistic signals reflect language style, subjective framing, and emotional word choice in the text. "
                "They DO NOT evaluate factual accuracy, truthfulness, or publisher reputation."
    )

class SubjectivityResult(BaseModel):
    score: float = Field(..., description="0.0 (completely objective) to 1.0 (highly subjective)")
    label: str = Field(..., description="factual_reporting | mostly_factual | mixed | subjective_opinion")
    explanation: str

class ModelInfo(BaseModel):
    name: str
    version: str
    engine: str = Field(..., description="huggingface_transformers | rule_based_fallback")

class AnalyzeResponse(BaseModel):
    articleId: str
    model: ModelInfo
    readability: ReadabilityResult
    sentiment: SentimentResult
    potentialBias: PotentialBiasResult
    subjectivity: SubjectivityResult
    qualityScore: float = Field(..., description="Transparent aggregate readability and completeness score (0-100)")
    analyzedFields: List[str]
    analyzedAt: str

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    model_engine: str
