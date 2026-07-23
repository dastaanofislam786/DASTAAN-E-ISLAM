// Safe data save karne ke liye function
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error("Storage save error:", e);
    }
}

// Safe data read karne ke liye function
function safeGetItem(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.error("Storage read error:", e);
        return defaultValue;
    }
}











// =========================================
// 1. APP INITIALIZATION, SPLASH SCREEN & LANGUAGE 
// =========================================

window.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const splashImage = document.getElementById('splash-image');
    
    // 👉 यहाँ सही कीवर्ड 'userLanguage' का इस्तेमाल किया है
    let savedLang = localStorage.getItem('userLanguage'); 

    // भाषा के हिसाब से इमेज बदलें
if (splashImage) {

    if (savedLang === 'ur') {
        splashImage.src = 'assets/images/OPEN-IMAGE-UR.webp';
    } else if (savedLang === 'hi') {
        splashImage.src = 'assets/images/OPEN-IMAGE-HI.webp';
    } else {
        splashImage.src = 'assets/images/OPEN-IMAGE-EN.webp';
    }

}
    

    // 4 सेकंड बाद स्प्लैश स्क्रीन को हटा दें
    setTimeout(() => {
        if(splashScreen) {
            splashScreen.classList.add('splash-hidden');
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }
    }, 4000); 
});






// =========================================
// GLOBAL STATE: ENERGY, XP, GEMS, STREAK & ACHIEVEMENTS
// =========================================
let userEnergy = parseInt(safeGetItem('userEnergy', 10));
let userXP = parseInt(safeGetItem('userXP', 0));
let userGems = parseInt(safeGetItem('userGems', 0));
let userStreak = parseInt(safeGetItem('userStreak', 0));
let streakFreezers = parseInt(safeGetItem('streakFreezers', 0));

// Download Manager
let downloadedChapters =
JSON.parse(localStorage.getItem("downloadedChapters")) || [];

// 👇 ये तीन लाइनें पिछले कोड में गलती से डिलीट हो गई थीं, इन्हें वापस जोड़ दिया है!
let lastActiveDate = safeGetItem('lastActiveDate', null);
let streakFrozen = safeGetItem('streakFrozen', 'false') === 'true';
let totalLessonsDone = parseInt(safeGetItem('totalLessonsDone', 0));

// एनर्जी भरने का समय
const REFILL_PATTERN = [2, 2, 2, 3, 3, 3, 5, 5, 5]; 
let refillIndex = parseInt(safeGetItem('refillIndex', 0));
let lastEnergyUpdateTime = parseInt(safeGetItem('lastEnergyUpdateTime', 0));


// Default values set karna agar localStorage khali ho
if (localStorage.getItem('userEnergy') === null) localStorage.setItem('userEnergy', 10);
if (localStorage.getItem('userXP') === null) localStorage.setItem('userXP', 0);

// 1. स्मार्ट UI अपडेट फंक्शन (पुरानी IDs और नई Classes दोनों को सपोर्ट करता है ताकि UI न टूटे)
function updateStatsUI() {
    // New Class-based UI Updates
    document.querySelectorAll('.top-energy-text').forEach(el => el.innerText = userEnergy);
    document.querySelectorAll('.top-xp-text').forEach(el => el.innerText = userXP);
    document.querySelectorAll('.top-gems-text').forEach(el => el.innerText = userGems);
    document.querySelectorAll('.top-streak-text').forEach(el => el.innerText = userStreak);
    
    // Old ID-based UI Updates (Backwards Compatibility ke liye)
    if (document.getElementById('top-energy')) document.getElementById('top-energy').innerText = userEnergy;
    if (document.getElementById('chapters-energy')) document.getElementById('chapters-energy').innerText = userEnergy;
    if (document.getElementById('map-energy')) document.getElementById('map-energy').innerText = userEnergy;
    if (document.getElementById('top-xp')) document.getElementById('top-xp').innerText = userXP;
    if (document.getElementById('chapters-xp')) document.getElementById('chapters-xp').innerText = userXP;
    if (document.getElementById('map-xp')) document.getElementById('map-xp').innerText = userXP;

    // स्ट्रीक का आइकन (फ्रीज़ या फायर)
    const streakSymbol = streakFrozen ? "♨️" : "🔥";
    document.querySelectorAll('.top-streak-icon').forEach(el => el.innerText = streakSymbol);
    
    if (document.getElementById('modal-energy-count')) {
        document.getElementById('modal-energy-count').innerText = userEnergy;
    }
}

// 2. एनर्जी कम करना (और टाइमर शुरू करना)
function reduceEnergy(amount = 1) {
    if (userEnergy === 10) {
        // जैसे ही एनर्जी 10 से कम हो, टाइमर चालू कर दें
        lastEnergyUpdateTime = Date.now();
        refillIndex = 0;
        localStorage.setItem('lastEnergyUpdateTime', lastEnergyUpdateTime);
        localStorage.setItem('refillIndex', refillIndex);
    }
    
    userEnergy = Math.max(0, userEnergy - amount);
    safeSetItem('userEnergy', userEnergy);

    updateStatsUI();
    
    if (userEnergy === 0) {
        if (typeof showToast === 'function') {
            showToast("⚡ Energy depleted. Rest a moment while it refills.");
        }
    }
}

// XP बढ़ाने का फंक्शन
function addXP(amount) {
    userXP += amount;
    localStorage.setItem('userXP', userXP);
    updateStatsUI();
}

// 3. रोज़ाना ऐप खोलने पर स्ट्रीक चेक करना (Freeze Logic)
function checkDailyStreakStatus() {
    const today = new Date().toDateString();
    
    // (यहाँ से let lastActiveDate हटा दिया है, क्योंकि अब यह ऊपर मौजूद है)
    if (lastActiveDate && lastActiveDate !== today) {
        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate.setHours(0,0,0,0) - lastDate.setHours(0,0,0,0));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            streakFrozen = false; 
        } else if (diffDays === 2) {
            streakFrozen = true; 
        } else if (diffDays > 2) {
            userStreak = 0; 
            streakFrozen = false;
        }
        
        safeSetItem('userStreak', userStreak);
        safeSetItem('streakFrozen', streakFrozen);
    }
    updateStatsUI();
}



