// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeMisinformation",
    title: "Analyze for Misinformation",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeMisinformation") {
    const selectedText = info.selectionText;
    analyzeContent(selectedText, tab.url);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeContent") {
    if (request.url && !request.text) {
      fetchUrlContent(request.url).then(content => {
        analyzeContent(content, request.url);
      }).catch(error => {
        chrome.runtime.sendMessage({
          action: "analysisError",
          error: "Failed to fetch URL content"
        });
      });
    } else {
      analyzeContent(request.text, request.url);
    }
  }
});

async function fetchUrlContent(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Create a temporary element to parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Remove scripts, styles, and other non-content elements
    const elementsToRemove = doc.querySelectorAll('script, style, meta, link, iframe');
    elementsToRemove.forEach(el => el.remove());
    
    // Get main content (prioritize article or main content areas)
    const mainContent = doc.querySelector('article, [role="main"], main, .content, #content') || doc.body;
    
    // Clean and return the text content
    return mainContent.textContent.trim()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n');
  } catch (error) {
    throw new Error('Failed to fetch URL content');
  }
}

// Expanded list of trusted domains
const trustedDomains = new Set([
  // Major News Organizations
  'reuters.com', 'apnews.com', 'bloomberg.com', 'economist.com',
  'wsj.com', 'nytimes.com', 'washingtonpost.com', 'ft.com',
  'bbc.com', 'bbc.co.uk', 'theguardian.com', 'npr.org',
  'time.com', 'theatlantic.com', 'newyorker.com', 'latimes.com',
  'usatoday.com', 'chicagotribune.com', 'bostonglobe.com',
  'sfchronicle.com', 'nypost.com', 'independent.co.uk',
  'telegraph.co.uk', 'aljazeera.com', 'france24.com',
  'dw.com', 'abc.net.au', 'cbc.ca', 'globalnews.ca',

  // Scientific Journals and Academic Publishers
  'nature.com', 'science.org', 'sciencemag.org', 'pnas.org',
  'cell.com', 'nejm.org', 'thelancet.com', 'bmj.com',
  'sciencedirect.com', 'springer.com', 'wiley.com', 'acs.org',
  'ieee.org', 'acm.org', 'jstor.org', 'arxiv.org',
  'frontiersin.org', 'tandfonline.com', 'oup.com', 'sage.com',
  'mdpi.com', 'hindawi.com', 'biomedcentral.com', 'plos.org',

  // Educational Institutions
  'edu', 'ac.uk', 'edu.au', 'edu.ca', 'uni-muenchen.de',
  'ox.ac.uk', 'cam.ac.uk', 'harvard.edu', 'mit.edu',
  'stanford.edu', 'berkeley.edu', 'caltech.edu', 'princeton.edu',
  'yale.edu', 'columbia.edu', 'uchicago.edu', 'ucla.edu',
  'umich.edu', 'cornell.edu', 'ethz.ch', 'epfl.ch',
  'tum.de', 'ku.dk', 'uva.nl', 'utoronto.ca',

  // Government Organizations
  'gov', 'gov.uk', 'gc.ca', 'europa.eu', 'who.int',
  'un.org', 'nasa.gov', 'nih.gov', 'cdc.gov', 'fda.gov',
  'epa.gov', 'noaa.gov', 'usda.gov', 'defense.gov',
  'whitehouse.gov', 'senate.gov', 'house.gov', 'state.gov',
  'justice.gov', 'treasury.gov', 'ed.gov', 'energy.gov',

  // Medical and Health Organizations
  'mayoclinic.org', 'clevelandclinic.org', 'hopkinsmedicine.org',
  'medlineplus.gov', 'webmd.com', 'healthline.com',
  'cancer.gov', 'heart.org', 'diabetes.org', 'psychiatry.org',
  'aafp.org', 'ama-assn.org', 'who.int', 'cdc.gov',

  // Research Institutions
  'rand.org', 'brookings.edu', 'pewresearch.org',
  'worldbank.org', 'imf.org', 'oecd.org', 'unesco.org',
  'gatesfoundation.org', 'wellcome.org', 'rockefeller.org',
  'carnegie.org', 'mskcc.org', 'salk.edu', 'scripps.edu',

  // Fact-Checking Organizations
  'snopes.com', 'factcheck.org', 'politifact.com',
  'fullfact.org', 'aap.com.au', 'afp.com', 'reuters.com/fact-check',
  'apnews.com/hub/ap-fact-check', 'bbc.com/news/reality_check'
]);

