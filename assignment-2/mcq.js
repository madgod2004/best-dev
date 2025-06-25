let questionCounter = 0;

// Get DOM elements
const questionInput = document.getElementById('questionInput');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const questionsContainer = document.getElementById('questionsContainer');

function updateQuestionPlaceholder() {
  if (questionsContainer.children.length === 0) {
    questionInput.placeholder = "This is a question statement.";
  } else {
    questionInput.placeholder = "Add New Question";
  }
}

updateQuestionPlaceholder();

// Add event listeners
addQuestionBtn.addEventListener('click', addQuestion);
questionInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addQuestion();
    }
});

function addQuestion() {
    const questionText = questionInput.value.trim();
    
    if (questionText === '') {
        return;
    }
    
    questionCounter++;
    
    // Create question card
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.id = `question-${questionCounter}`;
    
    // Create question header
    const questionHeader = document.createElement('div');
    questionHeader.className = 'question-header';
    
    const questionTextElement = document.createElement('div');
    questionTextElement.className = 'question-text';
    questionTextElement.textContent = `Q: ${questionText}`;

    
    questionHeader.appendChild(questionTextElement);
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // Create 4 options
    for (let i = 0; i < 4; i++) {
        const optionItem = createOptionItem(i, questionCounter);
        optionsContainer.appendChild(optionItem);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete question');
    deleteBtn.addEventListener('click', function() {
        deleteQuestion(questionCard.id);
    });
    optionsContainer.appendChild(deleteBtn);
    
    // Assemble question card
    questionCard.appendChild(questionHeader);
    questionCard.appendChild(optionsContainer);
    
    // Add to container
    questionsContainer.appendChild(questionCard);
    
    // Clear input
    questionInput.value = '';
    questionInput.focus();

     updateQuestionPlaceholder();
}

function createOptionItem(optionIndex, questionId) {
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.className = 'option-input';
    optionInput.placeholder = `Add Option ${optionIndex + 1}`;
    
    const finalizeBtn = document.createElement('button');
    finalizeBtn.className = 'finalize-btn';
    
    // Add event listeners
    finalizeBtn.addEventListener('click', function() {
        finalizeOption(optionItem, optionInput.value, questionId, optionIndex);
    });
    
    optionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            finalizeOption(optionItem, optionInput.value, questionId, optionIndex);
        }
    });
    
    optionItem.appendChild(optionInput);
    optionItem.appendChild(finalizeBtn);
    
    return optionItem;
}

function finalizeOption(optionItem, optionText, questionId, optionIndex) {
    if (optionText.trim() === '') {
        return;
    }
    
    // Clear the option item
    optionItem.innerHTML = '';
    optionItem.className = 'finalized-option';
    
    // Create new elements for finalized option
    const radioInput = document.createElement('input');
    radioInput.type = 'radio';
    radioInput.name = `question-${questionId}`;
    radioInput.value = optionText;
    
    const finalizedText = document.createElement('div');
    finalizedText.className = 'finalized-text';
    finalizedText.textContent = optionText;
    
    // Assemble finalized option
    optionItem.appendChild(radioInput);
    optionItem.appendChild(finalizedText);
}

function deleteQuestion(questionId) {
    const questionCard = document.getElementById(questionId);
    if (questionCard) {
        questionsContainer.removeChild(questionCard);
    }

    updateQuestionPlaceholder();
}