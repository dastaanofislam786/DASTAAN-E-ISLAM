// =========================================
// QUIZ LOGIC (quiz.js)
// =========================================

let quizData = [];
let currentQuestionIndex = 0;
let score = 0;

// 1. क्विज़ स्टार्ट करने का फंक्शन
async function startQuiz(chapterId) {
    try {
        const response = await fetch('data/quiz_questions.json');
        const data = await response.json();

        if (data[chapterId]) {
            quizData = data[chapterId];
            currentQuestionIndex = 0;
            score = 0;

            // क्विज़ स्क्रीन दिखाएं
            const quizScreen = document.getElementById('quiz-screen');
            quizScreen.classList.remove('hidden');
            quizScreen.classList.add('active', 'slide-up');
            
            // 🔥 ये लाइन सबसे ज़रूरी है (वाइट स्क्रीन फिक्स)
            quizScreen.style.display = 'flex'; 

            loadQuestion();
        }
    } catch (error) {
        console.error("Quiz load error:", error);
    }
}


// 2. सवाल और ऑप्शंस लोड करने का फंक्शन
function loadQuestion() {
    const currentQ = quizData[currentQuestionIndex];
    const lang = localStorage.getItem('userLanguage') || 'ur';

    // सवाल सेट करें
    document.getElementById('quiz-question').innerText = currentQ.question[lang];

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = ''; // पुराने ऑप्शंस साफ़ करें

    // 'Aage Badhein' बटन को अभी छुपा दें
    document.getElementById('quiz-next-container').classList.add('hidden');

    // प्रोग्रेस बार सेट करें
    const progress = ((currentQuestionIndex) / quizData.length) * 100;
    document.getElementById('quiz-progress').style.width = progress + '%';

    // ऑप्शंस बनाएं
    currentQ.options[lang].forEach((optionText, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn', 'pop-in');
        btn.innerText = optionText;
        
        // क्लिक करने पर जवाब चेक करें
        btn.onclick = () => checkAnswer(index, currentQ.correctIndex, btn);
        
        optionsContainer.appendChild(btn);
    });
}

// 3. जवाब चेक करने का फंक्शन (एनर्जी और एक्सपी लॉजिक के साथ)
function checkAnswer(selectedIndex, correctIndex, selectedBtn) {
    const allOptions = document.querySelectorAll('.option-btn');
    
    // सारे बटन्स को डिसेबल कर दें ताकि यूज़र दोबारा क्लिक ना कर पाए
    allOptions.forEach(btn => btn.classList.add('disabled'));

    if (selectedIndex === correctIndex) {
        // --- सही जवाब ---
        selectedBtn.classList.add('correct');
        document.getElementById('correctSound').currentTime = 0;
        document.getElementById('correctSound').play().catch(e=>e);
        score++;
        
        // 🔥 यूज़र को 2 XP पॉइंट्स इनाम दें
        if (typeof addXP === 'function') {
            addXP(2);
        }
    } else {
        // --- गलत जवाब ---
        selectedBtn.classList.add('wrong');
        document.getElementById('wrongSound').currentTime = 0;
        document.getElementById('wrongSound').play().catch(e=>e);
        
        // सही वाले को हाईलाइट कर दें
        allOptions[correctIndex].classList.add('correct');
        
        // 🔥 यूज़र की 1 एनर्जी कम करें
        if (typeof reduceEnergy === 'function') {
            reduceEnergy(1);
        }
    }

    // 'Aage Badhein'... बटन दिखाएं
    const nextBtnContainer = document.getElementById('quiz-next-container');
    nextBtnContainer.classList.remove('hidden');
    nextBtnContainer.classList.add('fade-in');
}