// Expanded list of unreliable domains
const unreliableDomains = new Set([
  // Known Misinformation Sites
  'conspiracy-news.com', 'fake-science.org', 'clickbait-news.net',
  'viral-stories.com', 'shocking-news.org', 'truth-exposed.net',
  'alternative-facts.com', 'secret-truths.net', 'hidden-news.org',
  'deepstate-exposed.com', 'truth-warrior.net', 'conspiracy-watch.org',
  
  // Clickbait Domains
  'viral-content.net', 'shocking-stories.com', 'trending-now.net',
  'must-see-news.com', 'viral-updates.com', 'click-worthy.net',
  'trending-viral.com', 'share-worthy.net', 'viral-buzz.org',
  'viral-today.com', 'trending-stories.net', 'must-read-news.com',
  
  // Conspiracy Theory Sites
  'illuminati-exposed.com', 'deep-state-news.org', 'truth-seekers.net',
  'conspiracy-watch.com', 'hidden-agenda.org', 'secret-society.net',
  'government-secrets.org', 'cover-up-news.com', 'exposed-truth.net',
  'nwo-news.com', 'alien-truth.org', 'conspiracy-files.net',
  
  // Pseudoscience Domains
  'natural-cures.org', 'alternative-medicine.net', 'miracle-health.com',
  'healing-secrets.org', 'quantum-health.net', 'holistic-truths.com',
  'wellness-revolution.org', 'natural-remedies.net', 'health-secrets.org',
  'miracle-cures.com', 'alternative-science.org', 'healing-truth.net'
]);

async function analyzeContent(text, url) {
  try {
    // Extract domain from URL
    const domain = url ? new URL(url).hostname.toLowerCase() : '';
    const baseScore = calculateBaseScore(domain);

    // Enhanced analysis with more detailed metrics
    const analysisResults = {
      risk_level: determineRiskLevel(text, baseScore),
      credibility_metrics: {
        credibility_score: calculateCredibilityScore(text, baseScore),
        deductions: getDeductions(text, domain),
      },
      text_patterns: {
        suspicious_patterns: detectSuspiciousPatterns(text),
      },
      sentiment_analysis: analyzeSentiment(text),
      source_credibility: {
        score: baseScore,
        reasons: getDomainReasons(domain),
      },
      complexity_analysis: analyzeTextComplexity(text),
    };

    // Send results to popup
    chrome.runtime.sendMessage({
      action: "analysisResults",
      results: analysisResults
    });
  } catch (error) {
    console.error('Analysis error:', error);
    chrome.runtime.sendMessage({
      action: "analysisError",
      error: "Failed to analyze content"
    });
  }
}

function calculateBaseScore(domain) {
  if (!domain) return 50;
  
  // Check exact domain match
  if (trustedDomains.has(domain)) return 90;
  if (unreliableDomains.has(domain)) return 30;
  
  // Check for subdomain matches
  for (const trusted of trustedDomains) {
    if (domain.endsWith('.' + trusted)) return 85;
  }
  for (const unreliable of unreliableDomains) {
    if (domain.endsWith('.' + unreliable)) return 35;
  }
  
  // Check TLD reliability
  if (domain.endsWith('.edu') || domain.endsWith('.gov')) return 80;
  if (domain.endsWith('.org')) return 70;
  
  return 60;
}

function analyzeSentiment(text) {
  const textLower = text.toLowerCase();
  
  // Simple sentiment analysis
  const positiveWords = ['accurate', 'proven', 'study', 'research', 'evidence', 'scientific'];
  const negativeWords = ['hoax', 'conspiracy', 'shocking', 'secret', 'suppress', 'cover-up'];
  
  let pos = 0;
  let neg = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const count = (text.match(regex) || []).length;
    pos += count * 0.1;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    const count = (text.match(regex) || []).length;
    neg += count * 0.1;
  });
  
  const emotional_extremity = Math.abs(pos - neg);
  
  return {
    pos: Math.min(pos, 1),
    neg: Math.min(neg, 1),
    emotional_extremity
  };
}

