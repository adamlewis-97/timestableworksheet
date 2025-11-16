/* ============================================
   Times Table Worksheet Generator
   ============================================ */

// Global state to store current questions
let currentQuestions = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/* ============================================
   Initialization
   ============================================ */

/**
 * Sets up the app when the page loads
 * Creates the times table checkboxes and sets up event listeners
 */
function initializeApp() {
    createTimesTableCheckboxes();
    setupEventListeners();
}

/**
 * Creates checkboxes for times tables 1× through 20×
 * Default: 2× through 12× are checked, 1× and 13×-20× are unchecked
 */
function createTimesTableCheckboxes() {
    const tablesGrid = document.getElementById('tablesGrid');
    
    for (let i = 1; i <= 20; i++) {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox-input';
        checkbox.value = i;
        checkbox.id = `table-${i}`;
        
        // Default: check 2× through 12×, uncheck 1× and 13×-20×
        if (i >= 2 && i <= 12) {
            checkbox.checked = true;
        }
        
        const text = document.createElement('span');
        text.className = 'checkbox-text';
        text.textContent = `${i}×`;
        
        label.appendChild(checkbox);
        label.appendChild(text);
        tablesGrid.appendChild(label);
    }
}

/**
 * Sets up all event listeners for buttons and inputs
 */
function setupEventListeners() {
    document.getElementById('generateBtn').addEventListener('click', handleGenerate);
    document.getElementById('downloadBtn').addEventListener('click', handleDownload);
    
    // Update displayed value when slider changes
    const slider = document.getElementById('numQuestions');
    const valueDisplay = document.getElementById('numQuestionsValue');
    slider.addEventListener('input', function() {
        valueDisplay.textContent = this.value;
    });
}

/* ============================================
   Input Validation
   ============================================ */

/**
 * Validates user inputs before generating worksheet
 * Returns true if valid, false otherwise
 * Shows inline error messages if validation fails
 */