// 4. सबक खत्म होने पर इनाम और स्ट्रीक बढ़ाना
function processRewardsOnLessonComplete() {
    const today = new Date().toDateString();
    
    // स्ट्रीक लॉजिक
    if (lastActiveDate !== today) {
        userStreak++; 
        streakFrozen = false; 
        lastActiveDate = today;
        
        localStorage.setItem('userStreak', userStreak);
        localStorage.setItem('lastActiveDate', lastActiveDate);
        localStorage.setItem('streakFrozen', streakFrozen);
    }

    // 🔥 +2 जेम्स (लेसन पूरा करने पर 10 की जगह 2 कर दिया)
    const unlockedLessons = JSON.parse(localStorage.getItem('unlockedChapters')) || ['chapter1'];
    if (!unlockedLessons.includes(activeChapterId)) {
        userGems += 2;
        localStorage.setItem('userGems', userGems);
    }

    totalLessonsDone++;
    localStorage.setItem('totalLessonsDone', totalLessonsDone);

    checkAchievements(); 
    updateStatsUI(); 
}


// =========================================
// OFFLINE & ONLINE TIMER LOGIC
// =========================================

// 5. यह फंक्शन ऐप बंद होने पर बीते हुए समय का हिसाब लगाता है
function processOfflineEnergy() {
    if (userEnergy >= 10) return;
    
    let now = Date.now();
    let madeChanges = false;

    while (userEnergy < 10) {
        let currentPatternIndex = Math.min(refillIndex, REFILL_PATTERN.length - 1);
        let currentRefillDurationMs = REFILL_PATTERN[currentPatternIndex] * 60 * 1000;
        
        let timePassed = now - lastEnergyUpdateTime;

        if (timePassed >= currentRefillDurationMs) {
            userEnergy++;
            lastEnergyUpdateTime += currentRefillDurationMs; 
            refillIndex++;
            madeChanges = true;
            
            if (userEnergy >= 10) {
                refillIndex = 0; 
                break;
            }
        } else {
            break; 
        }
    }

    if (madeChanges) {
        safeSetItem('userEnergy', userEnergy);

        localStorage.setItem('lastEnergyUpdateTime', lastEnergyUpdateTime);
        localStorage.setItem('refillIndex', refillIndex);
        updateStatsUI();
    }
}

// 6. हर 1 सेकंड में टाइमर को चेक करें और स्क्रीन पर दिखाएं
setInterval(() => {
    if (userEnergy < 10) {
        processOfflineEnergy(); 
        updateEnergyModalTimer(); 
    } else {
        const timerDisplay = document.getElementById('energy-timer-display');
        if (timerDisplay && timerDisplay.innerText !== "⚡ Energy Fully Recharged!️") {
            timerDisplay.innerText = "⚡ Energy Fully Recharged!";
        }
    }
}, 1000);

// 7. अचीवमेंट्स (Achievements) चेक करने का लॉजिक (Missing Function)

function checkAchievements() {
    // 🏆 अचीवमेंट्स की लिस्ट (तुम इसमें और भी जोड़ सकते हो)
    const achievementsList = [
        { id: 'streak_3', type: 'streak', req: 3, title: '🔥 3 Day Streak', gems: 10 },
        { id: 'streak_5', type: 'streak', req: 5, title: '🔥 5 Day Streak', gems: 20 },
        { id: 'streak_10', type: 'streak', req: 10, title: '🔥 10 Day Streak', gems: 50 },
        { id: 'lesson_5', type: 'lesson', req: 5, title: '📚 5 Lessons Done', gems: 15 },
        { id: 'lesson_10', type: 'lesson', req: 10, title: '📚 10 Lessons Done', gems: 30 },
        { id: 'lesson_15', type: 'lesson', req: 15, title: '📚 15 Lessons Done', gems: 50 }
    ];

    // लोकल स्टोरेज से अनलॉक किए गए अचीवमेंट्स निकालें
    let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];
    let newlyUnlocked = false;

    // हर अचीवमेंट को चेक करें
    achievementsList.forEach(ach => {
        // अगर यह अचीवमेंट पहले से अनलॉक नहीं है
        if (!unlockedAchievements.includes(ach.id)) {
            let conditionMet = false;

            // स्ट्रीक चेक
            if (ach.type === 'streak' && userStreak >= ach.req) {
                conditionMet = true;
            }
            // लेसन चेक
            if (ach.type === 'lesson' && totalLessonsDone >= ach.req) {
                conditionMet = true;
            }

            // अगर शर्त पूरी हो गई
            if (conditionMet) {
                unlockedAchievements.push(ach.id); // लिस्ट में जोड़ें
                userGems += ach.gems; // इनाम दें
                newlyUnlocked = true;
                
                // यूज़र को अलर्ट या टोस्ट दिखाएं (इसे इंग्लिश में रखा है)
                showToast(`🏆 Achievement Unlocked: ${ach.title}! (+${ach.gems} 💎)`);
            }
        }
    });

    // अगर कोई नया अचीवमेंट खुला है, तो डेटा सेव करें और UI अपडेट करें
    if (newlyUnlocked) {
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
        localStorage.setItem('userGems', userGems);
        if (typeof updateStatsUI === 'function') {
            updateStatsUI();
        }
    }
}


// =========================================
// MODALS (ENERGY & ACHIEVEMENTS) OPEN/CLOSE
// =========================================

// एनर्जी मोडल फंक्शन्स
function openEnergyModal() {
    if(typeof playSound === 'function') playSound('tapSound');
    document.getElementById('energy-modal').style.display = 'flex';
    document.getElementById('energy-modal').classList.remove('hidden');
    updateEnergyModalTimer(); 
}

function closeEnergyModal() {
    if(typeof playSound === 'function') playSound('tapSound');
    document.getElementById('energy-modal').style.display = 'none';
    document.getElementById('energy-modal').classList.add('hidden');
}

// मोडल के अंदर काउंटडाउन टाइमर (MM:SS) दिखाना
function updateEnergyModalTimer() {
    const timerDisplay = document.getElementById('energy-timer-display');
    if (!timerDisplay) return;

    if (userEnergy >= 10) {
        timerDisplay.innerText = "Your Energy is Full! ⚡";
        return;
    }

    let now = Date.now();
    let currentPatternIndex = Math.min(refillIndex, REFILL_PATTERN.length - 1);
    let currentRefillDurationMs = REFILL_PATTERN[currentPatternIndex] * 60 * 1000;
    
    let timePassed = now - lastEnergyUpdateTime;
    let timeLeftMs = currentRefillDurationMs - timePassed;

    if (timeLeftMs < 0) timeLeftMs = 0;

    let minutes = Math.floor(timeLeftMs / (1000 * 60));
    let seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    seconds = seconds < 10 ? '0' + seconds : seconds;
    timerDisplay.innerText = `Next Energy In: ${minutes}:${seconds}`;
}

