<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  let videoSource: HTMLVideoElement;
  let canvas: HTMLCanvasElement;
  let loading = false;
  let streamActive = false;
  let results: Array<{ name: string, confidence: number }> = [];
  let frameCount = 0;
  let detectionInterval: number;
  let currentQuestion = '';
  let options = [];
  let health = 1;
  let isVideoChallenge = false;
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
  const dispatch = createEventDispatcher();

  const obtenerVideoCamara = async () => {
    try {
      loading = true;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoSource.srcObject = stream;
      await videoSource.play();
      streamActive = true;
      loading = false;
      startDetection();
    } catch (error) {
      console.log(error);
      loading = false;
    }
  };

  const stopStream = () => {
    if (videoSource.srcObject) {
      const tracks = (videoSource.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoSource.srcObject = null;
      streamActive = false;
      stopDetection();
    }
  };

  const captureAndDetect = () => {
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(videoSource, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');

      fetch('https://hack.shloklab.us/detect/', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          results = data.detections;
          checkVideoChallengeResult();
        })
        .catch(error => {
          console.error('Error:', error);
          results = [{ name: 'Error detecting objects', confidence: 0 }];
        });
    }, 'image/jpeg');
  };

  const checkVideoChallengeResult = () => {
    if (results.length > 0) {
      const detectedSign = results[0].name.toUpperCase();
      if (detectedSign === currentQuestion) {
        health = Math.min(1, health + 0.1);
        alert('Correct! Great job!');
        isVideoChallenge = false;
        newQuestion();
      } else {
        health = Math.max(0, health - 0.2);
        alert(`Incorrect. The correct answer was ${currentQuestion}. Try again!`);
        // Make sure the next question is the same failed one
        newQuestion(currentQuestion);
      }
    }
  };

  const startDetection = () => {
    detectionInterval = setInterval(() => {
      frameCount++;
      if (frameCount % 5 === 0) {
        captureAndDetect();
      }
    }, 1000 / 30); // 30 fps
  };

  const stopDetection = () => {
    clearInterval(detectionInterval);
    frameCount = 0;
  };

  onMount(() => {
    return () => {
      stopStream();
    };
  });

  function newQuestion(failedQuestion = '') {
    const letters = Object.keys(ASL_SIGNS);
    currentQuestion = failedQuestion || letters[Math.floor(Math.random() * letters.length)];
    let wrongAnswers = letters.filter(letter => letter !== currentQuestion);
    wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    options = [currentQuestion, ...wrongAnswers].sort(() => 0.5 - Math.random());

    isVideoChallenge = Math.random() > 0.8;
  }

  function handleAnswer(selectedAnswer) {
    if (selectedAnswer === currentQuestion) {
      health = Math.min(1, health + 0.1);
      alert('Correct! Great job!');
    } else {
      health = Math.max(0, health - 0.2);
      alert(`Incorrect. The correct answer was ${currentQuestion}. Try again!`);
      // Set the next question to the failed one
      newQuestion(currentQuestion);
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

  {#if isVideoChallenge}
    <div class="container">
      {#if loading}
        <h1>LOADING</h1>
      {/if}
      <div class="video-container">
        <video bind:this={videoSource} playsinline muted class:active={streamActive}></video>
      </div>
      <button on:click={streamActive ? stopStream : obtenerVideoCamara}>
        {streamActive ? 'STOP' : 'START'} CAMERA
      </button>
      <canvas bind:this={canvas} width="640" height="480" style="display:none;"></canvas>
      <div>
        <h2>Detected Objects:</h2>
        {#each results as detection}
          <p>{detection.name} (Confidence: {detection.confidence.toFixed(2)})</p>
        {/each}
      </div>
    </div>
  {/if}

  <div class="options">
    {#each options as option}
      <button on:click={() => handleAnswer(option)}>{option}</button>
    {/each}
  </div>
  <button on:click={() => dispatch('back')}>Back to Lessons</button>
</div>

 
 <style>
 .container {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 1rem;
 }
 .video-container {
     width: 100%;
     max-width: 400px;
     aspect-ratio: 16 / 9;
     overflow: hidden;
     background-color: #000;
 }
 video {
     width: 100%;
     height: 100%;
     object-fit: cover;
     display: none;
 }
 video.active {
     display: block;
 }
 button {
     padding: 0.5rem 1rem;
     font-size: 1rem;
     cursor: pointer;
 }
 </style>