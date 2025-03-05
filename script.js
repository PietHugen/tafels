let currentTable = null;
let score = 0;
let streak = 0;
let bestStreak = 0;
let highScore = 0;

const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer');
const checkButton = document.getElementById('check');
const hintButton = document.getElementById('hint');
const feedbackElement = document.getElementById('feedback');
const hintVisualization = document.getElementById('hint-visualization');
const scoreElement = document.getElementById('score');
const streakElement = document.getElementById('streak');
const bestStreakElement = document.getElementById('best-streak');
const highScoreElement = document.getElementById('high-score');

// Voeg geluidseffecten toe
const sounds = {
    success1: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
    success2: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    success3: new Audio('https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3')
};

// Laad opgeslagen scores bij het starten
function loadScores() {
    const savedBestStreak = localStorage.getItem('bestStreak');
    const savedHighScore = localStorage.getItem('highScore');
    
    if (savedBestStreak) bestStreak = parseInt(savedBestStreak);
    if (savedHighScore) highScore = parseInt(savedHighScore);
    
    updateScoreDisplay();
}

// Sla scores op
function saveScores() {
    localStorage.setItem('bestStreak', bestStreak);
    localStorage.setItem('highScore', highScore);
}

// Update alle score displays
function updateScoreDisplay() {
    scoreElement.textContent = score;
    streakElement.textContent = streak;
    bestStreakElement.textContent = bestStreak;
    highScoreElement.textContent = highScore;
}

// Event listeners voor de tafel knoppen
document.querySelectorAll('.table-btn').forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('random')) {
            currentTable = Math.floor(Math.random() * 11) + 2; // Random getal tussen 2 en 12
        } else {
            currentTable = parseInt(button.dataset.table);
        }
        generateQuestion();
        answerInput.focus();
    });
});

// Event listener voor de controleer knop
checkButton.addEventListener('click', checkAnswer);

// Event listener voor de hint knop
hintButton.addEventListener('click', showHint);

// Event listener voor Enter toets
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

function generateQuestion() {
    const multiplier = Math.floor(Math.random() * 10) + 1;
    const answer = currentTable * multiplier;
    questionElement.textContent = `${currentTable} × ${multiplier} = ?`;
    answerInput.value = '';
    feedbackElement.textContent = '';
    hintVisualization.innerHTML = '';
    answerInput.focus();
}