function analyzeTextComplexity(text) {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  return {
    avg_sentence_length: words.length / Math.max(sentences.length, 1),
    lexical_diversity: uniqueWords.size / Math.max(words.length, 1),
    unique_words: uniqueWords.size
  };
}

function determineRiskLevel(text, baseScore) {
  const textLower = text.toLowerCase();
  const hasClickbait = /shocking|you won't believe|mind-blowing|incredible truth/i.test(text);
  const hasExcessiveCaps = (text.match(/[A-Z]{3,}/g) || []).length > 2;
  const hasConspiracyTerms = /(conspiracy|illuminati|deep state|they don't want you to know)/i.test(text);
  
  if (baseScore < 40 || (hasClickbait && hasConspiracyTerms)) return 'high';
  if (baseScore < 70 || hasClickbait || hasExcessiveCaps) return 'medium';
  return 'low';
}

function calculateCredibilityScore(text, baseScore) {
  let score = baseScore;
  
  // Deduct for suspicious patterns
  if (/shocking|incredible|mind-blowing/i.test(text)) score -= 15;
  if (/\b(secret|they don't want you to know)\b/i.test(text)) score -= 10;
  if ((text.match(/[A-Z]{3,}/g) || []).length > 2) score -= 10;
  if ((text.match(/!!+/g) || []).length > 2) score -= 5;
  if (/\b(miracle|cure|breakthrough)\b/i.test(text)) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function getDeductions(text, domain) {
  const deductions = [];
  
  if (/shocking|incredible|mind-blowing/i.test(text)) {
    deductions.push('Clickbait language detected');
  }
  if ((text.match(/[A-Z]{3,}/g) || []).length > 2) {
    deductions.push('Excessive capitalization');
  }
  if (/\b(secret|they don't want you to know)\b/i.test(text)) {
    deductions.push('Conspiracy-style language');
  }
  if (unreliableDomains.has(domain)) {
    deductions.push('Known unreliable source');
  }
  if (/\b(miracle|cure|breakthrough)\b/i.test(text)) {
    deductions.push('Unsubstantiated medical claims');
  }
  
  return deductions;
}

function detectSuspiciousPatterns(text) {
  const patterns = [];
  const textLower = text.toLowerCase();
  
  // Check for clickbait
  if (/shocking|incredible|mind-blowing/i.test(text)) {
    patterns.push('Clickbait language');
  }
  
  // Check for conspiracy language
  if (/\b(secret|they don't want you to know)\b/i.test(text)) {
    patterns.push('Conspiracy-style language');
  }
  
  // Check for excessive formatting
  if ((text.match(/[A-Z]{3,}/g) || []).length > 2) {
    patterns.push('Excessive capitalization');
  }
  if ((text.match(/!!+/g) || []).length > 2) {
    patterns.push('Excessive punctuation');
  }
  
  // Check for medical claims
  if (/\b(cure|miracle|revolutionary|breakthrough)\b/i.test(text)) {
    patterns.push('Sensational health claims');
  }
  
  // Check for emotional manipulation
  if (/\b(shocking truth|must see|share before|they don't want)\b/i.test(text)) {
    patterns.push('Emotional manipulation');
  }
  
  return patterns;
}

function getDomainReasons(domain) {
  if (!domain) return ['No source URL provided'];
  
  const reasons = [];
  
  if (trustedDomains.has(domain)) {
    reasons.push('Trusted domain');
  } else if (unreliableDomains.has(domain)) {
    reasons.push('Known unreliable domain');
  } else {
    // Check for subdomain matches
    for (const trusted of trustedDomains) {
      if (domain.endsWith('.' + trusted)) {
        reasons.push('Subdomain of trusted source');
        return reasons;
      }
    }
    
    // Check TLD reliability
    if (domain.endsWith('.edu')) {
      reasons.push('Educational institution domain');
    } else if (domain.endsWith('.gov')) {
      reasons.push('Government domain');
    } else if (domain.endsWith('.org')) {
      reasons.push('Non-profit organization domain');
    } else {
      reasons.push('Unverified domain');
    }
  }
  
  return reasons;
}