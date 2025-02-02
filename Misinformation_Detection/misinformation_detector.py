import re
from collections import Counter
from urllib.parse import urlparse
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
import numpy as np
from datetime import datetime
import logging
import json
import requests
from typing import Dict, List, Union, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SocialMediaMisinformationDetector:
    def __init__(self):
        """Initialize the detector with necessary components and data."""
        try:
            # Download required NLTK data
            nltk.download('punkt', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('stopwords', quiet=True)
            
            # Initialize NLTK components
            self.sia = SentimentIntensityAnalyzer()
            self.stop_words = set(stopwords.words('english'))
            
            logger.info("Successfully initialized NLTK components")
        except Exception as e:
            logger.error(f"Error initializing NLTK components: {str(e)}")
            raise

        # Load domain lists and keywords
        self._load_domain_lists()
        self._load_keywords()

    def _load_domain_lists(self):
        """Load trusted and unreliable domain lists."""
        self.trusted_domains = {
            'reuters.com', 'apnews.com', 'nature.com', 'science.org', 'who.int',
            'bbc.com', 'bbc.co.uk', 'npr.org', 'scientificamerican.com',
            'smithsonianmag.com', 'nationalgeographic.com', 'nejm.org',
            'sciencedirect.com', 'thelancet.com', 'bmj.com', 'cdc.gov',
            'nih.gov', 'sciencemag.org', 'pnas.org', 'cell.com'
        }
        
        self.unreliable_domains = {
            'conspiracy-news.com', 'fake-science.org', 'clickbait-news.net',
            'viral-stories.com', 'shocking-news.org', 'truth-exposed.net'
        }

    def _load_keywords(self):
        """Load various keyword sets for analysis."""
        self.clickbait_phrases = {
            'you won\'t believe', 'shocking truth', 'doctors hate',
            'miracle cure', '100% guaranteed', 'secret they don\'t want you to know',
            'this one trick', 'what happens next will', 'mind-blowing',
            'life-changing', 'unbelievable result', 'shocking discovery',
            'they don\'t want you to see', 'banned information', 'censored content',
            'the truth about', 'what they aren\'t telling you'
        }
        
        self.conspiracy_keywords = {
            'conspiracy', 'illuminati', 'deep state', 'cover up',
            'they\'re hiding', 'government doesn\'t want you to know',
            'new world order', 'controlled by', 'mind control', 'chemtrails',
            'microchipped', 'surveillance state', 'shadow government',
            'secret society', 'population control', 'manufactured crisis'
        }
        
        self.misused_scientific_terms = {
            'quantum', 'toxins', 'chemical-free', 'natural remedy',
            'clinically proven', 'scientifically proven', 'studies show',
            'research proves', 'doctors confirm', 'medical miracle',
            'breakthrough discovery', 'revolutionary treatment'
        }

    def analyze_text_complexity(self, text: str) -> Dict[str, float]:
        """
        Analyze text complexity using various metrics.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            Dict[str, float]: Dictionary containing complexity metrics
        """
        try:
            sentences = sent_tokenize(text)
            words = word_tokenize(text.lower())
            words = [word for word in words if word.isalnum()]
            
            if not words:
                return {
                    'avg_sentence_length': 0.0,
                    'lexical_diversity': 0.0,
                    'unique_words': 0
                }
            
            # Calculate metrics
            avg_sentence_length = len(words) / max(len(sentences), 1)
            unique_words = len(set(words))
            lexical_diversity = unique_words / len(words)
            
            return {
                'avg_sentence_length': avg_sentence_length,
                'lexical_diversity': lexical_diversity,
                'unique_words': unique_words
            }
        except Exception as e:
            logger.error(f"Error in complexity analysis: {str(e)}")
            raise

    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment and emotional content of the text.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            Dict[str, float]: Dictionary containing sentiment scores
        """
        try:
            sentiment_scores = self.sia.polarity_scores(text)
            emotional_extremity = abs(sentiment_scores['pos'] - sentiment_scores['neg'])
            sentiment_scores['emotional_extremity'] = emotional_extremity
            
            return sentiment_scores
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            raise

    def check_source_credibility(self, url: Optional[str]) -> Dict[str, Union[float, List[str]]]:
        """
        Analyze source credibility based on domain and URL characteristics.
        
        Args:
            url (Optional[str]): The URL to analyze
            
        Returns:
            Dict[str, Union[float, List[str]]]: Dictionary containing credibility score and reasons
        """
        if not url:
            return {'score': 50, 'reasons': ['No source URL provided']}
        
        try:
            domain = urlparse(url).netloc.lower()
            score = 100
            reasons = []
            
            # Check domain reputation
            if domain in self.trusted_domains:
                reasons.append('Trusted domain')
            elif domain in self.unreliable_domains:
                score -= 50
                reasons.append('Known unreliable domain')
            else:
                score -= 20
                reasons.append('Unverified domain')
            
            # Check URL characteristics
            if re.search(r'\d{4,}', domain):
                score -= 10
                reasons.append('Suspicious number pattern in domain')
            
            if len(domain) > 30:
                score -= 10
                reasons.append('Unusually long domain name')
            
            if domain.count('-') > 2:
                score -= 10
                reasons.append('Excessive hyphens in domain')
            
            return {'score': max(0, score), 'reasons': reasons}
        except Exception as e:
            logger.error(f"Error in source credibility check: {str(e)}")
            return {'score': 0, 'reasons': [f'Error analyzing URL: {str(e)}']}

    def analyze_text_patterns(self, text: str) -> Dict[str, Union[int, List[str]]]:
        """
        Analyze text for suspicious patterns and characteristics.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            Dict[str, Union[int, List[str]]]: Dictionary containing pattern analysis results
        """
        try:
            text_lower = text.lower()
            patterns = {
                'clickbait': 0,
                'conspiracy': 0,
                'misused_science': 0,
                'suspicious_patterns': []
            }
            
            # Check for clickbait phrases
            for phrase in self.clickbait_phrases:
                if phrase in text_lower:
                    patterns['clickbait'] += 1
                    patterns['suspicious_patterns'].append(f'Clickbait: "{phrase}"')
            
            # Check for conspiracy keywords
            for keyword in self.conspiracy_keywords:
                if keyword in text_lower:
                    patterns['conspiracy'] += 1
                    patterns['suspicious_patterns'].append(f'Conspiracy term: "{keyword}"')
            
            # Check for misused scientific terms
            for term in self.misused_scientific_terms:
                if term in text_lower:
                    patterns['misused_science'] += 1
                    patterns['suspicious_patterns'].append(f'Potentially misused term: "{term}"')
            
            # Check for excessive capitalization
            words = text.split()
            caps_count = sum(1 for word in words if word.isupper())
            if caps_count / max(len(words), 1) > 0.3:
                patterns['suspicious_patterns'].append('Excessive use of capital letters')
            
            # Check for excessive punctuation
            exclamation_count = text.count('!')
            if exclamation_count > 3:
                patterns['suspicious_patterns'].append('Excessive use of exclamation marks')
            
            return patterns
        except Exception as e:
            logger.error(f"Error in pattern analysis: {str(e)}")
            raise

    def calculate_credibility_metrics(
        self,
        text_patterns: Dict[str, Union[int, List[str]]],
        sentiment_scores: Dict[str, float],
        complexity_scores: Dict[str, float]
    ) -> Dict[str, Union[float, List[str]]]:
        """
        Calculate overall credibility metrics based on various analyses.
        
        Args:
            text_patterns: Results from pattern analysis
            sentiment_scores: Results from sentiment analysis
            complexity_scores: Results from complexity analysis
            
        Returns:
            Dict[str, Union[float, List[str]]]: Dictionary containing credibility metrics
        """
        try:
            base_score = 100
            deductions = []
            
            # Deduct for clickbait and conspiracy content
            if text_patterns['clickbait'] > 0:
                deduction = min(30, text_patterns['clickbait'] * 10)
                base_score -= deduction
                deductions.append(f'Clickbait content: -{deduction}')
            
            if text_patterns['conspiracy'] > 0:
                deduction = min(40, text_patterns['conspiracy'] * 15)
                base_score -= deduction
                deductions.append(f'Conspiracy content: -{deduction}')
            
            # Deduct for extreme sentiment
            if sentiment_scores['emotional_extremity'] > 0.7:
                deduction = 20
                base_score -= deduction
                deductions.append(f'Extreme emotional content: -{deduction}')
            
            # Deduct for very low complexity
            if complexity_scores['lexical_diversity'] < 0.3:
                deduction = 15
                base_score -= deduction
                deductions.append(f'Low linguistic complexity: -{deduction}')
            
            return {
                'credibility_score': max(0, base_score),
                'deductions': deductions
            }
        except Exception as e:
            logger.error(f"Error calculating credibility metrics: {str(e)}")
            raise

    def analyze_content(
        self,
        text: str,
        source_url: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Perform comprehensive analysis of content for potential misinformation.
        
        Args:
            text (str): The text content to analyze
            source_url (Optional[str]): The source URL of the content
            metadata (Optional[Dict]): Additional metadata about the content
            
        Returns:
            Dict: Comprehensive analysis results
        """
        try:
            # Initialize results dictionary
            results = {
                'timestamp': datetime.now().isoformat(),
                'content_length': len(text),
                'analysis_version': '2.0'
            }
            
            # Perform various analyses
            text_patterns = self.analyze_text_patterns(text)
            sentiment_scores = self.analyze_sentiment(text)
            complexity_scores = self.analyze_text_complexity(text)
            source_credibility = self.check_source_credibility(source_url)
            
            # Calculate overall credibility metrics
            credibility_metrics = self.calculate_credibility_metrics(
                text_patterns, sentiment_scores, complexity_scores
            )
            
            # Combine all analyses
            results.update({
                'text_patterns': text_patterns,
                'sentiment_analysis': sentiment_scores,
                'complexity_analysis': complexity_scores,
                'source_credibility': source_credibility,
                'credibility_metrics': credibility_metrics
            })
            
            # Determine overall risk level
            if credibility_metrics['credibility_score'] < 50:
                results['risk_level'] = 'high'
            elif credibility_metrics['credibility_score'] < 75:
                results['risk_level'] = 'medium'
            else:
                results['risk_level'] = 'low'
            
            return results
        except Exception as e:
            logger.error(f"Error in content analysis: {str(e)}")
            raise

def main():
    """Main function demonstrating the usage of the misinformation detector."""
    try:
        detector = SocialMediaMisinformationDetector()
        
        # Test cases
        test_cases = [
            {
                'text': 'New study published in Nature shows regular exercise benefits cardiovascular health.',
                'url': 'https://nature.com/articles/s12345'
            },
            {
                'text': 'SHOCKING TRUTH: Doctors HATE this miracle cure! The government doesn\'t want you to know about this ancient remedy that BIG PHARMA is trying to hide! 100% guaranteed to cure all diseases!!!',
                'url': 'https://suspicious-health-news.com/miracle-cure'
            },
            {
                'text': 'Research suggests moderate coffee consumption may have health benefits, according to a recent meta-analysis.',
                'url': 'https://sciencedirect.com/article789'
            }
        ]
        
        print("\nSocial Media Misinformation Detection Analysis")
        print("=" * 50)
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nAnalyzing Test Case {i}:")
            print(f"Text: {test_case['text']}")
            print(f"Source: {test_case['url']}")
            
            results = detector.analyze_content(test_case['text'], test_case['url'])
            
            print("\nAnalysis Results:")
            print(f"Risk Level: {results['risk_level'].upper()}")
            print(f"Credibility Score: {results['credibility_metrics']['credibility_score']}/100")
            
            if results['text_patterns']['suspicious_patterns']:
                print("\nSuspicious Patterns Detected:")
                for pattern in results['text_patterns']['suspicious_patterns']:
                    print(f"- {pattern}")
            
            if results['credibility_metrics']['deductions']:
                print("\nCredibility Deductions:")
                for deduction in results['credibility_metrics']['deductions']:
                    print(f"- {deduction}")
            
            print("\nSentiment Analysis:")
            print(f"- Positive: {results['sentiment_analysis']['pos']:.2f}")
            print(f"- Negative: {results['sentiment_analysis']['neg']:.2f}")
            print(f"- Emotional Extremity: {results['sentiment_analysis']['emotional_extremity']:.2f}")
            
            print("\nSource Credibility:")
            print(f"- Score: {results['source_credibility']['score']}/100")
            for reason in results['source_credibility']['reasons']:
                print(f"- {reason}")
            
            print("=" * 50)

    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main()