// 4. अगले सवाल पर जाने का फंक्शन
function nextQuizQuestion() {
    // Tap Sound
    document.getElementById('tapSound').currentTime = 0;
    document.getElementById('tapSound').play().catch(e=>e);

    currentQuestionIndex++;

    if (currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

// 5. क्विज़ खत्म होने पर (शानदार रिजल्ट स्क्रीन)
function finishQuiz() {
    // प्रोग्रेस बार को 100% कर दें
    document.getElementById('quiz-progress').style.width = '100%';
    
    // COMPLETE साउंड प्ले करें
    document.getElementById('correctSound').currentTime = 0;
    document.getElementById('correctSound').play().catch(e=>e);

    // 🔥 नया लॉजिक: क्विज़ पूरा करने पर 2 जेम्स इनाम दें
    userGems += 2;
    localStorage.setItem('userGems', userGems);
    
    // UI अपडेट करने के लिए अगर main.js का फंक्शन मौजूद है
    if (typeof updateStatsUI === 'function') {
        updateStatsUI();
    }

    // क्विज़ स्क्रीन छुपाएं
    const quizScreen = document.getElementById('quiz-screen');
    quizScreen.classList.add('hidden');
    quizScreen.classList.remove('active');
    quizScreen.style.display = 'none'; 
    
    // रिजल्ट स्क्रीन दिखाएं
    const resultScreen = document.getElementById('result-screen');
    resultScreen.classList.remove('hidden');
    resultScreen.classList.add('active'); 
    resultScreen.style.display = 'flex'; 

    // स्कोर के हिसाब से मैसेज सेट करें
    document.getElementById('score-text').innerText = `Your score: ${score} / ${quizData.length}`;
    
    // 🔥 रिज़ल्ट स्क्रीन पर इनाम (Gems और XP) दिखाएं
    const earnedXP = score * 2; // हर सही जवाब के 2 XP
    document.getElementById('result-gems').innerText = `+2`;
    document.getElementById('result-xp').innerText = `+${earnedXP} XP`;

    // स्टार्स कैलकुलेशन
    let starsHTML = '';
    let percentage = (score / quizData.length) * 100;

    if (percentage === 100) {
        starsHTML = '⭐⭐⭐';
        document.getElementById('result-title').innerText = 'Masha Allah! 🎊🎊';
        document.getElementById('result-message').innerText = 'Excellent! You answered all the questions correctly.';
    } else if (percentage >= 50) {
        starsHTML = '⭐⭐✰';
        document.getElementById('result-title').innerText = 'Very Good! 🎊';
        document.getElementById('result-message').innerText = 'Keep learning. With a little more effort, you can achieve full marks.';
    } else {
        starsHTML = '⭐✰✰';
        document.getElementById('result-title').innerText = 'Keep Learning!';
        document.getElementById('result-message').innerText = 'Please review this lesson carefully and try again.';
    }

    // 🔥 स्टार्स को स्क्रीन पर दिखाएं (जो पहले वाले कोड में छूट गया था)
    const starContainer = document.getElementById('star-container');
    if(starContainer) {
        starContainer.innerHTML = starsHTML;
    }
}


// 6. होम पर लौटने का फंक्शन (UI फिक्स और स्मार्ट अनलॉक के साथ)
function returnToHome() {
   document.getElementById('main-nav').style.display = 'flex';
    // टैप साउंड प्ले करें
    document.getElementById('tapSound').currentTime = 0;
    document.getElementById('tapSound').play().catch(e=>e);

    // --- भाग 1: स्मार्ट अनलॉक लॉजिक (इसे वापस जोड़ दिया है) ---
    let percentage = (score / quizData.length) * 100;
    
    // अगर यूज़र ने कम से कम 50% स्कोर किया है
    if (percentage >= 50) {
        let unlocked = JSON.parse(localStorage.getItem('unlockedChapters')) || ['chapter1'];
        
        if (typeof activeChapterId !== 'undefined' && activeChapterId.startsWith('chapter')) {
            // वर्तमान चैप्टर का नंबर निकालें (जैसे 'chapter1' से 1)
            let currentNum = parseInt(activeChapterId.replace('chapter', ''));
            let nextChapterId = 'chapter' + (currentNum + 1); // अगला चैप्टर आईडी (जैसे 'chapter2')
            
            // अगर अगला चैप्टर पहले से अनलॉक नहीं है, तो उसे लिस्ट में जोड़ें
            if (!unlocked.includes(nextChapterId)) {
                unlocked.push(nextChapterId);
                localStorage.setItem('unlockedChapters', JSON.stringify(unlocked));
            }
        }
    }

    // --- भाग 2: स्क्रीन ट्रांज़िशन (वाइट स्क्रीन फिक्स के साथ) ---
    
    // 1. रिजल्ट स्क्रीन को पूरी तरह छुपाएं
    const resultScreen = document.getElementById('result-screen');
    resultScreen.classList.add('hidden');
    resultScreen.classList.remove('active');
    resultScreen.style.display = 'none';

    // 2. मेन ऐप (होम स्क्रीन) को वापस दिखाएं
      
          // quiz.js के returnToHome() के अंदर ये लाइन बदलें:
    // const mainApp = document.getElementById('main-app'); -> इसे हटाएँ
    const mapScreen = document.getElementById('lesson-map-screen');
    mapScreen.style.display = 'flex'; 
    mapScreen.classList.remove('hidden');

      
    //mainApp.classList.add('active', 'fade-in');

    // 3. मैप को तुरंत अपडेट करें ताकि नया सबक ताला खुला हुआ (Active) दिखे
    if (typeof updateMapUI === "function") {
        updateMapUI();
    }
}