// 7. अचीवमेंट्स (Achievements) चेक करने का लॉजिक
// =========================================
// ACHIEVEMENTS LOGIC (Dynamic)
// =========================================

// 1. ग्लोबल अचीवमेंट्स लिस्ट (कोई भी नया अचीवमेंट बस यहाँ जोड़ना है)
const achievementsList = [
    { id: 'streak_3', type: 'streak', req: 3, title: '3 Day Streak', desc: 'Read lessons for 3 consecutive days', gems: 10, icon: '🔥' },
    { id: 'streak_5', type: 'streak', req: 5, title: '5 Day Streak', desc: 'Read lessons for 5 consecutive days', gems: 20, icon: '🔥' },
    { id: 'streak_10', type: 'streak', req: 10, title: '10 Day Streak', desc: 'Read lessons for 10 consecutive days', gems: 50, icon: '🔥' },
    { id: 'lesson_5', type: 'lesson', req: 5, title: '5 Lessons', desc: 'Complete 5 lessons', gems: 15, icon: '📖' },
    { id: 'lesson_10', type: 'lesson', req: 10, title: '10 Lessons', desc: 'Complete 10 lessons', gems: 30, icon: '📖' },
    { id: 'lesson_15', type: 'lesson', req: 15, title: '15 Lessons', desc: 'Complete 15 lessons', gems: 50, icon: '📖' }
];

// 2. बैकग्राउंड में अचीवमेंट चेक करना
function checkAchievements() {
    let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];
    let newlyUnlocked = false;

    achievementsList.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id)) {
            let conditionMet = false;
            if (ach.type === 'streak' && userStreak >= ach.req) conditionMet = true;
            if (ach.type === 'lesson' && totalLessonsDone >= ach.req) conditionMet = true;

            if (conditionMet) {
                unlockedAchievements.push(ach.id);
                userGems += ach.gems;
                newlyUnlocked = true;
                
                showToast(`🏆 Achievement Unlocked: ${ach.title}! (+${ach.gems} 💎)`);
            }
        }
    });

    if (newlyUnlocked) {
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
        localStorage.setItem('userGems', userGems);
        if (typeof updateStatsUI === 'function') updateStatsUI();
    }
}

// 3. अचीवमेंट मोडल विंडो खोलना (अब यह ऑटोमैटिक HTML बनाएगा)
function openAchievements() {
    if(typeof playSound === 'function') playSound('tapSound');
    
    const modalContainer = document.getElementById('achievements-list-container');
    if (modalContainer) {
        modalContainer.innerHTML = ''; // पुराना डेटा साफ करें
        let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];

        achievementsList.forEach(ach => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            
            // अनलॉक होने या न होने पर कैसा दिखेगा, उसकी सेटिंग:
            const filterStyle = isUnlocked ? 'grayscale(0%)' : 'grayscale(100%)';
            const bgStyle = isUnlocked ? '#F1F8E9' : '#f5f5f5';
            const borderStyle = isUnlocked ? '2px solid #4CAF50' : '2px solid #ddd';
            const iconBg = isUnlocked ? (ach.type === 'streak' ? '#FFE0B2' : '#C8E6C9') : '#ddd';

            const html = `
                <div style="display: flex; align-items: center; gap: 15px; background: ${bgStyle}; padding: 12px; border-radius: 15px; margin-bottom: 15px; border: ${borderStyle}; filter: ${filterStyle}; transition: 0.3s;">
                    <div style="width: 60px; height: 60px; background: ${iconBg}; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.8rem;">${ach.icon}</div>
                    <div style="text-align: left;">
                        <h3 style="margin: 0; color: #333; font-size: 1.05rem;">${ach.icon} ${ach.title}</h3>
                        <p style="margin: 3px 0 0 0; font-size: 0.8rem; color: #666;">${ach.desc}</p>
                        <p style="margin: 3px 0 0 0; font-size: 0.75rem; color: #E65100; font-weight: bold;">Reward: ${ach.gems} 💎</p>
                    </div>
                </div>
            `;
            modalContainer.innerHTML += html;
        });
    }
    
    document.getElementById('achievements-modal').style.display = 'flex';
    document.getElementById('achievements-modal').classList.remove('hidden');
}

function closeAchievements() {
    if(typeof playSound === 'function') playSound('tapSound');
    document.getElementById('achievements-modal').style.display = 'none';
    document.getElementById('achievements-modal').classList.add('hidden');
}











let selectedLanguage = null;

window.onload = () => {
    const savedFontSize = localStorage.getItem('appFontSize');
    if(savedFontSize) changeFontSize(savedFontSize);
  
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang) {
        showMainApp(savedLang);
    } else {
        document.getElementById('language-screen').classList.add('active');
    }
    checkDailyStreakStatus();
    updateMapUI(); 
    updateStatsUI(); // <--- यह लाइन यहाँ जोड़ें
};


function selectLanguage(lang) {
    selectedLanguage = lang;
    const tap = document.getElementById('tapSound');
    tap.currentTime = 0; 
    tap.play().catch(e=>e);

    document.querySelectorAll('.btn-lang').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`btn-${lang}`).classList.add('selected');

    const continueBtn = document.getElementById('continue-btn');
    continueBtn.classList.remove('hidden');
    continueBtn.classList.add('pop-in', 'pulse');
}

function startApp() {
    if (!selectedLanguage) return;
    localStorage.setItem('userLanguage', selectedLanguage);
    
    const startAudio = document.getElementById('startSound');
    startAudio.currentTime = 0;
    startAudio.play().catch(e=>e);
    
    showMainApp(selectedLanguage);
}

function showMainApp(lang) {
    // Language screen ko chhupao
    document.getElementById('language-screen').classList.remove('active');
    document.getElementById('language-screen').style.display = 'none';

    // Main Banner screen ko dikhao
    const mainScreen = document.getElementById('main-app');
    mainScreen.classList.remove('hidden');
    mainScreen.style.display = 'flex'; 
    mainScreen.classList.add('active', 'fade-in');
    
    // 👇 यह नई लाइन जोड़ें (Nav bar दिखाने के लिए)
    document.getElementById('main-nav').style.display = 'flex';

}