function validateInputs() {
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    // Validate number of questions
    const numQuestionsInput = document.getElementById('numQuestions');
    const numQuestions = parseInt(numQuestionsInput.value, 10);
    
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 99) {
        showError('numQuestionsError', 'Please enter a number between 1 and 99');
        isValid = false;
    }
    
    // Validate at least one times table is selected
    const selectedTables = getSelectedTables();
    if (selectedTables.length === 0) {
        showError('tablesError', 'Please select at least one times table');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Gets all selected times tables as an array of numbers
 * @returns {number[]} Array of selected table numbers (e.g., [2, 3, 4])
 */
function getSelectedTables() {
    const checkboxes = document.querySelectorAll('#tablesGrid input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
}

/**
 * Shows an error message in the specified error container
 * @param {string} errorId - The ID of the error message element
 * @param {string} message - The error message to display
 */
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

/**
 * Clears all error messages
 */
function clearErrors() {
    document.getElementById('numQuestionsError').textContent = '';
    document.getElementById('tablesError').textContent = '';
}

/* ============================================
   Question Generation
   ============================================ */

/**
 * Main function to generate the worksheet
 * Validates inputs, generates questions, and renders them
 */
function generateWorksheet() {
    // Validate inputs first
    if (!validateInputs()) {
        return;
    }
    
    // Get user settings
    const numQuestions = parseInt(document.getElementById('numQuestions').value, 10);
    const selectedTables = getSelectedTables();
    const includeDivision = document.getElementById('includeDivision').checked;
    
    // Generate questions
    currentQuestions = [];
    for (let i = 0; i < numQuestions; i++) {
        const question = generateQuestion(selectedTables, includeDivision);
        currentQuestions.push(question);
    }
    
    // Render the worksheet and answers
    renderWorksheet(currentQuestions);
    renderAnswers(currentQuestions);
    
    // Show the sections
    document.getElementById('worksheetSection').style.display = 'block';
    document.getElementById('answersSection').style.display = 'block';
}

/**
 * Generates a single question (multiplication or division)
 * @param {number[]} selectedTables - Array of selected times table numbers
 * @param {boolean} includeDivision - Whether to include division questions
 * @returns {Object} Question object with type, base, other, question text, and answer
 */
function generateQuestion(selectedTables, includeDivision) {
    // Pick a random table from selected tables
    const base = pickRandom(selectedTables);
    
    // Pick a random number from 1 to 12
    const other = randomInt(1, 12);
    
    // Decide if this should be a division question (50% chance if division is enabled)
    const isDivision = includeDivision && Math.random() < 0.5;
    
    if (isDivision) {
        // Division question: (base × other) ÷ base = other
        // Display as: (base × other) ÷ base = ______
        const product = base * other;
        return {
            type: 'division',
            base: base,
            other: other,
            product: product,
            questionText: `${product} ÷ ${base} = ______`,
            answer: other
        };
    } else {
        // Multiplication question: base × other = ______
        return {
            type: 'multiplication',
            base: base,
            other: other,
            questionText: `${base} × ${other} = ______`,
            answer: base * other
        };
    }
}

/**
 * Picks a random element from an array
 * @param {Array} array - The array to pick from
 * @returns {*} A random element from the array
 */
function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ============================================
   Rendering
   ============================================ */

/**
 * Systematically calculates optimal layout for any question count from 1 to 99
 * Font size decreases as question count increases
 * Column count increases as question count increases
 * @param {number} questionCount - Number of questions (1-99)
 * @returns {Object} Object with columns, fontSize, and lineHeight
 */
function calculateOptimalLayout(questionCount) {
    // A4 portrait: 210mm x 297mm
    const pageHeight = 297;
    const pageWidth = 210;
    const margin = 15;
    const titleY = margin + 8;
    const titleHeight = 12;
    const titleGap = 5;
    const startY = titleY + titleHeight + titleGap;
    const maxY = pageHeight - margin;
    const usableHeight = maxY - startY; // ~247mm available for questions
    const usableWidth = pageWidth - (margin * 2); // ~180mm
    
    // Step 1: Determine optimal column count based on question count
    // This is systematic: fewer questions = fewer columns, more questions = more columns
    let columns;
    if (questionCount <= 5) {
        // 1-5 questions: 1 column (e.g., 1 question = 1 big question in middle)
        columns = 1;
    } else if (questionCount <= 10) {
        // 6-10 questions: 2 columns (e.g., 10 = 2 columns of 5)
        columns = 2;
    } else if (questionCount <= 20) {
        // 11-20 questions: 2 columns (e.g., 20 = 2 columns of 10)
        columns = 2;
    } else if (questionCount <= 33) {
        // 21-33 questions: 3 columns (e.g., 33 = 3 columns of 11)
        columns = 3;
    } else if (questionCount <= 50) {
        // 34-50 questions: 3 columns (e.g., 50 = 3 columns, ~17 per column)
        columns = 3;
    } else if (questionCount <= 66) {
        // 51-66 questions: 3 columns (e.g., 66 = 3 columns of 22)
        columns = 3;
    } else {
        // 67-99 questions: 3-4 columns, prefer 3 for clean division
        // 99 = 3 columns of 33, 75 = 3 columns of 25, etc.
        if (questionCount % 3 === 0 || questionCount >= 90) {
            columns = 3;
        } else {
            columns = 4;
        }
    }
    
    // Step 2: Calculate questions per column
    const questionsPerColumn = Math.ceil(questionCount / columns);
    
    // Step 3: Calculate line height to exactly fill the page
    // Each question gets equal vertical space
    const lineHeight = usableHeight / questionsPerColumn;
    
    // Step 4: Calculate font size that decreases as question count increases
    // Formula: larger font for fewer questions, smaller font for more questions
    // Base font size scales inversely with question count
    // For 1 question: very large font (~20mm)
    // For 99 questions: smallest readable font (~9.5mm)
    
    // Calculate base font size using inverse relationship
    // Range: 1 question = ~20mm, 99 questions = ~9.5mm
    const minFontSize = 9.5;  // Minimum readable font size
    const maxFontSize = 20;    // Maximum font size for single question
    const fontRange = maxFontSize - minFontSize; // 10.5mm range
    
    // Inverse scaling: font size decreases as question count increases
    // Using a logarithmic-like curve for smooth scaling
    const normalizedCount = (questionCount - 1) / (99 - 1); // 0 to 1
    const fontSize = maxFontSize - (fontRange * Math.pow(normalizedCount, 0.7));
    
    // Step 5: Adjust font size based on available line height
    // Font should not exceed ~85% of line height for readability
    const maxFontFromLineHeight = lineHeight * 0.85;
    const finalFontSize = Math.min(fontSize, maxFontFromLineHeight);
    
    // Step 6: Ensure font size is within reasonable bounds
    // Minimum: 9.5mm (readable), Maximum: 20mm (not too huge)
    const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, finalFontSize));
    
    // Step 7: For very small question counts, ensure minimum line height
    // This prevents questions from being too cramped
    let finalLineHeight = lineHeight;
    if (questionCount <= 5) {
        finalLineHeight = Math.max(lineHeight, 15); // Generous spacing for few questions
    } else if (questionCount <= 10) {
        finalLineHeight = Math.max(lineHeight, 12); // Good spacing for small counts
    }
    
    return {
        columns: columns,
        fontSize: Math.round(clampedFontSize * 10) / 10, // Round to 1 decimal
        lineHeight: Math.round(finalLineHeight * 10) / 10
    };
}

