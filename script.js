document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const setupArea = document.getElementById('setup-area');
    const quizArea = document.getElementById('quiz-area');
    const resultsArea = document.getElementById('results-area');

    // Setup Area Elements
    const subjectSelectionArea = document.getElementById('subject-selection-area');
    const topicSelectionArea = document.getElementById('topic-selection-area');
    const subjectGrid = document.getElementById('subject-grid');
    const selectedSubjectNameSpan = document.getElementById('selected-subject-name');
    const topicList = document.getElementById('topic-list');
    const backToSubjectsBtn = document.getElementById('back-to-subjects-btn');
    const bestScoreDisplay = document.getElementById('best-score-display');
    const quizSettingsArea = document.getElementById('quiz-settings');
    const startQuizBtn = document.getElementById('start-quiz-btn');

    // Quiz Area Elements
    const quizInfoSubject = document.getElementById('current-subject');
    const quizInfoTopic = document.getElementById('current-topic');
    const currentQuestionNumDisplay = document.getElementById('current-question-num');
    const totalQuestionsDisplay = document.getElementById('total-questions');
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressBar = document.getElementById('progress-bar');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const questionNumberDisplay = document.getElementById('question-number');
    const questionTextDisplay = document.getElementById('question-text');
    const optionsList = document.getElementById('options-list');
    const feedbackDisplay = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-btn');
    const exitQuizBtn = document.getElementById('exit-quiz-btn');

    // Results Area Elements
    const percentScoreDisplay = document.getElementById('percent-score');
    const finalScoreDisplay = document.getElementById('final-score');
    const timeTakenDisplay = document.getElementById('time-taken');
    const accuracyDisplay = document.getElementById('accuracy');
    const finalBestScoreDisplay = document.getElementById('final-best-score');
    const restartBtn = document.getElementById('restart-btn');
    const newQuizBtn = document.getElementById('new-quiz-btn');
    const reviewBtn = document.getElementById('review-btn');

    // --- State Variables ---
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval;
    let timeLeft = 0;
    let selectedOption = null;
    let quizStartTime;
    let selectedSubject = '';
    let selectedTopic = '';
    let totalQuestionsInQuiz = 0;
    let answerVerified = false;
    const DEFAULT_NUM_QUESTIONS = 100; // Default number of questions if not specified
    const TIME_PER_QUESTION = 60; // Seconds per question

    // --- Data Check ---
    if (typeof allQuizData === 'undefined' || Object.keys(allQuizData).length === 0) {
        console.error("Error: allQuizData is not defined or empty.");
        subjectGrid.innerHTML = '<p style="color: red;">Error loading subject data!</p>';
        return;
    }

    // --- Setup: Subject and Topic Selection ---
    function displaySubjects() {
        subjectGrid.innerHTML = ''; // Clear previous content
        topicSelectionArea.classList.add('hidden'); // Hide topics
        subjectSelectionArea.classList.remove('hidden'); // Show subjects
        quizSettingsArea.classList.add('hidden'); // Hide settings initially
        bestScoreDisplay.textContent = ''; // Clear score display
        startQuizBtn.disabled = true; // Disable start button

        const subjects = Object.keys(allQuizData).sort();
        subjects.forEach(subject => {
            const subjectButton = document.createElement('button');
            subjectButton.className = 'subject-item';
            subjectButton.textContent = subject;
            subjectButton.dataset.subject = subject; // Store subject name in data attribute
            subjectButton.addEventListener('click', () => handleSubjectSelect(subject));
            subjectButton.setAttribute('aria-label', `Select subject: ${subject}`);
            subjectGrid.appendChild(subjectButton);
        });

        // Ensure setup area is visible and others are hidden
        setupArea.classList.remove('hidden');
        quizArea.classList.add('hidden');
        resultsArea.classList.add('hidden');
    }

    function handleSubjectSelect(subjectName) {
        selectedSubject = subjectName;
        selectedSubjectNameSpan.textContent = subjectName; // Update topic area header
        displayTopics(subjectName);

        // Visual updates
        subjectSelectionArea.classList.add('hidden'); // Hide subjects
        topicSelectionArea.classList.remove('hidden'); // Show topics
        quizSettingsArea.classList.add('hidden'); // Keep settings hidden until topic selected
    }

    function displayTopics(subjectName) {
        topicList.innerHTML = ''; // Clear previous topics
        bestScoreDisplay.textContent = 'Select a topic to start a quiz.';

        const topics = Object.keys(allQuizData[subjectName]).sort();
        if (topics.length === 0) {
            topicList.innerHTML = '<li>No topics found for this subject.</li>';
            return;
        }

        topics.forEach(topic => {
            const topicItem = document.createElement('li');
            topicItem.className = 'topic-item';
            topicItem.textContent = topic;
            topicItem.dataset.topic = topic; // Store topic name

            // Add span for score, initially hidden or empty
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'topic-score';
            const bestScore = getBestScore(selectedSubject, topic);
            scoreSpan.textContent = bestScore !== null ? `Best: ${bestScore}%` : 'New';
            topicItem.appendChild(scoreSpan);

            // Event listener to select topic
            topicItem.addEventListener('click', () => {
                // Remove selected class from all topics
                document.querySelectorAll('.topic-item').forEach(item => {
                    item.classList.remove('selected-topic');
                });
                
                // Add selected class to clicked topic
                topicItem.classList.add('selected-topic');
                
                selectedTopic = topic;
                bestScoreDisplay.textContent = `Selected: ${topic} ${bestScore !== null ? `(Best score: ${bestScore}%)` : '(New topic)'}`;
                quizSettingsArea.classList.remove('hidden');
                startQuizBtn.disabled = false;
                startQuizBtn.focus();
            });

            topicList.appendChild(topicItem);
        });
        
        // Add focus capability to list items for accessibility
        Array.from(topicList.children).forEach(item => item.setAttribute('tabindex', '0'));
    }

    function goBackToSubjects() {
        topicSelectionArea.classList.add('hidden');
        subjectSelectionArea.classList.remove('hidden');
        quizSettingsArea.classList.add('hidden');
        bestScoreDisplay.textContent = ''; // Clear score display
        selectedSubject = ''; // Reset selected subject
        selectedTopic = ''; // Reset selected topic
    }

    // --- Quiz Logic ---
    function startQuiz() {
        if (!selectedSubject || !selectedTopic) {
            alert("Please select both a subject and topic before starting the quiz.");
            return;
        }

        const topicQuestions = allQuizData[selectedSubject]?.[selectedTopic];
        if (!topicQuestions || topicQuestions.length === 0) {
            alert("No questions found for this topic.");
            goBackToSubjects(); // Go back if no questions
            return;
        }

        // Shuffle and select questions
        const shuffledQuestions = [...topicQuestions].sort(() => 0.5 - Math.random());
        
        // Use either all questions or DEFAULT_NUM_QUESTIONS, whichever is smaller
        totalQuestionsInQuiz = Math.min(shuffledQuestions.length, DEFAULT_NUM_QUESTIONS);
        currentQuestions = shuffledQuestions.slice(0, totalQuestionsInQuiz);

        // Reset quiz state
        currentQuestionIndex = 0;
        score = 0;
        timeLeft = totalQuestionsInQuiz * TIME_PER_QUESTION;
        quizStartTime = Date.now();
        answerVerified = false;

        // Update UI: Hide setup, show quiz
        setupArea.classList.add('hidden');
        resultsArea.classList.add('hidden');
        quizArea.classList.remove('hidden');
        quizArea.classList.add('fade-in-section'); // Apply animation

        quizInfoSubject.textContent = selectedSubject;
        quizInfoTopic.textContent = selectedTopic;
        currentQuestionNumDisplay.textContent = "1";
        totalQuestionsDisplay.textContent = totalQuestionsInQuiz;
        updateScoreDisplay(); // Initial score display

        // Initialize quiz elements
        nextBtn.disabled = true;
        nextBtn.classList.add('disabled');

        startTimer();
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex >= currentQuestions.length) {
            endQuiz(); 
            return;
        }
        
        const questionData = currentQuestions[currentQuestionIndex];
        selectedOption = null;
        answerVerified = false;
        
        // Update display elements
        questionNumberDisplay.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestionsInQuiz}`;
        currentQuestionNumDisplay.textContent = (currentQuestionIndex + 1).toString();
        questionTextDisplay.textContent = questionData.question;
        optionsList.innerHTML = '';
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = 'feedback-message'; // Reset class
        
        // Disable next button until answer is selected
        nextBtn.disabled = true;
        nextBtn.classList.add('disabled');

        // Shuffle options
        const displayOptions = [...questionData.options].sort(() => 0.5 - Math.random());
        displayOptions.forEach(optionText => {
            const li = document.createElement('li');
            li.textContent = optionText;
            li.setAttribute('tabindex', '0');
            li.addEventListener('click', handleOptionSelect);
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent space bar scrolling
                    handleOptionSelect({ target: li }); // Simulate click
                }
            });
            optionsList.appendChild(li);
        });
        
        updateProgressBar();
    }

    function handleOptionSelect(event) {
        if (answerVerified) return; // Prevent selecting another option after verification
        
        const previouslySelected = optionsList.querySelector('.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
            previouslySelected.removeAttribute('aria-checked');
        }
        
        selectedOption = event.target;
        selectedOption.classList.add('selected');
        selectedOption.setAttribute('aria-checked', 'true');
        
        // Auto-verify answer immediately after selection
        verifyAnswer();
    }

    function verifyAnswer() {
        if (!selectedOption || answerVerified) return;
        
        const questionData = currentQuestions[currentQuestionIndex];
        const selectedAnswer = selectedOption.textContent;
        const correctAnswer = questionData.answer;
        
        // Disable options visually and functionally
        optionsList.querySelectorAll('li').forEach(li => {
            li.removeEventListener('click', handleOptionSelect);
            li.removeEventListener('keydown', (e) => {});
            li.classList.add('disabled');
            
            // Mark correct answers and incorrect selections
            if (li.textContent === correctAnswer) {
                li.classList.add('correct');
            } else if (li === selectedOption && li.textContent !== correctAnswer) {
                li.classList.add('incorrect');
            }
        });
        
        // Update feedback and score
        feedbackDisplay.classList.add('visible');
        if (selectedAnswer === correctAnswer) {
            score++;
            feedbackDisplay.textContent = "Correct!";
            feedbackDisplay.className = 'feedback-message correct visible';
        } else {
            feedbackDisplay.textContent = `Incorrect. Correct answer: ${correctAnswer}`;
            feedbackDisplay.className = 'feedback-message incorrect visible';
        }
        
        updateScoreDisplay();
        answerVerified = true;
        
        // Enable next button
        nextBtn.disabled = false;
        nextBtn.classList.remove('disabled');
        nextBtn.focus(); // Focus next button for accessibility
    }

    function nextQuestion() {
        if (!answerVerified) {
            // If no answer was selected, treat as skipped
            feedbackDisplay.textContent = "Question skipped.";
            feedbackDisplay.className = 'feedback-message visible';
        }
        
        currentQuestionIndex++;
        displayQuestion();
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `${score} / ${totalQuestionsInQuiz}`;
    }

    function updateProgressBar() {
        const progress = totalQuestionsInQuiz > 0 
            ? Math.round(((currentQuestionIndex) / totalQuestionsInQuiz) * 100) 
            : 0;
        
        progressBar.style.width = `${progress}%`;
        progressBarContainer.setAttribute('aria-valuenow', progress);
    }

    function startTimer() {
        clearInterval(timerInterval);
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                feedbackDisplay.textContent = "Time's up!";
                feedbackDisplay.className = 'feedback-message incorrect visible';
                endQuiz(true);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.querySelector('span').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- End Quiz & Results ---
    function endQuiz(timeUp = false) {
        clearInterval(timerInterval);
        const endTime = Date.now();
        const timeElapsed = Math.round((endTime - quizStartTime) / 1000);
        const accuracy = totalQuestionsInQuiz > 0 
            ? Math.round((score / totalQuestionsInQuiz) * 100) 
            : 0;

        // Update result displays
        percentScoreDisplay.textContent = `${accuracy}%`;
        finalScoreDisplay.textContent = `${score} out of ${totalQuestionsInQuiz}`;
        
        if (timeUp) { 
            timeTakenDisplay.textContent = "Time Ran Out!"; 
        } else { 
            const min = Math.floor(timeElapsed / 60); 
            const sec = timeElapsed % 60; 
            timeTakenDisplay.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; 
        }
        
        accuracyDisplay.textContent = `${accuracy}%`;

        // Update and display best score
        updateBestScore(selectedSubject, selectedTopic, accuracy);
        const bestScore = getBestScore(selectedSubject, selectedTopic);
        finalBestScoreDisplay.textContent = bestScore !== null 
            ? `${bestScore}%` 
            : 'First attempt!';

        // Switch views with animation
        quizArea.classList.add('hidden');
        quizArea.classList.remove('fade-in-section');
        resultsArea.classList.remove('hidden');
        resultsArea.classList.add('fade-in-section');
    }

    function restartQuiz() {
        resultsArea.classList.add('hidden');
        resultsArea.classList.remove('fade-in-section');
        startQuiz(); // Start again with same subject/topic
    }

    function goToNewQuiz() {
        resultsArea.classList.add('hidden');
        resultsArea.classList.remove('fade-in-section');
        setupArea.classList.remove('hidden');
        // Reset selections and display subjects
        selectedSubject = '';
        selectedTopic = '';
        displaySubjects();
    }

    // --- Local Storage for Best Scores ---
    function getLocalStorageKey(subject, topic) { 
        return `mcqBestScore_${subject}_${topic}`; 
    }
    
    function getBestScore(subject, topic) { 
        const key = getLocalStorageKey(subject, topic); 
        const storedScore = localStorage.getItem(key); 
        return storedScore ? parseInt(storedScore, 10) : null; 
    }
    
    function updateBestScore(subject, topic, currentAccuracy) {
        const key = getLocalStorageKey(subject, topic);
        const bestScore = getBestScore(subject, topic);
        if (bestScore === null || currentAccuracy > bestScore) {
            localStorage.setItem(key, currentAccuracy.toString());
        }
    }

    // --- Event Listeners ---
    backToSubjectsBtn.addEventListener('click', goBackToSubjects);
    startQuizBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    exitQuizBtn.addEventListener('click', goToNewQuiz);
    restartBtn.addEventListener('click', restartQuiz);
    newQuizBtn.addEventListener('click', goToNewQuiz);
    reviewBtn.addEventListener('click', () => {
        // Placeholder for review functionality
        alert("Review functionality will be implemented in a future update.");
    });

    // Support keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('hidden')) {
            e.preventDefault();
            nextBtn.click();
        }
    });

    // --- Initial Load ---
    displaySubjects(); // Start by showing the subject grid
});
