const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

/**
 * Simple document parser for extracting items from uploaded files
 * Supports text extraction from various formats
 */

// Language detection based on common keywords
const LANGUAGE_KEYWORDS = {
  sinhala: ['මම', 'දැඩි', 'තෙරුම්', 'කාර්ය', 'මනසින්', 'ශක්තිය', 'දුකට', 'නොසිටින්න'],
  spanish: ['me', 'siento', 'exhauasto', 'difícil', 'recuperar', 'energía', 'cínico'],
  tamil: ['நான்', 'உணர்கிறேன்', 'தெளிவாக', 'இயக்க'],
  french: ['je', 'me', 'sens', 'épuisé', 'difficile', 'récupérer', 'énergie'],
  portuguese: ['sinto', 'exausto', 'difícil', 'recuperar', 'energia', 'cínico'],
  german: ['fühle', 'erschöpft', 'schwer', 'energie', 'erholen'],
  english: ['feel', 'exhausted', 'hard', 'recover', 'energy', 'cynical', 'aversion']
};

/**
 * Detect language from text content
 */
function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  const scores = {};

  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    scores[lang] = keywords.filter(keyword => lowerText.includes(keyword)).length;
  }

  const [detectedLang, score] = Object.entries(scores).reduce((prev, current) =>
    current[1] > prev[1] ? current : prev
  );

  return score > 0 ? detectedLang : 'english';
}

/**
 * Extract items from text content
 * Handles numbered lists, bullet points, etc.
 */
function extractItems(text) {
  const items = [];

  // Remove extra whitespace and normalize line breaks
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('Total lines to process:', lines.length);

  // First pass: detect if there's a numbered or bulleted pattern
  let hasNumberedPattern = false;
  let hasBulletPattern = false;

  for (const line of lines) {
    if (line.match(/^(\d+)[.):\s]+(.+)$/)) {
      hasNumberedPattern = true;
      break;
    }
    if (line.match(/^[-*•]\s+(.+)$/)) {
      hasBulletPattern = true;
      break;
    }
  }

  console.log('Pattern detection:', { hasNumberedPattern, hasBulletPattern });

  // Second pass: extract items based on detected pattern
  for (const line of lines) {
    // Stop if we've reached 50 items
    if (items.length >= 50) {
      break;
    }

    // Check for numbered items (1., 1), 1:, etc.)
    const numberedMatch = line.match(/^(\d+)[.):\s]+(.+)$/);
    if (numberedMatch) {
      const itemText = numberedMatch[2].trim();
      if (itemText.length > 2) {
        items.push(itemText);
        console.log(`Added numbered item ${items.length}:`, itemText);
      }
      continue;
    }

    // Check for bullet points (-, *, •, etc.)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1].trim();
      if (itemText.length > 2) {
        items.push(itemText);
        console.log(`Added bullet item ${items.length}:`, itemText);
      }
      continue;
    }

    // If no numbered or bullet pattern was detected, treat each line as an item
    if (!hasNumberedPattern && !hasBulletPattern && line.length > 5) {
      items.push(line);
      console.log(`Added plain item ${items.length}:`, line);
    }
  }

  console.log('Total items extracted:', items.length);
  return items;
}

/**
 * Parse uploaded document
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} filename - Original filename
 * @returns {Object} { items, language, itemCount }
 */
async function parseDocument(fileBuffer, filename) {
  try {
    // Get file extension
    const ext = filename.split('.').pop().toLowerCase();
    let text = '';

    // Handle different file types
    if (ext === 'txt') {
      text = fileBuffer.toString('utf-8');
    } else if (ext === 'pdf') {
      // Parse PDF using pdf-parse
      try {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } catch (pdfErr) {
        return {
          success: false,
          error: 'Failed to parse PDF file. Please ensure it contains readable text.',
          items: [],
          language: 'english',
          itemCount: 0
        };
      }
    } else if (ext === 'docx' || ext === 'doc') {
      // Parse DOCX using mammoth
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } catch (docxErr) {
        return {
          success: false,
          error: 'Failed to parse Word document. Please ensure it is a valid .docx file.',
          items: [],
          language: 'english',
          itemCount: 0
        };
      }
    } else {
      return {
        success: false,
        error: 'Unsupported file format. Please use .txt, .docx, or .pdf files.',
        items: [],
        language: 'english',
        itemCount: 0
      };
    }

    // Extract items
    const items = extractItems(text);
    
    // Detect language
    const language = detectLanguage(text);

    // Validate extraction
    if (items.length === 0) {
      return {
        success: false,
        error: 'No items found in document. Please ensure items are numbered or bulleted.',
        items: [],
        language,
        itemCount: 0
      };
    }

    return {
      success: true,
      items,
      language,
      itemCount: items.length,
      filename,
      extractedAt: new Date().toISOString()
    };
  } catch (err) {
    return {
      success: false,
      error: `Error parsing document: ${err.message}`,
      items: [],
      language: 'english',
      itemCount: 0
    };
  }
}

/**
 * Validate if item count matches expected criteria
 */
function validateItemCount(itemCount, expectedCount = 12) {
  return {
    isValid: itemCount === expectedCount,
    expected: expectedCount,
    received: itemCount,
    message: itemCount === expectedCount
      ? `✓ Perfect! Found exactly ${itemCount} items.`
      : `⚠ Expected ${expectedCount} items, found ${itemCount}.`
  };
}

module.exports = {
  parseDocument,
  detectLanguage,
  extractItems,
  validateItemCount
};