/**
 * Renders the worksheet questions in the questions list
 * Applies dynamic column layout based on question count
 * @param {Object[]} questions - Array of question objects
 */
function renderWorksheet(questions) {
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = ''; // Clear previous questions
    
    // Calculate optimal layout
    const layout = calculateOptimalLayout(questions.length);
    
    // Apply column layout via CSS custom property
    questionsList.style.setProperty('--column-count', layout.columns);
    
    // Adjust font size for screen display (convert mm to rem approximately)
    // 1mm ≈ 0.264583px, and assuming 16px base, 1mm ≈ 0.0165rem
    // But for better readability, we'll use a more generous conversion
    const screenFontSize = Math.max(0.875, layout.fontSize * 0.08); // Convert mm to rem
    questionsList.style.fontSize = `${screenFontSize}rem`;
    questionsList.style.lineHeight = `${layout.lineHeight * 0.12}rem`;
    
    questions.forEach((question, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = question.questionText;
        questionsList.appendChild(listItem);
    });
}

/**
 * Renders the answer key in the answers list
 * @param {Object[]} questions - Array of question objects
 */
function renderAnswers(questions) {
    const answersList = document.getElementById('answersList');
    answersList.innerHTML = ''; // Clear previous answers
    
    questions.forEach((question, index) => {
        const listItem = document.createElement('li');
        // Show question with answer: "7 × 4 = 28" or "28 ÷ 7 = 4"
        listItem.textContent = `${question.questionText.replace('______', question.answer)}`;
        answersList.appendChild(listItem);
    });
}

/* ============================================
   Event Handlers
   ============================================ */

/**
 * Handles the Present worksheet button click
 * Generates worksheet and opens presentation mode
 */
function handleGenerate() {
    generateWorksheet();
    // Open presentation mode with the generated questions
    if (currentQuestions.length > 0) {
        openPresentationMode();
    }
}

/**
 * Handles the Download worksheet as PDF button click
 * Generates a fresh worksheet and downloads it as PDF
 * Works independently - doesn't require the Display button to be clicked first
 */
function handleDownload() {
    // Validate inputs first
    if (!validateInputs()) {
        return;
    }
    
    // Get user settings
    const numQuestions = parseInt(document.getElementById('numQuestions').value, 10);
    const selectedTables = getSelectedTables();
    const includeDivision = document.getElementById('includeDivision').checked;
    
    // Generate fresh questions for the PDF
    const pdfQuestions = [];
    for (let i = 0; i < numQuestions; i++) {
        const question = generateQuestion(selectedTables, includeDivision);
        pdfQuestions.push(question);
    }
    
    // Also update the displayed worksheet with these questions
    currentQuestions = pdfQuestions;
    renderWorksheet(pdfQuestions);
    renderAnswers(pdfQuestions);
    
    // Show the sections
    document.getElementById('worksheetSection').style.display = 'block';
    document.getElementById('answersSection').style.display = 'block';
    
    // Generate and download the PDF
    downloadWorksheetPdf(pdfQuestions);
}

/* ============================================
   PDF Generation
   ============================================ */

