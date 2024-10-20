<script lang="ts">
  import { onMount } from 'svelte';
 
 let videoSource: HTMLVideoElement;
 let canvas: HTMLCanvasElement;
 let loading = false;
 let streamActive = false;
 let results: Array<{ name: string, confidence: number }> = [];
 let frameCount = 0;
 let detectionInterval: number;
 
 const obtenerVideoCamara = async () => {
     try {
         loading = true;
         const stream = await navigator.mediaDevices.getUserMedia({
             video: { facingMode: 'user' }
         });
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
     if (!canvas) return;
     
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
         })
         .catch(error => {
             console.error('Error:', error);
             results = [{ name: 'Error detecting objects', confidence: 0 }];
         });
     }, 'image/jpeg');
 };
 
 const startDetection = () => {
     detectionInterval = setInterval(() => {
         frameCount++;
         if (frameCount % 5 === 0) {
             captureAndDetect();
         }
     }, 1000 / 30); // Assuming 30 fps
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
 </script>
 
 <div class="container">
     {#if loading}
         <h1>LOADING</h1>
     {/if}
     <div class="video-container">
         <!-- svelte-ignore a11y-media-has-caption -->
         <video
             bind:this={videoSource}
             playsinline
             muted
             class:active={streamActive}
         ></video>
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