// =========================================
// 2. DATA LOADER & SCREEN SWITCHING
// =========================================
let currentChapterData = null;
let currentSlideIndex = 0;
let userLang = 'ur';
let activeChapterId = '';

 async function loadLesson(chapterId) {
    document.getElementById('main-nav').style.display = 'none';
    document.getElementById('tapSound').play().catch(e => e);
    activeChapterId = chapterId;

    const unlockedLessons = JSON.parse(localStorage.getItem('unlockedChapters')) || ['chapter1'];
    const isAlreadyRead = unlockedLessons.includes(chapterId);

    if (!isAlreadyRead && userEnergy <= 0) {
        showToast("You do not have enough Energy to begin this lesson.");
        return;
    }

    // 🔥 नया लॉजिक: अगर नया सबक है तो शुरू होते ही 1 एनर्जी काट लें
    if (!isAlreadyRead) {
        reduceEnergy(1);
    }

    // 1. अब Lesson Map स्क्रीन को छुपाएंगे (Main App को नहीं)
    const mapScreen = document.getElementById('lesson-map-screen');
    mapScreen.style.display = 'none';
    mapScreen.classList.add('hidden');

    try {
        const response = await fetch('data/seerat_text.json');
        const data = await response.json();

        if (data[chapterId]) {
            const lang = localStorage.getItem('userLanguage') || 'ur';
            userLang = lang;

            document.getElementById('intro-image').src = `assets/images/intro_${chapterId}.webp`;
            document.getElementById('intro-text').innerText = data[chapterId].intro[lang];
            
            const labels = { "hi": "लोड हो रहा है...", "ur": "لوڈنگ ہو رہی ہے...", "en": "Loading..." };
            document.getElementById('loading-label').innerText = labels[lang];

            const introScreen = document.getElementById('intro-screen');
            introScreen.style.display = 'flex';
            introScreen.classList.remove('hidden');

            setTimeout(() => {
                introScreen.style.display = 'none';
                introScreen.classList.add('hidden');
                
                currentChapterData = data[chapterId];
                currentSlideIndex = 0;
                
                const lessonScreen = document.getElementById('lesson-screen');
                lessonScreen.style.display = 'flex';
                lessonScreen.classList.remove('hidden');
                lessonScreen.classList.add('active', 'slide-up');

                showSlide();
              //updateDownloadButton();
            }, 3000); 
        }
    } catch (error) {
        console.error("Data load error:", error);
        // अगर एरर आये तो वापस Lesson Map दिखा दें
        mapScreen.style.display = 'flex';
        mapScreen.classList.remove('hidden');
    }
}


// क्रॉस (✖) बटन दबाने पर वापस मैप पर जाना
function closeLesson() {
    document.getElementById('tapSound').play().catch(e=>e);
    
    document.getElementById('lesson-screen').style.display = 'none';
    document.getElementById('lesson-screen').classList.add('hidden');
    
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('quiz-screen').classList.add('hidden');
    
    // वापस Lesson Map दिखाएं
    const mapScreen = document.getElementById('lesson-map-screen');
    mapScreen.style.display = 'flex';
    mapScreen.classList.remove('hidden');
    
    // 👇 यह नई लाइन जोड़ें (Nav bar वापस दिखाने के लिए)
    document.getElementById('main-nav').style.display = 'flex';

    
}

function showSlide() {

    const slide = currentChapterData.slides[currentSlideIndex];

    const slideImage = document.getElementById("slide-image");

    // Agar image cache me hai to turant dikhao
    slideImage.src = slide.image;

    // Next image preload
    const nextSlide = currentChapterData.slides[currentSlideIndex + 1];

    if (nextSlide && nextSlide.image) {

        const img = new Image();
        img.src = nextSlide.image;

    }

    // Previous image bhi memory me rahe
    const prevSlide = currentChapterData.slides[currentSlideIndex - 1];

    if (prevSlide && prevSlide.image) {

        const img = new Image();
        img.src = prevSlide.image;

    }

    // Text
    document.getElementById("slide-text").innerText = slide[userLang];

    // Progress
    const progress =
        ((currentSlideIndex + 1) / currentChapterData.slides.length) * 100;

    document.getElementById("lesson-progress").style.width = progress + "%";

}

function nextSlide() {
    const nextAudio = document.getElementById('nextSound');
    nextAudio.currentTime = 0;
    nextAudio.play().catch(e => e);

    currentSlideIndex++;
    if (currentSlideIndex < currentChapterData.slides.length) {
        showSlide();
    } else {
        const unlockedLessons = JSON.parse(localStorage.getItem('unlockedChapters')) || ['chapter1'];
        if (!unlockedLessons.includes(activeChapterId)) {
            // reduceEnergy(1); <-- इसे यहाँ से हटा दिया गया है
            addXP(10); 
            showToast("✨ MashaAllah! Lesson Completed: +10 XP | +2 Gems 💎"); // टोस्ट में 💎 2 कर दिया
        } else {
            showToast("🎉 Revision Completed!"); // रिवीजन पर जेम्स नहीं मिलेंगे (या देना चाहो तो 2 कर सकते हो)
        }
        
        processRewardsOnLessonComplete();
        lessonComplete();
    }
}


function lessonComplete() {
    const quizAudio = document.getElementById('quizStartSound');
    quizAudio.currentTime = 0;
    quizAudio.play().catch(e => e);
    
    // लेसन स्क्रीन छुपाएं
    const lessonScreen = document.getElementById('lesson-screen');
    lessonScreen.style.display = 'none';
    lessonScreen.classList.add('hidden');
    lessonScreen.classList.remove('active');
    
    // क्विज़ स्टार्ट करें (quiz.js वाला फंक्शन)
    if(typeof startQuiz === 'function') {
        startQuiz(activeChapterId); 
    }
}

// =========================================
// 3. MAP UI UPDATE (Duolingo Style)
// =========================================

// Screen navigation ko control karne ke liye main function
function showChaptersScreen() {
    playSound('tapSound');
    
    // Banner hide karo aur Chapters dikhao
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('main-app').style.display = 'none';

    const chapScreen = document.getElementById('chapters-screen');
    chapScreen.classList.remove('hidden');
    chapScreen.style.display = 'flex';
}

function backToHome() {
    playSound('tapSound');
    
    // Chapters hide karo aur wapas Banner dikhao
    document.getElementById('chapters-screen').classList.add('hidden');
    document.getElementById('chapters-screen').style.display = 'none';

    const mainApp = document.getElementById('main-app');
    mainApp.classList.remove('hidden');
    mainApp.style.display = 'flex';
}