/**
 * Generates and downloads a PDF of the worksheet
 * Uses jsPDF library to create an A4 portrait PDF
 * Dynamically adjusts columns and font size to fit on one page
 * @param {Object[]} questions - Array of question objects
 */
function downloadWorksheetPdf(questions) {
    // Access jsPDF from the global scope (loaded from CDN)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Calculate optimal layout
    const layout = calculateOptimalLayout(questions.length);
    
    // Set up page dimensions
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 15;
    const usableWidth = pageWidth - (margin * 2);
    
    // Calculate column width
    const columnWidth = (usableWidth - (layout.columns - 1) * 5) / layout.columns; // 5mm gap between columns
    const columnGap = 5;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Timestable worksheet', pageWidth / 2, margin + 8, { align: 'center' });
    
    // Starting position after title
    const titleY = margin + 8;
    const titleHeight = 12;
    let startY = titleY + titleHeight + 5; // Start after title with small gap
    const maxY = pageHeight - margin;
    const usableHeight = maxY - startY;
    
    // Calculate questions per column
    const questionsPerColumn = Math.ceil(questions.length / layout.columns);
    const lineSpacing = layout.lineHeight;
    
    // Set font for questions
    doc.setFontSize(layout.fontSize);
    doc.setFont(undefined, 'normal');
    
    // Distribute questions across columns
    // Use the calculated line height exactly to fill the page
    for (let col = 0; col < layout.columns; col++) {
        const columnX = margin + col * (columnWidth + columnGap);
        let yPosition = startY;
        
        // Get questions for this column
        for (let i = 0; i < questionsPerColumn; i++) {
            const questionIndex = col * questionsPerColumn + i;
            
            // Stop if we've processed all questions
            if (questionIndex >= questions.length) {
                break;
            }
            
            // Check if we would overflow (shouldn't happen with proper calculation)
            if (yPosition > maxY - lineSpacing) {
                break;
            }
            
            const question = questions[questionIndex];
            // Add adequate spacing between question number and question text
            // Use extra space for double-digit numbers to maintain consistent spacing
            const questionNumber = questionIndex + 1;
            const spacing = questionNumber >= 10 ? '  ' : ' '; // Extra space for double digits
            const questionText = `${questionNumber})${spacing}${question.questionText}`;
            
            // Split text if too long for column
            const maxWidth = columnWidth - 8; // Leave small padding
            const lines = doc.splitTextToSize(questionText, maxWidth);
            
            // Draw each line using the exact line spacing
            lines.forEach((line, lineIndex) => {
                if (yPosition > maxY - lineSpacing) {
                    return; // Skip if would overflow
                }
                doc.text(line, columnX, yPosition);
                // Only advance if not the last line of the question
                if (lineIndex < lines.length - 1) {
                    yPosition += lineSpacing * 0.6; // Smaller spacing for wrapped lines
                }
            });
            
            // Move to next question position using the calculated line height
            // This ensures we fill the page exactly
            yPosition += lineSpacing;
        }
    }
    
    // Add footer at the bottom of the page
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100); // Gray color for subtle footer
    doc.text('timestableworksheet.com', pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `times-table-worksheet-${timestamp}.pdf`;
    
    // Download the PDF
    doc.save(filename);
}

/* ============================================
   Presentation Mode
   ============================================ */

// Global state for presentation mode
let presentationAnswersVisible = false;
let presentationResizeHandler = null; // Store resize handler for cleanup

/* ============================================
   Presentation Mode Layout Calculation
   ============================================ */

/**
 * Presentation Layout Constants
 * 
 * Location: app.js lines ~552-570
 * 
 * Adjust these constants to tweak the presentation layout behavior:
 * - PRESENTATION_MIN_FONT_PX: Minimum font size (never go below this, default: 18)
 * - PRESENTATION_MAX_FONT_PX: Maximum font size (default: 44)
 * 
 * Font size tiers are defined in calculatePresentationLayout() based on question count:
 * - <= 12 questions: 3 columns, 40px font
 * - 13-24 questions: 4 columns, 32px font
 * - 25-40 questions: 4 columns, 26px font
 * - 41-60 questions: 5 columns, 22px font
 * - > 60 questions: 5 columns, 18px font
 */