function showHint() {
    if (!currentTable) {
        feedbackElement.textContent = 'Kies eerst een tafel om te oefenen!';
        feedbackElement.className = 'feedback incorrect';
        return;
    }

    const [multiplier] = questionElement.textContent.split('×')[1].trim().split('=');
    const multiplierNum = parseInt(multiplier);
    
    // Genereer een willekeurige hint met verschillende strategieën
    let hints = [];
    
    // Als een van de getallen 9 is, begin altijd met de 'begin bij 10' strategie
    if (currentTable.toString().includes('9') || multiplierNum === 9) {
        hints.push({
            text: `Tip: Bereken eerst ${currentTable} × 10 en trek dan ${currentTable} eraf`,
            type: 'makkelijker',
            extraData: { type: 'via10' }
        });
    }
    
    // Voor tafels van 11 en 12, gebruik de strategie via het volgende getal
    if (currentTable >= 11) {
        const nextMultiple = (Math.floor(multiplierNum / 5) + 1) * 5;
        if (nextMultiple <= 10) {
            hints.push({
                text: `Tip: Bereken eerst ${currentTable} × ${nextMultiple} en trek dan ${currentTable} × ${nextMultiple - multiplierNum} eraf`,
                type: 'makkelijker',
                extraData: { targetMultiple: nextMultiple }
            });
        }
    }
    
    // Voeg de andere strategieën toe
    hints = hints.concat([
        // Omkeerstrategie (8 x 4 = 4 x 8)
        {
            text: `Tip: ${currentTable} × ${multiplierNum} is hetzelfde als ${multiplierNum} × ${currentTable}`,
            type: 'omkeer'
        },
        {
            text: `Tip: Je kunt de getallen omdraaien: ${multiplierNum} × ${currentTable} = ${currentTable} × ${multiplierNum}`,
            type: 'omkeer'
        },
        
        // Makkelijkere tafel als tussenstap
        {
            text: `Tip: Bereken eerst ${currentTable} × ${multiplierNum - 1} en tel dan ${currentTable} erbij op`,
            type: 'makkelijker',
            extraData: { type: 'viaPrev' }
        },
        {
            text: `Tip: Bereken eerst ${currentTable} × ${multiplierNum + 1} en trek dan ${currentTable} eraf`,
            type: 'makkelijker',
            extraData: { type: 'viaNext' }
        },
        ...(multiplierNum > 5 && !currentTable.toString().includes('9') && multiplierNum !== 9 ? [
            {
                text: `Tip: Bereken eerst ${currentTable} × 5 en tel dan ${currentTable} × ${multiplierNum - 5} erbij op`,
                type: 'makkelijker',
                extraData: { type: 'via5' }
            }
        ] : []),
        ...(multiplierNum > 10 && !currentTable.toString().includes('9') && multiplierNum !== 9 ? [
            {
                text: `Tip: Bereken eerst ${currentTable} × 10 en trek dan ${currentTable} × ${10 - multiplierNum} eraf`,
                type: 'makkelijker',
                extraData: { type: 'via10' }
            }
        ] : []),
        
        // Basis strategieën
        {
            text: `Tip: Tel ${currentTable} keer ${multiplierNum} op`,
            type: 'basis'
        },
        {
            text: `Tip: Begin bij ${currentTable} en tel ${multiplierNum} keer op`,
            type: 'basis'
        },
        
        // Concrete voorbeelden
        {
            text: `Tip: Stel je voor dat je ${multiplierNum} groepjes van ${currentTable} snoepjes hebt`,
            type: 'concreet'
        }
    ]);
    
    // Als een van de getallen 9 is, gebruik altijd de eerste hint (begin bij 10)
    const randomHint = (currentTable.toString().includes('9') || multiplierNum === 9) ? 
        hints[0] : 
        hints[Math.floor(Math.random() * hints.length)];
    feedbackElement.textContent = randomHint.text;
    feedbackElement.className = 'feedback';
    
    // Visualiseer de hint
    visualizeHint(randomHint.type, currentTable, multiplierNum, randomHint.extraData);
}