function openLessonMap(unitId) {
    playSound('tapSound');
    
    // अगर यूनिट लॉक है तो कुछ मत करो
    if (unitId === 'unit2' && document.getElementById('chap-banner-2').classList.contains('locked')) {
        return; 
    }
    
    // Chapters list छुपाओ
    document.getElementById('chapters-screen').classList.add('hidden');
    
    // Map screen दिखाओ
    const mapScreen = document.getElementById('lesson-map-screen');
    mapScreen.classList.remove('hidden');
    mapScreen.style.display = 'flex';

    // पहले दोनों मैप छुपा दो (क्लास का इस्तेमाल करके)
    document.getElementById('unit1-nodes').classList.add('hidden');
    document.getElementById('unit2-nodes').classList.add('hidden');

    // जो यूनिट सेलेक्ट किया है, उसका डेटा दिखाओ
    if(unitId === 'unit1') {
        document.getElementById('current-chapter-title').innerText = "Lineage and Family of the Prophet ﷺ(Unit 1)";
        document.getElementById('unit1-nodes').classList.remove('hidden');
    } else if (unitId === 'unit2') {
        document.getElementById('current-chapter-title').innerText = "The Makkan Era of the Prophet ﷺ(Unit 2)";
        document.getElementById('unit2-nodes').classList.remove('hidden');
    }

    // MAP को रिफ्रेश करें 
    updateMapUI(); 
}

function updateMapUI() {
    const unlockedLessons = JSON.parse(localStorage.getItem('unlockedChapters')) || ['chapter1'];

    // 1 से 40 तक सारे लेसन्स को चेक करें
    for(let i = 1; i <= 40; i++) {
        let chapterId = 'chapter' + i;
        const node = document.getElementById(`node-${chapterId}`);
        
        if (node) {
            if (unlockedLessons.includes(chapterId)) {
                node.classList.remove('locked');
                node.classList.add('active');
                node.innerHTML = '<span class="node-icon">📖</span>';
                node.onclick = () => loadLesson(chapterId);
            } else {
                node.classList.add('locked');
                node.classList.remove('active');
                node.innerHTML = '<span class="node-icon">🔒</span>';
                node.onclick = null; 
            }
        }
    }

    // यूनिट 1 का प्रोग्रेस टेक्स्ट अपडेट करें 
    let unit1Count = unlockedLessons.filter(ch => parseInt(ch.replace('chapter','')) <= 20).length;
    const progressText1 = document.getElementById('unit1-progress');
    if (progressText1) {
        progressText1.innerText = `${unit1Count}/20`;
    }

    // यूनिट 2 का प्रोग्रेस टेक्स्ट और अनलॉक लॉजिक
    const unit2Banner = document.getElementById('chap-banner-2');
    const unit2Progress = document.getElementById('unit2-progress');
    let unit2Count = unlockedLessons.filter(ch => parseInt(ch.replace('chapter','')) > 20).length;

    if (unit2Banner && unit2Progress) {
        if (unlockedLessons.includes('chapter21')) {
            unit2Banner.classList.remove('locked');
            unit2Banner.classList.add('bg-blue'); 
            unit2Progress.innerText = `${unit2Count}/10`; 
        } else {
            unit2Banner.classList.add('locked');
            unit2Banner.classList.remove('bg-blue');
            unit2Progress.innerText = `🔒`;
        }
    }
}

function backToChapters() {
    playSound('tapSound');
    
    // Map chhupao aur Chapters dikhao
    document.getElementById('lesson-map-screen').classList.add('hidden');
    document.getElementById('lesson-map-screen').style.display = 'none';

    const chapScreen = document.getElementById('chapters-screen');
    chapScreen.classList.remove('hidden');
    chapScreen.style.display = 'flex';
}

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("wrongSound"));
    }
}

// =========================================
// 10. SETTINGS & FEATURES LOGIC
// =========================================

// 1. ओपन सेटिंग्स (अपडेटेड - ताकि पुरानी भाषा वाला बटन ब्लू दिखे)
function openSettings() {
    playSound('tapSound');
    document.getElementById('settings-screen').style.display = 'flex';
    document.getElementById('settings-screen').classList.remove('hidden');

    const currentLang = localStorage.getItem('userLanguage') || 'ur';
    highlightLanguageButton(currentLang); // बटन को हाईलाइट करें
}

function closeSettingsScreen() {
    playSound('tapSound');
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('settings-screen').classList.add('hidden');
}

// 2. भाषा बदलना (कस्टम बटन्स और टोस्ट के साथ)
function changeLanguageWithoutReset(lang) {
    playSound('tapSound');
    localStorage.setItem('userLanguage', lang);
    userLang = lang; 
    
    highlightLanguageButton(lang);
    showToast("Language Updated Successfully.");
}

// भाषा वाले बटन को ब्लू करने का फंक्शन
function highlightLanguageButton(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.style.border = "2px solid #ccc";
        btn.style.background = "white";
        btn.style.color = "#333";
    });

    const activeBtn = document.getElementById('btn-lang-' + lang);
    if(activeBtn) {
        activeBtn.style.border = "2px solid #2196F3";
        activeBtn.style.background = "#E3F2FD";
        activeBtn.style.color = "#0D47A1";
    }
}

// 3. फॉन्ट साइज़ बदलना (Select होने पर ब्लू और बड़ा करना)
function changeFontSize(size) {
    playSound('tapSound');
    const root = document.documentElement;
    
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.style.border = "2px solid #ccc";
        btn.style.background = "white";
        btn.style.transform = "scale(1)"; 
        btn.style.color = "#333";
    });

    const activeBtn = document.getElementById('btn-font-' + size);
    if(activeBtn) {
        activeBtn.style.border = "2px solid #2196F3"; 
        activeBtn.style.background = "#E3F2FD"; 
        activeBtn.style.transform = "scale(1.15)"; 
        activeBtn.style.color = "#0D47A1"; 
    }
    
    if(size === 'small') {
        root.style.setProperty('font-size', '14px');
    } else if(size === 'medium') {
        root.style.setProperty('font-size', '16px'); 
    } else if(size === 'large') {
        root.style.setProperty('font-size', '20px');
    }
    
    localStorage.setItem('appFontSize', size);
}

// 4. प्रोमो कोड (Cheats: RAZA)
function applyPromoCode() {
    playSound('tapSound');
    const codeInput = document.getElementById('promo-input').value.trim().toUpperCase();
    
    if (codeInput === 'RAZA') {
        let unlocked = [];
        for(let i = 1; i <= 40; i++) {
            unlocked.push('chapter' + i);
        }
        localStorage.setItem('unlockedChapters', JSON.stringify(unlocked));
        
        updateMapUI(); 
        
        alert("MashaAllah! Master Code Applied. All Lessons Have Been Unlocked.");
        document.getElementById('promo-input').value = ""; 
        closeSettingsScreen();
    } else {
        alert("Invalid Promo Code!");
    }
}

