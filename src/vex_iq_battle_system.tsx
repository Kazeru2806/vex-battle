import { useState, useEffect, useRef } from 'react';

interface Player {
  name: string;
  hp: number;
  maxHp: number;
}

interface MatchResult {
  round: number;
  play: number;
  winner: string | null;
  points: number;
}

const VEXBattleSystem = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlay, setCurrentPlay] = useState(1);
  const [player1, setPlayer1] = useState<Player>({ name: 'Robot Alpha', hp: 100, maxHp: 100 });
  const [player2, setPlayer2] = useState<Player>({ name: 'Robot Beta', hp: 100, maxHp: 100 });
  const [playTimer, setPlayTimer] = useState(120); // 2 minutes
  const [flipTimer, setFlipTimer] = useState(0);
  const [playTimerActive, setPlayTimerActive] = useState(false);
  const [flipTimerActive, setFlipTimerActive] = useState(false);
  const [flippedPlayer, setFlippedPlayer] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [overallScores, setOverallScores] = useState({ player1: 0, player2: 0 });
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  
  // Setup form states
  const [setupPlayer1Name, setSetupPlayer1Name] = useState('Robot Alpha');
  const [setupPlayer2Name, setSetupPlayer2Name] = useState('Robot Beta');
  const [setupPlayer1HP, setSetupPlayer1HP] = useState(100);
  const [setupPlayer2HP, setSetupPlayer2HP] = useState(100);
  
  const playTimerRef = useRef<number | null>(null);
  const flipTimerRef = useRef<number | null>(null);

  // Timer effects
  useEffect(() => {
    if (playTimerActive && playTimer > 0) {
      playTimerRef.current = setTimeout(() => {
        setPlayTimer(prev => prev - 1);
      }, 1000);
    } else if (playTimer === 0 && playTimerActive) {
      setPlayTimerActive(false);
      // Time's up - determine winner by HP
      if (player1.hp > player2.hp) {
        setWinner(player1.name);
      } else if (player2.hp > player1.hp) {
        setWinner(player2.name);
      } else {
        setWinner('Draw');
      }
    }
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, [playTimer, playTimerActive, player1.hp, player2.hp]);

  useEffect(() => {
    if (flipTimerActive && flipTimer > 0) {
      flipTimerRef.current = setTimeout(() => {
        setFlipTimer(prev => prev - 1);
      }, 1000);
    } else if (flipTimer === 0 && flipTimerActive) {
      setFlipTimerActive(false);
      // Flip timer expired - player loses
      setWinner(flippedPlayer === 1 ? player2.name : player1.name);
    }
    return () => {
      if (flipTimerRef.current) {
        clearTimeout(flipTimerRef.current);
      }
    };
  }, [flipTimer, flipTimerActive, flippedPlayer, player1.name, player2.name]);

  // Check for HP-based wins
  useEffect(() => {
    if (player1.hp <= 0) {
      setWinner(player2.name);
      setPlayTimerActive(false);
      setFlipTimerActive(false);
    } else if (player2.hp <= 0) {
      setWinner(player1.name);
      setPlayTimerActive(false);
      setFlipTimerActive(false);
    }
  }, [player1.hp, player2.hp, player1.name, player2.name]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustHP = (player: number, amount: number): void => {
    if (winner) return; // Don't allow changes after winner is declared
    
    if (player === 1) {
      setPlayer1(prev => ({ ...prev, hp: Math.max(0, Math.min(prev.maxHp, prev.hp + amount)) }));
    } else {
      setPlayer2(prev => ({ ...prev, hp: Math.max(0, Math.min(prev.maxHp, prev.hp + amount)) }));
    }
  };

  const applyOutOfFieldPenalty = (player: number): void => {
    if (winner) return; // Don't allow changes after winner is declared
    
    if (player === 1) {
      setPlayer1(prev => ({ ...prev, hp: Math.max(0, prev.hp - 2) }));
    } else {
      setPlayer2(prev => ({ ...prev, hp: Math.max(0, prev.hp - 2) }));
    }
  };

  const startFlipTimer = (player: number): void => {
    if (winner) return;
    setFlippedPlayer(player);
    setFlipTimer(5); // 10 second flip recovery time
    setFlipTimerActive(true);
  };

  const stopFlipTimer = (): void => {
    setFlipTimerActive(false);
    setFlippedPlayer(null);
    setFlipTimer(0);
  };

  const resetMatch = (): void => {
    setPlayer1(prev => ({ ...prev, hp: prev.maxHp }));
    setPlayer2(prev => ({ ...prev, hp: prev.maxHp }));
    setPlayTimer(120);
    setFlipTimer(0);
    setPlayTimerActive(false);
    setFlipTimerActive(false);
    setFlippedPlayer(null);
    setWinner(null);
  };

  const applySetup = (): void => {
    setPlayer1({
      name: setupPlayer1Name,
      hp: setupPlayer1HP,
      maxHp: setupPlayer1HP
    });
    setPlayer2({
      name: setupPlayer2Name,
      hp: setupPlayer2HP,
      maxHp: setupPlayer2HP
    });
    setShowSetup(false);
    resetMatch();
  };

  const nextMatch = (): void => {
    // Record the match result
    const points = currentRound === 3 ? 6 : 3; // Double points in final round
    let newScores = { ...overallScores };
    
    if (winner === player1.name) {
      newScores.player1 += points;
    } else if (winner === player2.name) {
      newScores.player2 += points;
    }
    
    setOverallScores(newScores);
    setMatchResults(prev => [...prev, {
      round: currentRound,
      play: currentPlay,
      winner: winner,
      points: winner === 'Draw' ? 0 : points
    }]);

    // Move to next match or finish tournament
    if (currentPlay < 2) {
      setCurrentPlay(prev => prev + 1);
      resetMatch();
    } else if (currentRound < 3) {
      setCurrentRound(prev => prev + 1);
      setCurrentPlay(1);
      resetMatch();
    } else {
      // Tournament finished
      setCurrentPage('winner');
    }
  };

  const SetupModal = () => (
    showSetup && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-50 rounded-2xl p-8 max-w-md w-full border border-neutral-200 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-neutral-800 text-center">Setup Competitors</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-neutral-700">Player 1</h3>
              <input
                type="text"
                value={setupPlayer1Name}
                onChange={(e) => setSetupPlayer1Name(e.target.value)}
                placeholder="Robot name"
                className="w-full p-3 border border-neutral-300 rounded-lg mb-2 focus:border-neutral-500 focus:outline-none bg-white text-neutral-800"
              />
              <input
                type="number"
                value={setupPlayer1HP}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1) {
                    setSetupPlayer1HP(value);
                  } else if (e.target.value === '') {
                    setSetupPlayer1HP(100);
                  }
                }}
                min="1"
                max="200"
                className="w-full p-3 border border-neutral-300 rounded-lg focus:border-neutral-500 focus:outline-none bg-white text-neutral-800"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-neutral-700">Player 2</h3>
              <input
                type="text"
                value={setupPlayer2Name}
                onChange={(e) => setSetupPlayer2Name(e.target.value)}
                placeholder="Robot name"
                className="w-full p-3 border border-neutral-300 rounded-lg mb-2 focus:border-neutral-500 focus:outline-none bg-white text-neutral-800"
              />
              <input
                type="number"
                value={setupPlayer2HP}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1) {
                    setSetupPlayer2HP(value);
                  } else if (e.target.value === '') {
                    setSetupPlayer2HP(100);
                  }
                }}
                min="1"
                max="200"
                className="w-full p-3 border border-neutral-300 rounded-lg focus:border-neutral-500 focus:outline-none bg-white text-neutral-800"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setShowSetup(false)}
              className="flex-1 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applySetup}
              className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    )
  );

  const HomePage = () => (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-8 text-neutral-800">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="text-sm font-medium text-neutral-600 mb-4 tracking-wide">MINDX TECHNOLOGY SCHOOL</div>
          <h1 className="text-7xl font-light mb-6 text-neutral-900 tracking-tight">
            VEX IQ
          </h1>
          <h2 className="text-6xl font-light mb-8 text-neutral-700 tracking-tight">
            BATTLE TOURNAMENT
          </h2>
          <div className="bg-neutral-900 text-white px-8 py-4 rounded-sm text-xl font-medium inline-block mb-8 tracking-wide">
            PXL-ROB-SEMIA04/05
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-light mb-6 text-neutral-800 tracking-tight">VEX IQ Robot Battle Tournament</h3>
            <p className="text-lg leading-relaxed mb-8 text-neutral-600 font-light">
              Welcome to the ultimate VEX IQ robot battle championship. Watch as our robots compete in 
              intense battles across multiple rounds. Each match is a test of engineering, strategy, and skill.
            </p>
            <div className="space-y-3 text-base">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                <span className="text-neutral-700">Date: November 15th, 2025</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                <span className="text-neutral-700">Presented by: Class SEMIA04/05</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden h-80">
              <img 
                src="/mindx.jpg" 
                alt="VEX IQ Battle Tournament" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => setCurrentPage('rules')}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-4 px-12 rounded-sm text-lg transition-colors mr-4"
          >
            Enter Tournament →
          </button>
        </div>
      </div>
    </div>
  );

  const RulesPage = () => (
    <div className="min-h-screen bg-stone-50 p-8 text-neutral-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light mb-4 text-neutral-900 tracking-tight">
            VEX IQ ROBOT BATTLE
          </h1>
          <p className="text-xl text-neutral-600 font-light">Tournament Rules & Structure</p>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
            <div className="text-5xl font-light text-neutral-900 mb-2">3</div>
            <div className="text-lg text-neutral-600">Rounds</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
            <div className="text-5xl font-light text-neutral-900 mb-2">2</div>
            <div className="text-lg text-neutral-600">Plays per Round</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
            <div className="text-5xl font-light text-neutral-900 mb-2">2</div>
            <div className="text-lg text-neutral-600">Minutes per Play</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-white border border-neutral-200 rounded-lg p-8">
            <h2 className="text-2xl font-medium mb-6 text-neutral-900 flex items-center gap-3">
              <span className="text-xl">⚔️</span> Battle Structure
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-white">1</div>
                <div className="text-neutral-700">Tournament consists of <span className="font-medium text-neutral-900">3 rounds</span></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-white">2</div>
                <div className="text-neutral-700">Each round has <span className="font-medium text-neutral-900">2 plays</span></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-white">3</div>
                <div className="text-neutral-700">Each play lasts <span className="font-medium text-neutral-900">2 minutes</span></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center text-sm font-medium text-white">★</div>
                <div className="text-neutral-700">Each play awards <span className="font-medium text-neutral-900">3 points</span></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center text-sm font-medium text-white">✦</div>
                <div className="text-neutral-700">Final round points are <span className="font-medium text-neutral-900">doubled (×2)</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-8">
            <h2 className="text-2xl font-medium mb-6 text-neutral-900 flex items-center gap-3">
              <span className="text-xl">❌</span> Loss Conditions & Penalties
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-white">!</div>
                <div className="text-neutral-700">Robot <span className="font-medium text-neutral-900">HP reaches 0</span></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-white">!</div>
                <div className="text-neutral-700">Robot gets <span className="font-medium text-neutral-900">flipped and cannot recover</span></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-xs font-medium text-white">-2</div>
                <div className="text-neutral-700">Out of field penalty = <span className="font-medium text-neutral-900">-2 HP</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => setCurrentPage('battle')}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-4 px-12 rounded-sm text-lg transition-colors mr-4"
          >
            Start Tournament
          </button>
          <button 
            onClick={() => setCurrentPage('home')}
            className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium py-4 px-8 rounded-sm text-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );

  const BattlePage = () => (
    <div className="min-h-screen bg-stone-50 p-4 text-neutral-800 relative">
      <SetupModal />
      
      {winner && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-12 text-center max-w-lg shadow-2xl border border-neutral-200">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-4xl font-light mb-4 text-neutral-900">
              Victory
            </h2>
            <div className="text-2xl font-medium mb-6 text-neutral-800">
              {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
            </div>
            <div className="flex gap-4 justify-center text-2xl mb-8 text-neutral-500">
              <span>✨</span>
              <span>🎉</span>
              <span>✨</span>
            </div>
            <button 
              onClick={nextMatch}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-8 rounded-sm text-lg transition-colors"
            >
              {currentRound === 3 && currentPlay === 2 ? 'Finish Tournament' : 'Next Match'} →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light mb-2 text-neutral-900">
            ROUND {currentRound} - PLAY {currentPlay}
          </h1>
          {currentRound === 3 && (
            <div className="text-lg font-medium text-neutral-700">FINAL ROUND - DOUBLE POINTS</div>
          )}
          <div className="text-sm text-neutral-600 mt-2">
            Current Scores: {player1.name}: {overallScores.player1} pts | {player2.name}: {overallScores.player2} pts
          </div>
        </div>

        {/* Main Battle Interface */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Player 1 */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-medium text-neutral-900 mb-2">{player1.name}</h2>
              <div className="text-3xl mb-4">🤖</div>
            </div>
            
            {/* HP Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">HP</span>
                <span className="text-sm font-medium text-neutral-700">{player1.hp}/{player1.maxHp}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    player1.hp > player1.maxHp * 0.6 ? 'bg-neutral-800' :
                    player1.hp > player1.maxHp * 0.3 ? 'bg-neutral-600' :
                    'bg-neutral-500'
                  }`}
                  style={{ width: `${(player1.hp / player1.maxHp) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* HP Controls */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => adjustHP(1, -3)} className="bg-neutral-600 hover:bg-neutral-700 text-white py-2 rounded font-medium text-sm">-3 HP</button>
              <button onClick={() => adjustHP(1, -1)} className="bg-neutral-400 hover:bg-neutral-500 text-white py-2 rounded font-medium text-sm">-1 HP</button>
              <button onClick={() => applyOutOfFieldPenalty(1)} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium text-sm">Out of Field</button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button 
                onClick={() => startFlipTimer(1)} 
                disabled={flippedPlayer === 1}
                className={`w-full py-2 rounded font-medium text-sm ${
                  flippedPlayer === 1 ? 'bg-neutral-700 text-white' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                }`}
              >
                {flippedPlayer === 1 ? `Flipped! ${flipTimer}s` : 'Robot Flipped'}
              </button>
            </div>
          </div>

          {/* Center Control Panel */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-medium mb-4 text-neutral-900">Match Control</h2>
              
              {/* Main Timer */}
              <div className="mb-6">
                <div className="text-4xl font-light mb-2 text-neutral-900">{formatTime(playTimer)}</div>
                <div className="text-sm text-neutral-600 mb-3">Match Time</div>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => setPlayTimerActive(!playTimerActive)}
                    className={`px-4 py-2 rounded font-medium text-sm ${
                      playTimerActive ? 'bg-neutral-600 hover:bg-neutral-700 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    {playTimerActive ? 'Pause' : 'Start'}
                  </button>
                  <button 
                    onClick={() => {setPlayTimer(120); setPlayTimerActive(false);}}
                    className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded font-medium text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Flip Timer */}
              {flippedPlayer && (
                <div className="mb-6 p-4 bg-neutral-100 rounded-lg border border-neutral-200">
                  <div className="text-2xl font-medium text-neutral-900 mb-2">{flipTimer}s</div>
                  <div className="text-sm text-neutral-600 mb-3">Recovery Time</div>
                  <button 
                    onClick={stopFlipTimer}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium text-sm"
                  >
                    Recovered!
                  </button>
                </div>
              )}

              {/* Match Controls */}
              <div className="space-y-2">
                <button 
                  onClick={() => setShowSetup(true)}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2 rounded font-medium text-sm"
                >
                  Setup Players
                </button>
                <button 
                  onClick={resetMatch}
                  className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 py-2 rounded font-medium text-sm"
                >
                  Reset Match
                </button>
                <button 
                  onClick={() => setCurrentPage('rules')}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2 rounded font-medium text-sm"
                >
                  Back to Rules
                </button>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-medium text-neutral-900 mb-2">{player2.name}</h2>
              <div className="text-3xl mb-4">🤖</div>
            </div>
            
            {/* HP Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">HP</span>
                <span className="text-sm font-medium text-neutral-700">{player2.hp}/{player2.maxHp}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    player2.hp > player2.maxHp * 0.6 ? 'bg-neutral-800' :
                    player2.hp > player2.maxHp * 0.3 ? 'bg-neutral-600' :
                    'bg-neutral-500'
                  }`}
                  style={{ width: `${(player2.hp / player2.maxHp) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* HP Controls */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => adjustHP(2, -3)} className="bg-neutral-600 hover:bg-neutral-700 text-white py-2 rounded font-medium text-sm">-3 HP</button>
              <button onClick={() => adjustHP(2, -1)} className="bg-neutral-400 hover:bg-neutral-500 text-white py-2 rounded font-medium text-sm">-1 HP</button>
              <button onClick={() => applyOutOfFieldPenalty(2)} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium text-sm">Out of Field</button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button 
                onClick={() => startFlipTimer(2)} 
                disabled={flippedPlayer === 2}
                className={`w-full py-2 rounded font-medium text-sm ${
                  flippedPlayer === 2 ? 'bg-neutral-700 text-white' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                }`}
              >
                {flippedPlayer === 2 ? `Flipped! ${flipTimer}s` : 'Robot Flipped'}
              </button>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3 text-center text-neutral-900">Match Results</h3>
          <div className="grid grid-cols-6 gap-2 text-sm">
            {matchResults.map((result, index) => (
              <div key={index} className="bg-neutral-50 p-2 rounded text-center border border-neutral-100">
                <div className="font-medium text-neutral-900">R{result.round}P{result.play}</div>
                <div className="text-xs text-neutral-600">{result.winner === 'Draw' ? 'Draw' : result.winner}</div>
                <div className="text-xs text-neutral-800">{result.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const WinnerPage = () => {
    const overallWinner = overallScores.player1 > overallScores.player2 ? player1.name :
                         overallScores.player2 > overallScores.player1 ? player2.name : 'Draw';

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8 text-neutral-800 relative overflow-hidden">
        {/* Minimal animated elements */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 10 + 15}px`,
                color: '#a3a3a3'
              }}
            >
              ✦
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl">
          <div className="mb-8">
            <div className="text-6xl mb-6">🏆</div>
            <h1 className="text-6xl font-light mb-6 text-neutral-900 tracking-tight">
              CHAMPION
            </h1>
            <div className="text-3xl font-light mb-8 text-neutral-700">
              {overallWinner === 'Draw' ? "Perfect Draw" : `${overallWinner} Wins`}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-medium mb-6 text-neutral-900">Final Tournament Results</h2>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className={`p-6 rounded-lg border-2 ${overallScores.player1 > overallScores.player2 ? 'border-neutral-800 bg-neutral-50' : 'border-neutral-200 bg-white'}`}>
                <div className="text-xl font-medium mb-2 text-neutral-900">{player1.name}</div>
                <div className="text-4xl font-light text-neutral-800">{overallScores.player1}</div>
                <div className="text-sm text-neutral-600">Points</div>
              </div>
              <div className={`p-6 rounded-lg border-2 ${overallScores.player2 > overallScores.player1 ? 'border-neutral-800 bg-neutral-50' : 'border-neutral-200 bg-white'}`}>
                <div className="text-xl font-medium mb-2 text-neutral-900">{player2.name}</div>
                <div className="text-4xl font-light text-neutral-800">{overallScores.player2}</div>
                <div className="text-sm text-neutral-600">Points</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-4 text-neutral-400">
                ✨ 🏆 ✨
              </div>
              <p className="text-lg text-neutral-600 mb-6 font-light">
                Congratulations to all participants! Amazing battles were fought today.
              </p>
            </div>
          </div>

          <div className="space-x-4">
            <button 
              onClick={() => {
                setCurrentPage('home');
                setCurrentRound(1);
                setCurrentPlay(1);
                setOverallScores({ player1: 0, player2: 0 });
                setMatchResults([]);
                resetMatch();
              }}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium py-4 px-12 rounded-sm text-lg transition-colors"
            >
              Return to Home
            </button>
            <button 
              onClick={() => {
                setCurrentPage('battle');
                setCurrentRound(1);
                setCurrentPlay(1);
                setOverallScores({ player1: 0, player2: 0 });
                setMatchResults([]);
                resetMatch();
              }}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-4 px-12 rounded-sm text-lg transition-colors"
            >
              New Tournament
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render logic
  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'rules':
      return <RulesPage />;
    case 'battle':
      return <BattlePage />;
    case 'winner':
      return <WinnerPage />;
    default:
      return <HomePage />;
  }
};

export default VEXBattleSystem;