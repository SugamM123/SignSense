<script>
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  const ASL_SIGNS = {
    'A': 'https://asl-hands.s3.amazonaws.com/gifs/A-Sign-Language-Alphabet.gif',
    'B': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-B-in-Sign-Language-ASL.gif',
    'C': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-say-letter-C-in-ASL-sign-Language.gif',
    'D': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-D-in-Sign-Language-ASL.gif',
    'E': 'https://asl-hands.s3.amazonaws.com/gifs/The-Letter-E-in-Sign-Language.gif',
    'F': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-F-in-Sign-Language-ASL.gif',
    'G': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-G-in-Sign-Language-ASL.gif',
    'H': 'https://asl-hands.s3.amazonaws.com/gifs/H-in-Sign-Language-Alphabet.gif',
    'I': 'https://asl-hands.s3.amazonaws.com/gifs/What-is-I-in-Sign-Language-ASL.gif',
    'J': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-J-in-ASL-Alphabets.gif',
    'K': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-J-in-ASL-Alphabets.gif',
    'L': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-L-in-ASL-Alphabets.gif',
    'M': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-M-in-ASL-Alphabets.gif',
    'N': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-N-in-ASL-Alphabets.gif',
    'O': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-O-in-ASL-Alphabets.gif',
    'P': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-P-in-ASL-Alphabets.gif',
    'Q': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Q-in-ASL-Alphabets.gif',
    'R': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-R-in-ASL-Alphabets.gif',
    'S': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-S-in-ASL-Alphabets.gif',
    'T': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-T-in-ASL-Alphabets.gif',
    'U': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-U-in-ASL-Alphabets.gif',
    'V': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-V-in-ASL-Alphabets.gif',
    'W': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-W-in-ASL-Alphabets.gif',
    'X': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-X-in-ASL-Alphabets.gif',
    'Y': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Y-in-ASL-Alphabets.gif',
    'Z': 'https://asl-hands.s3.amazonaws.com/gifs/How-to-Say-Letter-Z-in-ASL-Alphabets.gif',
};

  let currentQuestion = '';
  let options = [];
  let health = 1;

  function newQuestion() {
    const letters = Object.keys(ASL_SIGNS);
    currentQuestion = letters[Math.floor(Math.random() * letters.length)];
    let wrongAnswers = letters.filter(letter => letter !== currentQuestion);
    wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random());
    let isVisual = (Math.random() > 0.2);

  }

  function handleAnswer(selectedAnswer) {
    if (selectedAnswer === currentQuestion) {
      health = Math.min(1, health + 0.1);
      alert('Correct! Great job!');
    } else {
      health = Math.max(0, health - 0.2);
      alert(`Incorrect. The correct answer was ${currentQuestion}. Try again!`);
    }
    newQuestion();
  }

  function getHealthColor() {
    if (health > 0.6) return 'bg-green-500';
    if (health > 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  newQuestion();
</script>

<div class="level2">
  <h1>ASL Alphabet Learning</h1>
  <div class="health-bar">
    <div class={getHealthColor()} style="width: {health * 100}%"></div>
  </div>
  <p>Health: {Math.round(health * 100)}%</p>
  <img src={ASL_SIGNS[currentQuestion]} alt="ASL sign" />
  <div class="options">
    {#each options as option}
      <button on:click={() => handleAnswer(option)}>{option}</button>
    {/each}
  </div>
  <button on:click={() => dispatch('back')}>Back to Lessons</button>
</div>

<style>
  .level2 {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .health-bar {
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .health-bar div {
    height: 100%;
    transition: width 0.3s ease-in-out;
  }

  .bg-green-500 { background-color: #48bb78; }
  .bg-yellow-500 { background-color: #ecc94b; }
  .bg-red-500 { background-color: #f56565; }

  img {
    width: 200px;
    height: 200px;
    object-fit: contain;
    margin: 20px 0;
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  button {
    background-color: #4299e1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
  }
</style>