// 5. अबाउट (About Developer - Custom Window)
function showAboutInfo() {
    playSound('tapSound');
    document.getElementById('about-screen').style.display = 'flex';
    document.getElementById('about-screen').classList.remove('hidden');
}

function closeAboutInfo() {
    playSound('tapSound');
    document.getElementById('about-screen').style.display = 'none';
    document.getElementById('about-screen').classList.add('hidden');
}

// 6. रिसेट प्रोग्रेस (कस्टम वार्निंग विंडो खोलना)
function resetAppProgress() {
    playSound('tapSound');
    document.getElementById('reset-screen').style.display = 'flex';
    document.getElementById('reset-screen').classList.remove('hidden');
}

// रिसेट कैंसिल करना
function closeResetScreen() {
    playSound('tapSound');
    document.getElementById('reset-screen').style.display = 'none';
    document.getElementById('reset-screen').classList.add('hidden');
}

// असली रिसेट प्रोसेस (जब यूज़र 'Yes, Reset' दबाए)
function confirmAppReset() {
    playSound('tapSound');
    const savedLang = localStorage.getItem('userLanguage'); 
    localStorage.clear(); 
    if(savedLang) {
        localStorage.setItem('userLanguage', savedLang); 
    }
    
    showToast("Progress Reset! App Restarting...");
    
    // 1.5 सेकंड बाद पेज रीलोड करें ताकि यूज़र को Toast मैसेज दिख सके
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// 7. TOAST MESSAGE FUNCTION (स्क्रीन के नीचे छोटा मैसेज जो खुद गायब हो जाए)
function showToast(message) {
    const toast = document.getElementById('toast-message');
    toast.innerText = message;
    toast.style.bottom = "20px";
    toast.style.opacity = "1";

    // 3 सेकंड बाद वापस छुपा दें
    setTimeout(() => {
        toast.style.bottom = "-50px";
        toast.style.opacity = "0";
    }, 3000);
}






// =========================================
// TAB NAVIGATION LOGIC (Home, Journey, Profile)
// =========================================
function switchTab(tabName) {
    if(typeof playSound === 'function') playSound('tapSound');

    // सभी स्क्रीन्स को छुपाएं
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('main-app').style.display = 'none';
    
    document.getElementById('chapters-screen').classList.add('hidden');
    document.getElementById('chapters-screen').style.display = 'none';
    
    document.getElementById('lesson-map-screen').classList.add('hidden');
    document.getElementById('lesson-map-screen').style.display = 'none';
    
    document.getElementById('journey-screen').classList.add('hidden');
    document.getElementById('journey-screen').style.display = 'none';
    
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('profile-screen').style.display = 'none';

    // 👉 स्टोर स्क्रीन को भी छुपाएं
    document.getElementById('store-screen').classList.add('hidden');
    document.getElementById('store-screen').style.display = 'none';

    // चुनी हुई स्क्रीन दिखाएं
    if(tabName === 'home') {
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('main-app').style.display = 'block';
    } 
    else if(tabName === 'journey') {
        document.getElementById('journey-screen').classList.remove('hidden');
        document.getElementById('journey-screen').style.display = 'block';
        if(typeof loadLessonJourney === 'function') loadLessonJourney();
    } 
    else if(tabName === 'store') {
        document.getElementById('store-screen').classList.remove('hidden');
        document.getElementById('store-screen').style.display = 'block';
        updateStoreUI(); // स्टोर का डेटा रिफ्रेश करें
    }
    else if(tabName === 'profile') {
        document.getElementById('profile-screen').classList.remove('hidden');
        document.getElementById('profile-screen').style.display = 'block';
        if(typeof loadProfileData === 'function') loadProfileData();
    }
}




// =========================================
// PROFILE SCREEN LOGIC (Premium Avatar & Data)
// =========================================
function uploadProfilePic(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            document.getElementById('profile-pic-preview').src = base64Image;
            localStorage.setItem('userProfilePic', base64Image); // सेव कर लें
            showToast("Profile Picture Updated! 📷");
        };
        reader.readAsDataURL(file);
    }
}

function saveProfileData() {
    const name = document.getElementById('profile-name').value;
    const about = document.getElementById('profile-about').value;
    localStorage.setItem('userProfileName', name);
    localStorage.setItem('userProfileAbout', about);
}

function loadProfileData() {
    // सेव किया हुआ डेटा निकालें
    const savedPic = localStorage.getItem('userProfilePic');
    if(savedPic) document.getElementById('profile-pic-preview').src = savedPic;
    
    const savedName = localStorage.getItem('userProfileName');
    if(savedName) document.getElementById('profile-name').value = savedName;
    
    const savedAbout = localStorage.getItem('userProfileAbout');
    if(savedAbout) document.getElementById('profile-about').value = savedAbout;

    // स्ट्रीक और XP दिखाएं (जेम्स नहीं)
    document.getElementById('profile-streak-count').innerText = userStreak || 0;
    document.getElementById('profile-streak-icon').innerText = streakFrozen ? "♨️" : "🔥";
    document.getElementById('profile-xp-count').innerText = userXP || 0;

        // अचीवमेंट्स लोड करें (Profile Screen)
    const achvContainer = document.getElementById('profile-achievements-container');
    achvContainer.innerHTML = ''; // पुराना क्लियर करें
    
    let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];

    if(unlockedAchievements.length === 0) {
        achvContainer.innerHTML = '<p style="color:#888; font-size:0.85rem; text-align:center; width:100%;">No achievements unlocked yet. Keep learning! 📖</p>';
    } else {
        achievementsList.forEach(ach => {
            if (unlockedAchievements.includes(ach.id)) {
                const iconBg = ach.type === 'streak' ? '#FFE0B2' : '#C8E6C9';
                const textColor = ach.type === 'streak' ? '#E65100' : '#2E7D32';
                
                const html = `
                    <div style="background: ${iconBg}; padding: 10px; border-radius: 12px; text-align: center; min-width: 90px;">
                        <div style="font-size: 1.8rem;">${ach.icon}</div>
                        <div style="font-size: 0.75rem; font-weight: bold; margin-top: 5px; color:${textColor};">${ach.title}</div>
                    </div>
                `;
                achvContainer.innerHTML += html;
            }
        });
    }

    
    const isStreakDone = localStorage.getItem('achv_streak') === 'true';
    const isLessonsDone = localStorage.getItem('achv_lessons') === 'true';

    let html = '';
    if(!isStreakDone && !isLessonsDone) {
        html = '<p style="color:#888; font-size:0.85rem; text-align:center; width:100%;">No achievements earned yet. Continue your learning journey. 📖</p>';
    } else {
        if(isStreakDone) {
            html += `<div style="background: #FFE0B2; padding: 10px; border-radius: 12px; text-align: center; min-width: 80px;">
                        <div style="font-size: 1.8rem;">🔥</div>
                        <div style="font-size: 0.7rem; font-weight: bold; margin-top: 5px; color:#E65100;">3 Day Streak</div>
                     </div>`;
        }
        if(isLessonsDone) {
            html += `<div style="background: #C8E6C9; padding: 10px; border-radius: 12px; text-align: center; min-width: 80px;">
                        <div style="font-size: 1.8rem;">📖</div>
                        <div style="font-size: 0.7rem; font-weight: bold; margin-top: 5px; color:#2E7D32;">5 Lessons</div>
                     </div>`;
        }
    }
    achvContainer.innerHTML = html;
}

