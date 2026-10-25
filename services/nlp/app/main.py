import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    HealthResponse,
)
from .analyzer import analyze_article_text
from .model_loader import (
    load_nlp_model,
    get_pipeline,
    get_model_name,
    get_model_version,
    get_model_engine,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nlp-main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models once into memory
    logger.info("Initializing NLP Service...")
    load_nlp_model()
    yield
    # Shutdown
    logger.info("Shutting down NLP Service.")

app = FastAPI(
    title="AI News NLP Service",
    description="FastAPI service utilizing Hugging Face Transformers & linguistic algorithms for news analysis",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["Operations"])
def health():
    return HealthResponse(
        status="healthy",
        service="ai-news-nlp-service",
        version="1.0.0",
        model_loaded=(get_pipeline() is not None or get_model_engine() is not None),
        model_engine=get_model_engine()
    )

@app.get("/ready", tags=["Operations"])
def readiness():
    return {"status": "ready", "engine": get_model_engine()}

@app.post("/analyze", response_model=AnalyzeResponse, tags=["NLP Analysis"])
def analyze_article(req: AnalyzeRequest):
    if not req.title or not req.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Article title is required for analysis."
        )

    try:
        pipeline = get_pipeline()
        model_name = get_model_name()
        model_version = get_model_version()
        return analyze_article_text(req, model_name, model_version, hf_pipeline=pipeline)
    except Exception as e:
        logger.error(f"Error analyzing article {req.articleId}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NLP Analysis failed: {str(e)}"
        )

@app.post("/batch-analyze", response_model=List[AnalyzeResponse], tags=["NLP Analysis"])
def batch_analyze(req: BatchAnalyzeRequest):
    if not req.articles:
        return []

    pipeline = get_pipeline()
    model_name = get_model_name()
    model_version = get_model_version()

    results: List[AnalyzeResponse] = []
    for art in req.articles:
        if art.title and art.title.strip():
            res = analyze_article_text(art, model_name, model_version, hf_pipeline=pipeline)
            results.append(res)
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.nlp.app.main:app", host="0.0.0.0", port=8000, reload=False)