function visualizeHint(type, table, multiplier, extraData = {}) {
    // Maak de visualisatie container leeg
    hintVisualization.innerHTML = '';
    
    // Helper functie om een rij stippen te maken
    function createDotRow(count, extraClass = '') {
        const row = document.createElement('div');
        row.className = 'dot-row';
        const candies = ['🍬', '🍭', '🍪', '🧁', '🍫', '🍩'];
        const fruits = ['🍎', '🍐', '🍊', '🍌', '🍇', '🍓'];
        // Kies willekeurig tussen snoep of fruit voor deze groep
        const emojiSet = Math.random() < 0.5 ? candies : fruits;
        // Kies één willekeurige emoji voor deze rij
        const emojiForThisRow = emojiSet[Math.floor(Math.random() * emojiSet.length)];
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = `dot ${extraClass}`;
            dot.textContent = emojiForThisRow;
            row.appendChild(dot);
        }
        return row;
    }

    // Helper functie om een groep te maken
    function createGroup(rows, dots, extraClass = '') {
        const group = document.createElement('div');
        group.className = 'group';
        for (let i = 0; i < rows; i++) {
            group.appendChild(createDotRow(dots, extraClass));
        }
        return group;
    }

    switch(type) {
        case 'basis':
        case 'concreet':
            // Toon alle rijen onder elkaar
            const group = createGroup(multiplier, table);
            hintVisualization.appendChild(group);
            break;
            
        case 'omkeer':
            // Container voor beide visualisaties
            const container = document.createElement('div');
            container.className = 'group-container';
            
            // Eerste groep (horizontaal)
            container.appendChild(createGroup(multiplier, table));
            
            // Teken een = teken
            const equals = document.createElement('div');
            equals.className = 'plus-sign';
            equals.textContent = '=';
            container.appendChild(equals);
            
            // Tweede groep (verticaal)
            container.appendChild(createGroup(table, multiplier));
            
            hintVisualization.appendChild(container);
            break;
            
        case 'makkelijker':
            const baseContainer = document.createElement('div');
            baseContainer.className = 'group-container';

            if (extraData.type === 'via10') {
                // Via de tafel van 10
                baseContainer.appendChild(createGroup(10, table, ''));
                
                const minSign = document.createElement('div');
                minSign.className = 'plus-sign';
                minSign.textContent = '-';
                baseContainer.appendChild(minSign);
                
                baseContainer.appendChild(createGroup(1, table, ''));
            } else if (extraData.targetMultiple) {
                // Voor tafels van 11 en 12: gebruik het hogere veelvoud
                baseContainer.appendChild(createGroup(extraData.targetMultiple, table, ''));
                
                const minSign = document.createElement('div');
                minSign.className = 'plus-sign';
                minSign.textContent = '-';
                baseContainer.appendChild(minSign);
                
                baseContainer.appendChild(createGroup(extraData.targetMultiple - multiplier, table, ''));
            } else if (extraData.type === 'via5') {
                // Via de tafel van 5
                baseContainer.appendChild(createGroup(5, table, ''));
                
                const plusSign = document.createElement('div');
                plusSign.className = 'plus-sign';
                plusSign.textContent = '+';
                baseContainer.appendChild(plusSign);
                
                baseContainer.appendChild(createGroup(multiplier - 5, table, ''));
            } else if (extraData.type === 'viaNext') {
                // Via het volgende getal
                baseContainer.appendChild(createGroup(multiplier + 1, table, ''));
                
                const minSign = document.createElement('div');
                minSign.className = 'plus-sign';
                minSign.textContent = '-';
                baseContainer.appendChild(minSign);
                
                baseContainer.appendChild(createGroup(1, table, ''));
            } else if (extraData.type === 'viaPrev') {
                // Via het vorige getal
                baseContainer.appendChild(createGroup(multiplier - 1, table, ''));
                
                const plusSign = document.createElement('div');
                plusSign.className = 'plus-sign';
                plusSign.textContent = '+';
                baseContainer.appendChild(plusSign);
                
                baseContainer.appendChild(createGroup(1, table, ''));
            }
            
            hintVisualization.appendChild(baseContainer);
            break;
    }
}

function createCelebration() {
    // Maak container voor alle animaties
    const container = document.createElement('div');
    container.className = 'celebration-container';
    document.body.appendChild(container);

    // Kies willekeurig welke animaties we gaan tonen
    const animations = [
        {
            name: 'firework',
            chance: 0.7,
            create: () => {
                for (let i = 0; i < 8; i++) {
                    const firework = document.createElement('div');
                    firework.className = 'firework';
                    firework.style.left = Math.random() * 100 + '%';
                    firework.style.top = Math.random() * 100 + '%';
                    firework.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    firework.style.animationDelay = `${Math.random() * 0.5}s`;
                    container.appendChild(firework);
                }
            }
        },
        {
            name: 'star',
            chance: 0.8,
            create: () => {
                for (let i = 0; i < 12; i++) {
                    const star = document.createElement('div');
                    star.className = 'star';
                    star.style.left = Math.random() * 100 + '%';
                    star.style.top = Math.random() * 100 + '%';
                    star.style.animationDelay = `${Math.random() * 1}s`;
                    container.appendChild(star);
                }
            }
        },
        {
            name: 'rainbow',
            chance: 0.5,
            create: () => {
                const rainbow = document.createElement('div');
                rainbow.className = 'rainbow';
                rainbow.style.left = '50%';
                rainbow.style.bottom = '0';
                rainbow.style.transform = 'translateX(-50%)';
                container.appendChild(rainbow);
            }
        },
        {
            name: 'unicorn',
            chance: 0.4,
            create: () => {
                const unicorn = document.createElement('div');
                unicorn.className = 'unicorn';
                unicorn.style.bottom = `${20 + Math.random() * 40}%`;
                container.appendChild(unicorn);
            }
        },
        {
            name: 'glitter',
            chance: 0.6,
            create: () => {
                for (let i = 0; i < 30; i++) {
                    const glitter = document.createElement('div');
                    glitter.className = 'glitter';
                    glitter.style.left = Math.random() * 100 + '%';
                    glitter.style.top = Math.random() * 100 + '%';
                    glitter.style.animationDelay = `${Math.random() * 1}s`;
                    container.appendChild(glitter);
                }
            }
        },
        {
            name: 'heart',
            chance: 0.5,
            create: () => {
                for (let i = 0; i < 10; i++) {
                    const heart = document.createElement('div');
                    heart.className = 'heart';
                    heart.textContent = '❤️';
                    heart.style.left = Math.random() * 100 + '%';
                    heart.style.top = Math.random() * 100 + '%';
                    heart.style.animationDelay = `${Math.random() * 0.5}s`;
                    container.appendChild(heart);
                }
            }
        },
        {
            name: 'confetti',
            chance: 0.7,
            create: () => {
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                for (let i = 0; i < 40; i++) {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = `${Math.random() * 2}s`;
                    container.appendChild(confetti);
                }
            }
        }
    ];

    // Kies willekeurig 3-4 verschillende animaties
    const numAnimations = 3 + Math.floor(Math.random() * 2);
    const selectedAnimations = animations
        .filter(animation => Math.random() < animation.chance)
        .slice(0, numAnimations);

    // Voer de geselecteerde animaties uit
    selectedAnimations.forEach(animation => animation.create());

    // Verwijder de container na de animaties
    setTimeout(() => {
        document.body.removeChild(container);
    }, 4000);
}

