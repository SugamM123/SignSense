<script>
	import { onMount } from 'svelte';
	import Level1 from './Level1.svelte';
	import Level2 from './Level2.svelte';
	import Level3 from './Level3.svelte';
  
	let currentScreen = 'home';
	let minutes = 0;
	let todayDate = '';
	let isDarkMode = true;

	onMount(() => {
	  updateDate();
	  startTimer();
	});
  
	function updateDate() {
	  const date = new Date();
	  todayDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	}
  
	function startTimer() {
	  setInterval(() => {
		minutes += 1;
	  }, 60000); // Update every minute
	}
  
	function navigateTo(screen) {
	  currentScreen = screen;
	}

	function toggleDarkMode() {
	  isDarkMode = !isDarkMode;
	}
</script>

<main class:dark={isDarkMode}>
	<button class="theme-toggle" on:click={toggleDarkMode}>
		{isDarkMode ? '☀️' : '🌙'}
	</button>

	{#if currentScreen === 'home'}
		<img src="tidal_logo.png" alt="Tidal Logo" class="app-logo" />
		<div class="home">
			<h1>Welcome back, Sarah!</h1>
			<div class="card progress-card">
				<h2>Today's Progress</h2>
				<p class="large-text">{minutes} minutes</p>
				<p>Time spent learning today</p>
			</div>
			<div class="card goal-card">
				<h2>Daily Goal</h2>
				<div class="progress-bar">
					<div class="progress" style="width: 50%;"></div>
				</div>
				<p>10 / 20 signs learned</p>
			</div>
			<button class="primary-btn" on:click={() => navigateTo('lessons')}>Continue Learning</button>
			<footer>
				<p>Developed by Tidal Hackathon Team</p>
				<p>Harsh Dave, Shlok Bhakta, Sugam Mishra, Mehul Jain</p>
				<p>{todayDate}</p>
			</footer>
		</div>
	{:else if currentScreen === 'lessons'}
		<div class="lesson">
			<h1>Choose a Level</h1>
			<button class="home-button" on:click={() => navigateTo('home')}>Home</button>
			<div class="level-buttons">
				<button class="button" on:click={() => navigateTo('level1')}>Level 1: Numbers</button>
				<button class="button" on:click={() => navigateTo('level2')}>Level 2: Alphabet</button>
				<button class="button" on:click={() => navigateTo('level3')}>Level 3: Phrases</button>
			</div>
		</div>
	{:else if currentScreen === 'level1'}
		<Level1 on:back={() => navigateTo('lessons')} />
	{:else if currentScreen === 'level2'}
		<Level2 on:back={() => navigateTo('lessons')} />
	{:else if currentScreen === 'level3'}
		<Level3 on:back={() => navigateTo('lessons')} />
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		transition: background-color 0.3s, color 0.3s;
	}

	main {
		font-family: 'Roboto', sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		transition: background-color 0.3s, color 0.3s;
	}

	main.dark {
		background-color: #1a1a1a;
		color: #ffffff;
	}

	.app-logo {
		display: block;
		margin: 0 auto;
		height: 150px;
		width: 150px;
		filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
	}

	.home, .lessons {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card {
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
		width: 100%;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: background-color 0.3s;
	}

	.dark .card {
		background-color: #2a2a2a;
	}

	.progress-card, .goal-card {
		background-color: #f0f0f0;
	}

	.dark .progress-card, .dark .goal-card {
		background-color: #2a2a2a;
	}

	.large-text {
		font-size: 2.5em;
		font-weight: bold;
		color: #007bff;
	}

	.dark .large-text {
		color: #4da6ff;
	}

	.progress-bar {
		background-color: #e0e0e0;
		height: 20px;
		border-radius: 10px;
		overflow: hidden;
	}

	.progress {
		background-color: #4caf50;
		height: 100%;
		transition: width 0.5s ease-in-out;
	}

	.primary-btn {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.2em;
		transition: background-color 0.3s, transform 0.1s;
		margin: 20px auto;
		display: block;
	}

	.primary-btn:hover {
		background-color: #0056b3;
		transform: translateY(-2px);
	}

	.dark .primary-btn {
		background-color: #4da6ff;
	}

	.dark .primary-btn:hover {
		background-color: #3a8ad6;
	}

	footer {
		margin-top: 40px;
		text-align: center;
		color: #666;
	}

	.dark footer {
		color: #aaa;
	}

	.lessons {
		background-color: #f9f9f9;
		border-radius: 10px;
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
		width: 100%;
		max-width: 600px;
		margin: 20px auto;
		padding: 30px;
	}

	.dark .lessons {
		background-color: #2a2a2a;
	}

	.level-buttons {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.level-buttons button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 16px 24px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1em;
		transition: background-color 0.3s, transform 0.1s;
	}

	.level-buttons button:hover {
		background-color: #0056b3;
		transform: translateY(-2px);
	}

	.dark .level-buttons button {
		background-color: #4da6ff;
	}

	.dark .level-buttons button:hover {
		background-color: #3a8ad6;
	}

	.button{
		margin: 8px;
		padding: 8px 16px; /* Adjust padding to fit content */
		white-space: nowrap; /* Prevents the text from wrapping */
		overflow: hidden; /* Prevents the text from overflowing */
		text-overflow: ellipsis; /* Adds ellipsis (...) when the text overflows */
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

	.dark .home-button {
		color: #4da6ff;
		border-color: #4da6ff;
	}

	.dark .home-button:hover {
		background-color: #4da6ff;
		color: #1a1a1a;
	}

	.theme-toggle {
		position: fixed;
		top: 20px;
		right: 20px;
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		z-index: 1000;
	}
</style>