// =========================================
// YOUR LESSON JOURNEY LOGIC (Continuous Reading)
// =========================================
async function loadLessonJourney() {
    const journeyContainer = document.getElementById('journey-content');
    journeyContainer.innerHTML = '<div style="text-align: center; margin-top: 50px;"><div class="loader-bar"></div><p>Preparing your learning journey...</p></div>';

    // अनलॉक किए गए चैप्टर्स लें (आखिरी वाला अनलॉक होता है पर शायद पढ़ा न हो, इसलिए उसे हटाकर बाकी लेंगे)
    const unlocked = JSON.parse(localStorage.getItem('unlockedChapters')) || ['chapter1'];
    let completedChapters = [];
    
    // अगर यूज़र ने क्विज़ पास किया है, तो अगला चैप्टर अनलॉक होता है। मतलब आखिरी चैप्टर छोड़कर बाकी सब 'Completed' हैं।
    if(unlocked.length > 1) {
        completedChapters = unlocked.slice(0, unlocked.length - 1);
    } else if(localStorage.getItem('totalLessonsDone') > 0) {
        completedChapters = ['chapter1']; // कम से कम पहला तो पूरा किया ही है
    }

    if (completedChapters.length === 0) {
        journeyContainer.innerHTML = `
            <div style="text-align: center; margin-top: 50px; color: #888;">
                <div style="font-size: 4rem; margin-bottom: 15px;">📖</div>
                <h3>No Lessons Completed Yet</h3>
                <p style="font-size: 0.9rem;">Complete your first lesson and your journey will appear here.</p>
                <button onclick="switchTab('home')" class="btn-primary" style="margin-top: 20px;">Begin Learning</button>
            </div>`;
        return;
    }

    try {
        const response = await fetch('data/seerat_text.json');
        const data = await response.json();
        const lang = localStorage.getItem('userLanguage') || 'ur';
        
        let journeyHTML = '';

        completedChapters.forEach((chapId, index) => {
            if(data[chapId]) {
                journeyHTML += `<div style="background: white; border-radius: 15px; padding: 20px; margin-bottom: px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 4px solid #2E5B3E;">`;
                journeyHTML += `<h3 style="color: #2E5B3E; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">سبق ${index + 1} / सबक ${index + 1}</h3>`;
                
                // सारे स्लाइड्स को एक के नीचे एक जोड़ दें
                data[chapId].slides.forEach(slide => {
                    journeyHTML += `
                        <div style="margin-bottom: 20px;">
                            <img src="${slide.image}" style="width: 100%; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <p style="font-size: 1.1rem; line-height: 1.8; color: #333;">${slide[lang]}</p>
                        </div>
                    `;
                });
                journeyHTML += `</div>`;
            }
        });

        journeyHTML += `
            <div style="text-align: center; margin-top: 30px; margin-bottom: 30px; color: #2E5B3E;">
                <p style="font-weight: bold;">📜 This is your progress so far! </p>
                <button onclick="switchTab('home')" class="btn-primary" style="margin-top: 10px;">Begin Learning</button>
            </div>`;

        journeyContainer.innerHTML = journeyHTML;

    } catch (error) {
        console.error("Journey load error:", error);
        journeyContainer.innerHTML = '<p style="color: red; text-align: center;">Something went wrong while loading data. Please check your connection.</p>';
    }
}



// =========================================
// PREMIUM STORE LOGIC & AUTOMATIC FREEZER REFILL
// =========================================

// ✅ सिर्फ 'streakFreezers' को यहाँ रहने दें, बाकी दोनों ऊपर पहले से डिक्लेयर्ड हैं
//let streakFreezers = parseInt(localStorage.getItem('streakFreezers')) || 0;

// स्टोर की स्क्रीन अपडेट करने का फंक्शन
function updateStoreUI() {
    // ग्लोबल वैरियेबल्स को सिंक करें (यहाँ let नहीं लगाना है)
    userGems = parseInt(localStorage.getItem('userGems')) || 0;
    userEnergy = parseInt(localStorage.getItem('userEnergy')) || 10;
    streakFreezers = parseInt(localStorage.getItem('streakFreezers')) || 0;

    // 3-दिन मुफ्त वाले फ्रीजर का लॉजिक चलाएं
    checkPassiveFreezerRefill();
    
    // ... (बाकी का नीचे का पूरा कोड बिल्कुल वैसा ही रहेगा)



    // स्क्रीन के टेक्स्ट बदलें
    document.getElementById('store-gems-count').innerText = userGems;
    document.getElementById('store-freezer-count').innerText = streakFreezers;

    // अगर फ्रीजर 2 हो चुके हैं तो बटन को डिसएबल/धुंधला करें
    const freezerBtn = document.getElementById('buy-freezer-btn');
    if (streakFreezers >= 2) {
        freezerBtn.disabled = true;
        freezerBtn.style.opacity = "0.5";
        freezerBtn.innerText = "MAX 2";
    } else {
        freezerBtn.disabled = false;
        freezerBtn.style.opacity = "1";
        freezerBtn.innerText = "30 💎";
    }

    // टॉप बार के स्टेट्स को भी रिफ्रेश कर दें (अगर एलिमेंट मौजूद हैं)
    document.querySelectorAll('.top-gems-text').forEach(el => el.innerText = userGems);
    document.querySelectorAll('.top-energy-text').forEach(el => el.innerText = userEnergy);
    document.querySelectorAll('.top-streak-text').forEach(el => el.innerText = localStorage.getItem('userStreak') || 0);
}

