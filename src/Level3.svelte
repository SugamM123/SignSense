<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let currentQuestion = '';
  let options = [];
  let health = 1;
  let currentVideoPath = '';
  let videoElement;

  const ASL_SIGNS = {
    'Nice to meet you': 'Nicetomeetyou.mp4',
    'And': 'And.mp4',
    'Us': 'Us.mp4',
    'Need': 'Need.mp4',
    'Thank you': 'Thankyou.mp4',
    'Good Morning': 'Goodmorning.mp4',
    'School': 'School.mp4',
    'Everyone': 'Everyone.mp4',
    'Mom': 'Mom.mp4',
    'Happy': 'Happy.mp4',
    'I love you': 'Iloveyou.mp4',
    'Understand': 'Understand.mp4',
    'See you later': 'Seeyoulater.mp4',
    'Dad': 'Dad.mp4',
    'Good job': 'Goodjob.mp4',
    "I don't like": "Idontlike.mp4",
    'Chocolate': 'Chocolate.mp4',
    'Come here please': 'Comehereplease.mp4',
    'Allow': 'Allow.mp4',
    'Food is good': 'Foodisgood.mp4',
    'Pen?': 'Pen.mp4',
    'Trick or Treat?': 'Trickortreat.mp4',
    'I am sorry': 'Iamsorry.mp4',
    'Where do you live?': 'Wheredoyoulive.mp4',
    'Texas': 'Texas.mp4',
    'I am deaf': 'Iamdeaf.mp4'
  };

  function newQuestion() {
    const phrases = Object.keys(ASL_SIGNS);
    currentQuestion = phrases[Math.floor(Math.random() * phrases.length)];
    currentVideoPath = `level3videos/${ASL_SIGNS[currentQuestion]}`;
    console.log('Current video path:', currentVideoPath); // Log the path for debugging
    let wrongAnswers = phrases.filter(phrase => phrase !== currentQuestion);
    wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random());
    loadAndPlayVideo();
  }

  function loadAndPlayVideo() {
    if (videoElement) {
      videoElement.load();
    }
  }

  function handleAnswer(selectedAnswer) {
    if (selectedAnswer === currentQuestion) {
      health = Math.min(1, health + 0.1);
      alert('Correct! Great job!');
    } else {
      health = Math.max(0, health - 0.2);
      alert(`Incorrect. The correct answer was "${currentQuestion}". Try again!`);
    }
    newQuestion();
  }

  function getHealthColor() {
    if (health > 0.6) return 'bg-green-500';
    if (health > 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function replayVideo() {
    if (videoElement) {
      videoElement.currentTime = 0;
      videoElement.play();
    }
  }

  onMount(() => {
    newQuestion();
  });
</script>

<div class="level3">
  <h1>ASL Phrases Learning</h1>
  <div class="health-bar">
    <div class={getHealthColor()} style="width: {health * 100}%"></div>
  </div>
  <p>Health: {Math.round(health * 100)}%</p>
  <p>What phrase is being signed?</p>
  <video bind:this={videoElement} src={currentVideoPath} controls muted width="560" height="315"></video>
  <button class="replay_button" on:click={replayVideo}>Replay Video</button>
  <div class="options">
    {#each options as option}
      <button on:click={() => handleAnswer(option)}>{option}</button>
    {/each}
  </div>
  <button class="home-button" on:click={() => dispatch('back')}>Back to Lessons</button>
</div>

<style>
  .level3 {
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

  .home-button {
		position: relative;
		bottom: 0;
    left: 0;
		background-color: transparent;
		color: #007bff;
		border: 2px solid #007bff;
		padding: 16px 32px;
		border-radius: 20px;
		cursor: pointer;
		font-size: 1em;
		transition: background-color 0.3s, color 0.3s;
    margin-top: 20px;
	}
  .health-bar div {
    height: 100%;
    transition: width 0.3s ease-in-out;
  }

  .bg-green-500 { background-color: #48bb78; }
  .bg-yellow-500 { background-color: #ecc94b; }
  .bg-red-500 { background-color: #f56565; }

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
    margin: 10px 0;
  }
  .replay_button {
    background-color: #ff0000;
  }
</style>
