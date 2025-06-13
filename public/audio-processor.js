/**
 * Audio Worklet Processor for OpenAI Realtime API
 * Handles real-time audio capture and streaming
 */

class RealtimeAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type } = event.data;
      
      switch (type) {
        case 'start':
          this.isRecording = true;
          this.bufferIndex = 0;
          break;
        case 'stop':
          this.isRecording = false;
          break;
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input.length > 0 && this.isRecording) {
      const inputChannel = input[0];
      
      // Process audio data
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        // When buffer is full, send to main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Convert Float32Array to PCM16
          const pcm16Buffer = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            // Clamp to [-1, 1] and convert to 16-bit PCM
            const sample = Math.max(-1, Math.min(1, this.buffer[j]));
            pcm16Buffer[j] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          
          // Send audio data to main thread
          this.port.postMessage({
            type: 'audio',
            data: pcm16Buffer.buffer
          });
          
          // Reset buffer
          this.bufferIndex = 0;
        }
      }
    }
    
    return true;
  }
}

registerProcessor('realtime-audio-processor', RealtimeAudioProcessor);