// ⚡ एनर्जी खरीदने का फंक्शन (20 Gems = 1 Energy)
function buyEnergyFromStore() {
    if (userGems >= 20) {
        userGems -= 20;
        userEnergy += 1;
        
        localStorage.setItem('userGems', userGems);
        safeSetItem('userEnergy', userEnergy);

        
        if(typeof playSound === 'function') playSound('tapSound');
        showToast("Energy refilled successfully! ⚡");
        updateStoreUI();
    } else {
        showToast("You don't have enough Gems! 💎");
    }
}

// ♨️ स्ट्रीक फ्रीजर खरीदने का फंक्शन (30 Gems = 1 Freezer, Max 2)
function buyFreezerFromStore() {
    if (streakFreezers >= 2) {
        showToast("You can only hold a maximum of 2 Streak Freezers! ♨️");
        return;
    }

    if (userGems >= 30) {
        userGems -= 30;
        streakFreezers += 1;
        
        localStorage.setItem('userGems', userGems);
        localStorage.setItem('streakFreezers', streakFreezers);
        
        if(typeof playSound === 'function') playSound('tapSound');
        showToast("Streak Freezer purchased successfully! ♨️");
        updateStoreUI();
    } else {
        showToast("You don't have enough Gems! 💎");
    }
}

// 🎁 हर 3 दिन में मुफ्त स्ट्रीक फ्रीजर देने का टाइमर लॉजिक
function checkPassiveFreezerRefill() {
    const now = Date.now();
    let lastRegen = localStorage.getItem('lastFreezerRegenTime');
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 दिन मिलीसेकंड में

    if (!lastRegen) {
        // पहली बार ऐप चालू होने पर आज का टाइम सेट कर दें
        localStorage.setItem('lastFreezerRegenTime', now);
        return;
    }

    lastRegen = parseInt(lastRegen);
    const timePassed = now - lastRegen;

    if (timePassed >= threeDaysInMs) {
        // कितने 3-दिन के साइकल बीत चुके हैं निकालें
        const intervals = Math.floor(timePassed / threeDaysInMs);
        
        if (typeof streakFreezers !== 'undefined' && streakFreezers < 2) {
            streakFreezers = Math.min(2, streakFreezers + intervals);
            localStorage.setItem('streakFreezers', streakFreezers);
            
            // अगर आपके पास showToast नाम का फंक्शन बना हुआ है, तो यह काम करेगा
            if (typeof showToast === "function") {
                showToast("🎁 Gift: You received a free Streak Freezer!");
            }
        }
        
        // टाइमर रीसेट करें और बचे हुए टाइम को आगे बढ़ाएं
        localStorage.setItem('lastFreezerRegenTime', lastRegen + (intervals * threeDaysInMs));
    }

    // यूज़र को जानकारी दिखाने के लिए कि अगला फ्रीजर कब मिलेगा
    const nextRegenTime = parseInt(localStorage.getItem('lastFreezerRegenTime')) + threeDaysInMs;
    const timeLeftMs = nextRegenTime - now;
    const daysLeft = Math.ceil(timeLeftMs / (24 * 60 * 60 * 1000));
    
    const timerInfoEl = document.getElementById('freezer-timer-info');
    if (timerInfoEl) {
        if (typeof streakFreezers !== 'undefined' && streakFreezers >= 2) {
            timerInfoEl.innerText = "You can only hold a maximum of 2 Streak Freezers! ♨️(Max 2)";
        } else {
           timerInfoEl.innerText = `Your next free Streak Freeze will be available in about ${daysLeft} days.`; 
        }
    }
}

// जब पूरा ऐप पहली बार लोड हो, तब भी बैकग्राउंड में मुफ्त फ्रीजर चेक कर लें
checkPassiveFreezerRefill();

document.addEventListener("DOMContentLoaded", () => {
    checkPassiveFreezerRefill();
});

// ================================
// CHAPTER DOWNLOAD MANAGER
// ================================

function updateDownloadButton(){

    const btn=document.getElementById("download-chapter-btn");

    if(!btn)return;

    if(downloadedChapters.includes(activeChapterId)){

        btn.innerHTML="✅";
        btn.classList.add("downloaded");

    }else{

        btn.innerHTML="⬇️";
        btn.classList.remove("downloaded");

    }

}

async function downloadCurrentChapter() {

    if (!activeChapterId) return;

    if (downloadedChapters.includes(activeChapterId)) {

        showToast("Already downloaded.");
        return;

    }

    showToast("Preparing chapter...");

    const cache = await caches.open("dastaan-cache-v1.0.4");

    try {

        const response = await fetch("data/seerat_text.json");
        const data = await response.json();

        if (!data[activeChapterId]) {

            showToast("Chapter not found.");
            return;

        }

        const slides = data[activeChapterId].slides;

        let files = [];

        // Intro image
        files.push(`assets/images/intro_${activeChapterId}.webp`);

        // Lesson images
        slides.forEach(slide => {

            if (slide.image) {

                files.push(slide.image);

            }

        });

        // Audio (current project)
        files.push("assets/audio/TAP.wav");
        files.push("assets/audio/NEXT.mp3");
        files.push("assets/audio/NEXT2.mp3");
        files.push("assets/audio/START.mp3");
        files.push("assets/audio/QUIZSTART.mp3");
        files.push("assets/audio/COMPLETE.wav");
        files.push("assets/audio/WRONG.mp3");
        files.push("assets/audio/WRONG.wav");

        let completed = 0;

        for (const file of files) {

            try {

                await cache.add(file);

              console.log("Cached:", file);

            } catch (e) {

                console.log(file);

            }

            completed++;

            const percent =
                Math.floor((completed / files.length) * 100);

            showToast("Downloading " + percent + "%");

        }

        downloadedChapters.push(activeChapterId);

        localStorage.setItem(
            "downloadedChapters",
            JSON.stringify(downloadedChapters)
        );

        //updateDownloadButton();

        showToast("✅ Chapter Downloaded");

    } catch (err) {

        console.log(err);

        showToast("Download failed");

    }

}


function removeDownloadedChapter(){

    downloadedChapters=
    downloadedChapters.filter(c=>c!==activeChapterId);

    localStorage.setItem(
        "downloadedChapters",
        JSON.stringify(downloadedChapters)
    );

    //updateDownloadButton();

    showToast("Download removed");

}