const PRESENTATION_MIN_FONT_PX = 18;
const PRESENTATION_MAX_FONT_PX = 44;

/**
 * Calculates optimal columns and font size for presentation mode
 * Font size is primarily driven by question count, with simple tiers
 * 
 * Location: app.js lines ~572-620
 * 
 * Never goes below PRESENTATION_MIN_FONT_PX. If questions don't fit,
 * allows scrolling instead of shrinking font further.
 * 
 * @param {number} questionCount - Number of questions to display
 * @returns {Object} Object with columns and fontSizePx
 */
function calculatePresentationLayout(questionCount) {
    let columns;
    let fontSize;

    // Font size tiers based on question count
    if (questionCount <= 12) {
        // Small sets: very large text, 3 columns
        columns = 3;
        fontSize = 40;
    } else if (questionCount <= 24) {
        // Medium-small sets: large text, 4 columns
        columns = 4;
        fontSize = 32;
    } else if (questionCount <= 40) {
        // Medium sets: medium text, 4 columns
        columns = 4;
        fontSize = 26;
    } else if (questionCount <= 60) {
        // Medium-large sets: smaller but readable, 5 columns
        columns = 5;
        fontSize = 22;
    } else {
        // Large sets: small but legible, 5 columns
        columns = 5;
        fontSize = 18;
    }

    // Clamp font size in case of very small screens
    // Use viewport height as a constraint, but don't let it drive the size
    const maxAllowed = Math.min(PRESENTATION_MAX_FONT_PX, window.innerHeight / 18);
    fontSize = Math.max(PRESENTATION_MIN_FONT_PX, Math.min(fontSize, maxAllowed));

    // Optional clamp for columns (shouldn't be needed with current tiers, but safety check)
    columns = Math.max(1, Math.min(columns, 5));

    return {
        columns: columns,
        fontSizePx: Math.round(fontSize)
    };
}

/**
 * Updates the presentation layout based on current questions and viewport
 * Applies CSS variables to the overlay element
 */
function updatePresentationLayout() {
    const overlay = document.getElementById('presentationOverlay');
    
    // Check if overlay is visible
    if (!overlay || overlay.style.display === 'none') {
        return;
    }
    
    if (currentQuestions.length === 0) {
        return;
    }
    
    // Calculate optimal layout
    const layout = calculatePresentationLayout(currentQuestions.length);
    
    // Apply CSS variables to overlay
    overlay.style.setProperty('--presentation-columns', layout.columns);
    overlay.style.setProperty('--presentation-font-size', layout.fontSizePx + 'px');
}

/**
 * Opens the presentation mode overlay
 * Renders the current questions in presentation format
 */
function openPresentationMode() {
    if (currentQuestions.length === 0) {
        return; // Don't open if no questions generated
    }
    
    const overlay = document.getElementById('presentationOverlay');
    overlay.style.display = 'flex';
    
    // Reset answers visibility
    presentationAnswersVisible = false;
    updateAnswersToggleButton();
    
    // Render questions in presentation mode (this also updates layout)
    renderPresentationWorksheet(currentQuestions, false);
    
    // Set up event listeners if not already set
    setupPresentationEventListeners();
    
    // Set up resize handler for layout updates
    setupPresentationResizeHandler();
    
    // Focus the close button for keyboard accessibility
    document.getElementById('closePresentationBtn').focus();
    
    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the presentation mode overlay
 */
function closePresentationMode() {
    const overlay = document.getElementById('presentationOverlay');
    overlay.style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Remove resize handler
    removePresentationResizeHandler();
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
            // Ignore errors if fullscreen API fails
        });
    }
}

/**
 * Renders questions in presentation mode
 * 
 * Location: app.js lines ~699-759
 * 
 * Creates HTML structure:
 * - When answers hidden: <div class="presentation-question">1) 6 × 12 =</div>
 * - When answers shown: <div class="presentation-question">1) 6 × 12 = 72</div>
 * 
 * Simple single-line layout with no answer lines or underscores.
 * 
 * @param {Object[]} questions - Array of question objects
 * @param {boolean} showAnswers - Whether to show answers
 */
