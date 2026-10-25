import unittest
from services.nlp.app.schemas import AnalyzeRequest
from services.nlp.app.analyzer import (
    analyze_article_text,
    compute_readability,
    extract_linguistic_signals,
    compute_subjectivity,
    compute_quality_score,
)

class TestNLPAnalyzer(unittest.TestCase):
    def test_valid_input_analysis(self):
        req = AnalyzeRequest(
            articleId="test-art-1",
            title="NASA Discovers New Exoplanet in Habitable Zone",
            description="Astronomers using the James Webb Space Telescope have confirmed a rocky planet with potential atmospheric biosignatures.",
            content="The discovery marks a significant milestone in exoplanet research according to researchers at the astrophysics institute."
        )
        res = analyze_article_text(req, "test-model", "v1.0.0", hf_pipeline=None)

        self.assertEqual(res.articleId, "test-art-1")
        self.assertIn("title", res.analyzedFields)
        self.assertIn("description", res.analyzedFields)
        self.assertIn("content", res.analyzedFields)
        self.assertGreater(res.readability.score, 0)
        self.assertIn(res.sentiment.label, ["positive", "neutral", "negative"])
        self.assertIsNotNone(res.potentialBias.score)
        self.assertIsNotNone(res.subjectivity.score)
        self.assertGreater(res.qualityScore, 0.0)

    def test_empty_or_whitespace_handling(self):
        req = AnalyzeRequest(
            articleId="test-empty",
            title="   ",
            description=None,
            content=""
        )
        res = analyze_article_text(req, "test-model", "v1.0.0", hf_pipeline=None)
        self.assertEqual(res.articleId, "test-empty")
        self.assertEqual(res.readability.details.wordsCount, 0)

    def test_missing_optional_fields(self):
        req = AnalyzeRequest(
            articleId="test-title-only",
            title="Global Markets Rally After Central Bank Interest Rate Cut",
            description=None,
            content=None
        )
        res = analyze_article_text(req, "test-model", "v1.0.0", hf_pipeline=None)
        self.assertEqual(res.analyzedFields, ["title"])
        self.assertEqual(res.sentiment.label, "positive")

    def test_very_long_text_and_chunking(self):
        # 10,000 words repetition
        paragraph = "Global climate leaders gathered today in Geneva to discuss renewable energy policies and carbon mitigation strategies. "
        long_content = paragraph * 100
        req = AnalyzeRequest(
            articleId="test-long",
            title="Global Summit Convenes on Renewable Energy",
            description="Comprehensive coverage of the international conference.",
            content=long_content
        )
        res = analyze_article_text(req, "test-model", "v1.0.0", hf_pipeline=None)
        self.assertGreater(res.readability.details.wordsCount, 500)
        self.assertIsNotNone(res.qualityScore)

    def test_linguistic_signals_detection(self):
        text = "This unmitigated disaster is a bombshell scandal that destroys the administration's reputation."
        signals, score, level = extract_linguistic_signals(text)
        self.assertGreater(len(signals), 0)
        self.assertIn(level, ["low", "moderate", "elevated"])
        # Check signal types
        types = [s.type for s in signals]
        self.assertTrue("loaded_language" in types or "sensationalism" in types)
        # Check explanation presence
        self.assertTrue(all(len(s.explanation) > 10 for s in signals))

    def test_neutral_factual_text_low_signals(self):
        text = "The department released its monthly labor report on Friday showing an increase of 150,000 jobs in the manufacturing sector."
        signals, score, level = extract_linguistic_signals(text)
        self.assertEqual(len(signals), 0)
        self.assertEqual(level, "minimal")
        self.assertLessEqual(score, 0.1)

    def test_readability_formulas(self):
        simple_text = "The cat sat on the mat. The sun was hot and bright. The day was good."
        simple_res = compute_readability(simple_text)
        self.assertGreater(simple_res.score, 70.0)
        self.assertEqual(simple_res.label, "easy")

        complex_text = "Thermodynamic equilibrium necessitates an isotropic distribution of energetic microstates across quantum macroscopic boundaries."
        complex_res = compute_readability(complex_text)
        self.assertLess(complex_res.score, 50.0)
        self.assertIn(complex_res.label, ["complex", "technical"])

    def test_limitations_and_disclaimer_provenance(self):
        req = AnalyzeRequest(
            articleId="test-disclaimer",
            title="Tech Giant Announces Quarterly Earnings",
            description="Revenues exceeded analyst expectations by two percent."
        )
        res = analyze_article_text(req, "test-model", "v1.0.0", hf_pipeline=None)
        self.assertIn("DO NOT", res.potentialBias.limitations)
        self.assertIn("accuracy", res.potentialBias.limitations)

if __name__ == "__main__":
    unittest.main()