// Helper functie om een willekeurig geluid af te spelen
function playRandomSuccessSound() {
    try {
        const soundKeys = Object.keys(sounds);
        const randomSound = sounds[soundKeys[Math.floor(Math.random() * soundKeys.length)]];
        // Reset de audio naar het begin
        randomSound.currentTime = 0;
        // Zet het volume op een aangenaam niveau
        randomSound.volume = 0.5;
        // Speel het geluid af
        const playPromise = randomSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Audio afspelen mislukt:', error);
            });
        }
    } catch (error) {
        console.log('Fout bij het afspelen van geluid:', error);
    }
}

function checkAnswer() {
    if (!currentTable) {
        feedbackElement.textContent = 'Kies eerst een tafel om te oefenen!';
        feedbackElement.className = 'feedback incorrect';
        return;
    }

    const userAnswer = parseInt(answerInput.value);
    const [multiplier] = questionElement.textContent.split('×')[1].trim().split('=');
    const correctAnswer = currentTable * parseInt(multiplier);

    if (userAnswer === correctAnswer) {
        score += 10;
        streak++;
        
        // Update bestStreak en highScore
        if (streak > bestStreak) {
            bestStreak = streak;
            saveScores();
        }
        if (score > highScore) {
            highScore = score;
            saveScores();
        }
        
        feedbackElement.textContent = getPositiveFeedback();
        feedbackElement.className = 'feedback correct';
        
        // Start de viering en speel geluid
        createCelebration();
        playRandomSuccessSound();
        
        // Update alle score displays
        updateScoreDisplay();
        
        // Genereer nieuwe vraag na langere vertraging (2 seconden)
        setTimeout(generateQuestion, 2000);
    } else {
        streak = 0;
        updateScoreDisplay();
        feedbackElement.textContent = `Helaas, dat is niet correct. Het juiste antwoord is ${correctAnswer}. Probeer het nog een keer!`;
        feedbackElement.className = 'feedback incorrect';
        answerInput.focus();
    }
}

function getPositiveFeedback() {
    const feedbacks = [
        'Super goed! 🌟',
        'Geweldig! 🎉',
        'Perfect! ⭐',
        'Knap gedaan! 🎯',
        'Je bent een ster! 🌠',
        'Fantastisch! 🎨',
        'Wauw, wat goed! 👏',
        'Je bent geweldig! 🏆',
        'Top! 🎪',
        'Gefeliciteerd! 🎈'
    ];
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

// Laad scores bij het starten van het spel
loadScores();

// Focus op het antwoordveld bij het laden van de pagina
answerInput.focus();

// Functie voor willekeurige tafels
function generateRandomTable() {
    currentTable = Math.floor(Math.random() * 10) + 1;
    generateQuestion();
} 