// --- Seleção de Elementos do DOM ---
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');

// Elementos de Configuração
const numPlayersInput = document.getElementById('num-players');
const confirmPlayersBtn = document.getElementById('confirm-players');
const playersSetupDiv = document.getElementById('players-setup');
const roundTimeInput = document.getElementById('round-time');
const timerModeSelect = document.getElementById('timer-mode');
const startGameBtn = document.getElementById('start-game-btn');

// Elementos do Jogo
const playerNameH2 = document.getElementById('player-name');
const playerColorIndicator = document.getElementById('player-color-indicator');
const timerDisplay = document.getElementById('timer-display');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// --- Variáveis de Estado do Jogo ---
let players = [];
let gameSettings = {};
let currentPlayerIndex = 0;
let timerInterval = null;
let currentTime = 0;
let isPaused = false;

// --- Funções ---

// Gera os campos de nome e cor para cada jogador
function generatePlayerInputs() {
    const numPlayers = parseInt(numPlayersInput.value, 10);
    playersSetupDiv.innerHTML = ''; // Limpa campos anteriores

    for (let i = 1; i <= numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('form-group');
        playerDiv.innerHTML = `
            <label for="player-name-${i}">Nome do Jogador ${i}</label>
            <input type="text" id="player-name-${i}" value="Jogador ${i}">
            <label for="player-color-${i}">Cor</label>
            <input type="color" id="player-color-${i}" value="${getRandomColor()}">
        `;
        playersSetupDiv.appendChild(playerDiv);
    }
}

// Gera uma cor aleatória para o input de cor
function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

// Inicia o jogo: coleta dados, esconde a configuração e mostra a tela do jogo
function startGame() {
    // 1. Coletar dados dos jogadores
    players = [];
    const numPlayers = parseInt(numPlayersInput.value, 10);
    for (let i = 1; i <= numPlayers; i++) {
        const name = document.getElementById(`player-name-${i}`).value;
        const color = document.getElementById(`player-color-${i}`).value;
        players.push({ name: name || `Jogador ${i}`, color });
    }

    // 2. Coletar configurações do jogo
    gameSettings = {
        time: parseInt(roundTimeInput.value, 10),
        mode: timerModeSelect.value
    };

    // 3. Validar se há jogadores
    if (players.length === 0) {
        alert('Adicione pelo menos um jogador!');
        return;
    }

    // 4. Mudar de tela
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    // 5. Iniciar o primeiro turno
    currentPlayerIndex = 0;
    setupTurn();
}

// Configura o turno para o jogador atual
function setupTurn() {
    isPaused = false;
    pauseBtn.textContent = 'Pausar';
    pauseBtn.classList.remove('paused');

    const currentPlayer = players[currentPlayerIndex];
    playerNameH2.textContent = currentPlayer.name;
    playerColorIndicator.style.backgroundColor = currentPlayer.color;
    
    startTimer();
}

// Inicia o cronômetro (progressivo ou regressivo)
function startTimer() {
    clearInterval(timerInterval); // Limpa qualquer timer anterior

    if (gameSettings.mode === 'regressive') {
        currentTime = gameSettings.time;
    } else {
        currentTime = 0;
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            if (gameSettings.mode === 'regressive') {
                currentTime--;
                if (currentTime < 0) {
                    currentTime = 0;
                    clearInterval(timerInterval); // Para o timer quando chega a zero
                }
            } else {
                currentTime++;
            }
            updateTimerDisplay();
        }
    }, 1000);
}

// Atualiza o display do tempo no formato MM:SS
function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Passa para o próximo jogador
function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setupTurn();
}

// Pausa ou retoma o cronômetro
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.textContent = 'Retomar';
        pauseBtn.classList.add('paused');
    } else {
        pauseBtn.textContent = 'Pausar';
        pauseBtn.classList.remove('paused');
    }
}

// --- Event Listeners ---

// Gera os inputs de jogador ao confirmar o número
confirmPlayersBtn.addEventListener('click', generatePlayerInputs);

// Inicia o jogo
startGameBtn.addEventListener('click', startGame);

// O próprio timer passa a vez
timerDisplay.addEventListener('click', nextPlayer);

// Botão de Pausa
pauseBtn.addEventListener('click', togglePause);

// Botão de Reiniciar a rodada para o jogador atual
restartBtn.addEventListener('click', startTimer);

// --- Registro do Service Worker ---
// Adicione este bloco no final do seu arquivo script.js

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/cronGame/sw.js') // ATENÇÃO AQUI!
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(error => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
  });
}

// Botão de Reiniciar a rodada para o jogador atual
restartBtn.addEventListener('click', startTimer);

// --- LÓGICA DE PERSISTÊNCIA COM LOCALSTORAGE ---

const CONFIG_KEY = 'cronGameConfig'; // Chave para salvar no localStorage

// NOVA FUNÇÃO: Carrega as configurações salvas ao abrir a página
function loadSettings() {
    const savedData = localStorage.getItem(CONFIG_KEY);

    if (savedData) {
        const config = JSON.parse(savedData);

        // Preenche as configurações gerais
        numPlayersInput.value = config.players.length;
        roundTimeInput.value = config.gameSettings.time;
        timerModeSelect.value = config.gameSettings.mode;

        // Gera os campos de jogador com base no número salvo
        generatePlayerInputs();

        // Preenche os nomes e cores dos jogadores
        config.players.forEach((player, index) => {
            document.getElementById(`player-name-${index + 1}`).value = player.name;
            document.getElementById(`player-color-${index + 1}`).value = player.color;
        });
        
        console.log('Configurações carregadas com sucesso!');
    } else {
        // Se não houver dados salvos, gera os inputs para o valor padrão
        generatePlayerInputs();
        console.log('Nenhuma configuração salva encontrada. Usando padrões.');
    }
}

// MODIFICAÇÃO na função startGame()
// A única mudança é adicionar o código para salvar no final
function startGame() {
    // 1. Coletar dados dos jogadores
    players = [];
    const numPlayers = parseInt(numPlayersInput.value, 10);
    for (let i = 1; i <= numPlayers; i++) {
        const name = document.getElementById(`player-name-${i}`).value;
        const color = document.getElementById(`player-color-${i}`).value;
        players.push({ name: name || `Jogador ${i}`, color });
    }

    // 2. Coletar configurações do jogo
    gameSettings = {
        time: parseInt(roundTimeInput.value, 10),
        mode: timerModeSelect.value
    };

    // --- NOVO CÓDIGO AQUI ---
    // Salva a configuração completa no localStorage
    const configToSave = { players, gameSettings };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configToSave));
    console.log('Configurações salvas!');
    // --- FIM DO NOVO CÓDIGO ---

    // 3. Validar se há jogadores
    if (players.length === 0) {
        alert('Adicione pelo menos um jogador!');
        return;
    }

    // 4. Mudar de tela
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    // 5. Iniciar o primeiro turno
    currentPlayerIndex = 0;
    setupTurn();
}

// Remova a chamada generatePlayerInputs() do final do arquivo
// generatePlayerInputs(); // << APAGUE OU COMENTE ESTA LINHA

// CHAME A NOVA FUNÇÃO no final do script
loadSettings(); // << ADICIONE ESTA LINHA NO LUGAR