function renderPresentationWorksheet(questions, showAnswers) {
    const questionsList = document.getElementById('presentationQuestionsList');
    
    // Clear previous content
    questionsList.innerHTML = '';
    
    // Render questions - simplified single-line structure
    // Answers are shown inline with questions when showAnswers is true
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'presentation-question';
        
        if (showAnswers) {
            // Show question with answer: "1) 6 × 12 = 72"
            questionDiv.textContent = `${index + 1}) ${question.questionText.replace('______', question.answer)}`;
        } else {
            // Show question without answer: "1) 6 × 12 ="
            const questionText = question.questionText.replace('______', '');
            questionDiv.textContent = `${index + 1}) ${questionText}`;
        }
        
        questionsList.appendChild(questionDiv);
    });
    
    // Update layout after rendering
    updatePresentationLayout();
}

/**
 * Toggles the visibility of answers in presentation mode
 */
function togglePresentationAnswers() {
    presentationAnswersVisible = !presentationAnswersVisible;
    renderPresentationWorksheet(currentQuestions, presentationAnswersVisible);
    updateAnswersToggleButton();
    // Layout is updated by renderPresentationWorksheet
}

/**
 * Updates the text of the answers toggle button
 */
function updateAnswersToggleButton() {
    const toggleBtn = document.getElementById('toggleAnswersBtn');
    if (presentationAnswersVisible) {
        toggleBtn.textContent = 'Hide answers';
    } else {
        toggleBtn.textContent = 'Show answers';
    }
}

/**
 * Toggles fullscreen mode
 */
function toggleFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (!document.fullscreenElement) {
        // Enter fullscreen
        const overlay = document.getElementById('presentationOverlay');
        overlay.requestFullscreen().then(() => {
            fullscreenBtn.textContent = 'Exit full screen';
        }).catch(() => {
            // Fullscreen API not available or failed
            fullscreenBtn.style.display = 'none';
        });
    } else {
        // Exit fullscreen
        document.exitFullscreen().then(() => {
            fullscreenBtn.textContent = 'Go full screen';
        }).catch(() => {
            // Ignore errors
        });
    }
}

/**
 * Sets up event listeners for presentation mode
 * Only sets them up once to avoid duplicates
 */
function setupPresentationEventListeners() {
    // Check if listeners are already set up
    if (document.getElementById('closePresentationBtn').hasAttribute('data-listeners-setup')) {
        return;
    }
    
    // Close button
    document.getElementById('closePresentationBtn').addEventListener('click', closePresentationMode);
    
    // Toggle answers button
    document.getElementById('toggleAnswersBtn').addEventListener('click', togglePresentationAnswers);
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (document.fullscreenEnabled) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Update button text when fullscreen state changes
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                fullscreenBtn.textContent = 'Exit full screen';
            } else {
                fullscreenBtn.textContent = 'Go full screen';
            }
        });
    } else {
        // Hide button if fullscreen API not available
        fullscreenBtn.style.display = 'none';
    }
    
    // ESC key to close
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape' && document.getElementById('presentationOverlay').style.display !== 'none') {
            closePresentationMode();
        }
    });
    
    // Mark as set up
    document.getElementById('closePresentationBtn').setAttribute('data-listeners-setup', 'true');
}

/**
 * Sets up resize handler for presentation mode
 * Recalculates layout when window is resized
 */
function setupPresentationResizeHandler() {
    // Remove existing handler if any
    removePresentationResizeHandler();
    
    // Create new resize handler with debouncing for performance
    let resizeTimeout;
    presentationResizeHandler = function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const overlay = document.getElementById('presentationOverlay');
            if (overlay && overlay.style.display !== 'none') {
                updatePresentationLayout();
            }
        }, 150); // Debounce resize events
    };
    
    window.addEventListener('resize', presentationResizeHandler);
    
    // Also listen for fullscreen changes (in case user toggles fullscreen)
    document.addEventListener('fullscreenchange', presentationResizeHandler);
}

/**
 * Removes resize handler when presentation mode is closed
 */
function removePresentationResizeHandler() {
    if (presentationResizeHandler) {
        window.removeEventListener('resize', presentationResizeHandler);
        document.removeEventListener('fullscreenchange', presentationResizeHandler);
        presentationResizeHandler = null;
    }
}

