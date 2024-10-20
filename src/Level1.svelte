<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const ASL_SIGNS = {
    '1': 'https://asl-hands.s3.amazonaws.com/LSQ_1.jpg',
    '2': 'https://asl-hands.s3.amazonaws.com/LSQ_2.jpg',
    '3': 'https://asl-hands.s3.amazonaws.com/LSQ_3.jpg',
    '4': 'https://asl-hands.s3.amazonaws.com/LSQ_4.jpg',
    '5': 'https://asl-hands.s3.amazonaws.com/LSQ_5.jpg',
    '6': 'https://asl-hands.s3.amazonaws.com/LSQ_6.jpg',
    '7': 'https://asl-hands.s3.amazonaws.com/LSQ_7.jpg',
    '8': 'https://asl-hands.s3.amazonaws.com/LSQ_8.jpg',
    '9': 'https://asl-hands.s3.amazonaws.com/LSQ_9.jpg',
    '10': 'https://asl-hands.s3.amazonaws.com/LSQ_10.jpg'
  };

  let currentQuestion = '';
  let options = [];
  let health = 1;

  function newQuestion() {
    const numbers = Object.keys(ASL_SIGNS);
    currentQuestion = numbers[Math.floor(Math.random() * numbers.length)];
    let wrongAnswers = numbers.filter(num => num !== currentQuestion);
    wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random());
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

<div class="level1">
  <h1 class="ASLTitle">ASL Numbers Learning</h1>
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
  <button class="home-button" on:click={() => dispatch('back')}>Back</button>
</div>

<style>
  .level1 {
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

.home-button {
		position: absolute;
		bottom: 20px;
		left: 20px;
		background-color: transparent;
		color: #007bff;
		border: 2px solid #007bff;
		padding: 16px 32px;
		border-radius: 20px;
		cursor: pointer;
		font-size: 1em;
		transition: background-color 0.3s, color 0.3s;
	}

	.home-button:hover {
		background-color: #007bff;
		color: white;
	}

.ASLTitle{
  font-size: 35px;
}

	.dark .home-button {
		color: #4da6ff;
		border-color: #4da6ff;
	}

	.dark .home-button:hover {
		background-color: #4da6ff;
		color: #1a1a1a;
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
  .app-logo {
    display: none;
  }
</style>