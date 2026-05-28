// ============================================================
// Noise Suppression Processor
// ============================================================
// Uses Web Audio API with a simple noise gate + high-pass filter
// as a fallback. For production, integrate RNNoise WASM.
// ============================================================

export class NoiseSuppressor {
  private context: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private processorNode: AudioWorkletNode | null = null;
  private noiseGateNode: GainNode | null = null;
  private _enabled = false;
  private _audioLevel = 0;
  private animationFrame: number | null = null;
  private originalStream: MediaStream | null = null;

  get enabled(): boolean {
    return this._enabled;
  }

  get audioLevel(): number {
    return this._audioLevel;
  }

  /**
   * Initialize noise suppression on a media stream.
   * Returns a new MediaStream with noise suppression applied.
   */
  async initialize(stream: MediaStream): Promise<MediaStream> {
    this.originalStream = stream;
    this.context = new AudioContext({ sampleRate: 48000 });

    // Create nodes
    this.sourceNode = this.context.createMediaStreamSource(stream);
    this.destinationNode = this.context.createMediaStreamDestination();

    // High-pass filter (remove low-frequency rumble)
    this.highPassFilter = this.context.createBiquadFilter();
    this.highPassFilter.type = "highpass";
    this.highPassFilter.frequency.value = 85;
    this.highPassFilter.Q.value = 0.7;

    // Low-pass filter (remove high-frequency hiss)
    this.lowPassFilter = this.context.createBiquadFilter();
    this.lowPassFilter.type = "lowpass";
    this.lowPassFilter.frequency.value = 14000;
    this.lowPassFilter.Q.value = 0.7;

    // Noise gate (reduce gain when input is below threshold)
    this.noiseGateNode = this.context.createGain();
    this.noiseGateNode.gain.value = 1;

    // Main gain node
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1;

    // Analyser for audio level metering
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Try to load RNNoise AudioWorklet
    try {
      await this.context.audioWorklet.addModule("/audio/noise-suppressor-worklet.js");
      this.processorNode = new AudioWorkletNode(
        this.context,
        "noise-suppressor-processor"
      );

      // Chain: source -> highpass -> rnnoise -> lowpass -> gate -> gain -> analyser -> destination
      this.sourceNode.connect(this.highPassFilter);
      this.highPassFilter.connect(this.processorNode);
      this.processorNode.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.noiseGateNode);
      this.noiseGateNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.destinationNode);
    } catch {
      // Fallback: simple filter chain without RNNoise
      console.warn(
        "RNNoise worklet not available, using fallback noise suppression"
      );

      this.sourceNode.connect(this.highPassFilter);
      this.highPassFilter.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.noiseGateNode);
      this.noiseGateNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.destinationNode);
    }

    // Start noise gate processing
    this.startNoiseGate();

    // Start audio level monitoring
    this.startLevelMonitoring();

    this._enabled = true;

    return this.destinationNode.stream;
  }

  /**
   * Simple noise gate implementation using analyser data
   */
  private startNoiseGate(): void {
    if (!this.analyserNode || !this.noiseGateNode || !this.context) return;

    const dataArray = new Float32Array(this.analyserNode.fftSize);
    const threshold = 0.01; // -40dB
    const attackTime = 0.01;
    const releaseTime = 0.1;

    const process = () => {
      if (!this._enabled || !this.analyserNode || !this.noiseGateNode || !this.context) {
        return;
      }

      this.analyserNode.getFloatTimeDomainData(dataArray);

      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Apply noise gate
      const now = this.context.currentTime;
      if (rms > threshold) {
        this.noiseGateNode.gain.linearRampToValueAtTime(1, now + attackTime);
      } else {
        this.noiseGateNode.gain.linearRampToValueAtTime(0.05, now + releaseTime);
      }

      this.animationFrame = requestAnimationFrame(process);
    };

    this.animationFrame = requestAnimationFrame(process);
  }

  /**
   * Monitor audio level for UI display
   */
  private startLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const update = () => {
      if (!this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
      this._audioLevel = avg / 255;

      if (this._enabled) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  /**
   * Toggle noise suppression on/off
   */
  toggle(enabled: boolean): void {
    this._enabled = enabled;

    if (this.noiseGateNode && this.context) {
      if (enabled) {
        this.startNoiseGate();
        // Re-enable filter chain
        if (this.highPassFilter) {
          this.highPassFilter.frequency.value = 85;
        }
        if (this.lowPassFilter) {
          this.lowPassFilter.frequency.value = 14000;
        }
      } else {
        // Bypass filters by widening frequency range
        if (this.highPassFilter) {
          this.highPassFilter.frequency.value = 1;
        }
        if (this.lowPassFilter) {
          this.lowPassFilter.frequency.value = 24000;
        }
        // Open noise gate fully
        this.noiseGateNode.gain.value = 1;

        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
        }
      }
    }

    // Toggle AudioWorklet if available
    if (this.processorNode) {
      this.processorNode.port.postMessage({ type: "toggle", enabled });
    }
  }

  /**
   * Get the processed stream (or original if not initialized)
   */
  getProcessedStream(): MediaStream | null {
    return this.destinationNode?.stream || this.originalStream;
  }

  /**
   * Clean up all audio nodes
   */
  destroy(): void {
    this._enabled = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    try {
      this.sourceNode?.disconnect();
      this.highPassFilter?.disconnect();
      this.lowPassFilter?.disconnect();
      this.noiseGateNode?.disconnect();
      this.gainNode?.disconnect();
      this.analyserNode?.disconnect();
      this.processorNode?.disconnect();
    } catch {
      // Nodes may already be disconnected
    }

    this.context?.close();

    this.context = null;
    this.sourceNode = null;
    this.destinationNode = null;
    this.highPassFilter = null;
    this.lowPassFilter = null;
    this.noiseGateNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.processorNode = null;
    this.originalStream = null;
  }
}
