import os
import logging
from typing import Optional, Any

logger = logging.getLogger("nlp-service")
logger.setLevel(logging.INFO)

DEFAULT_MODEL = os.getenv("NLP_MODEL_NAME", "distilbert/distilbert-base-uncased-finetuned-sst-2-english")
MODEL_VERSION = os.getenv("NLP_MODEL_VERSION", "v1.0.0")

_pipeline_instance: Optional[Any] = None
_model_engine: str = "rule_based_fallback"

def load_nlp_model():
    global _pipeline_instance, _model_engine
    logger.info(f"Attempting to load model: {DEFAULT_MODEL}")
    try:
        from transformers import pipeline
        # Load HuggingFace pipeline once at startup
        _pipeline_instance = pipeline(
            "sentiment-analysis",
            model=DEFAULT_MODEL,
            truncation=True,
            max_length=512
        )
        _model_engine = "huggingface_transformers"
        logger.info(f"Successfully loaded Hugging Face model: {DEFAULT_MODEL}")
    except Exception as e:
        logger.warning(
            f"Could not load Hugging Face transformer pipeline ({e}). "
            "Engaging documented rule-based linguistic analyzer fallback for fast offline resilience."
        )
        _pipeline_instance = None
        _model_engine = "rule_based_fallback"

def get_pipeline() -> Optional[Any]:
    return _pipeline_instance

def get_model_name() -> str:
    return DEFAULT_MODEL if _model_engine == "huggingface_transformers" else f"{DEFAULT_MODEL} [Rule-Based Fallback Engine]"

def get_model_version() -> str:
    return MODEL_VERSION

def get_model_engine() -> str:
    return _model_engine
