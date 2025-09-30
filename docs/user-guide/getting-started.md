# Getting Started Guide

Welcome to OX Board! This guide will help you get up and running with the revolutionary gesture-controlled stem player in just a few minutes.

## What is OX Board?

OX Board is an AI-powered, gesture-controlled music production studio that transforms any space into a professional DJ environment. Using just your webcam and hand gestures, you can:

- 🎵 **Control multiple audio stems** (drums, bass, melody, vocals) independently
- 🎭 **Use natural hand gestures** like pinching, spreading, and fist gestures
- 🤖 **Get AI-powered mixing suggestions** for professional results
- 📱 **Work offline** with full PWA capabilities
- 🎛️ **Access professional DJ features** including waveform visualization and sync

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Camera**: Any standard webcam (720p recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: Modern multi-core processor (Intel i5 equivalent or better)

### Recommended Setup

- **Camera**: 1080p webcam with good low-light performance
- **Audio**: External speakers or headphones for accurate monitoring
- **Space**: Clear area in front of camera (2-3 feet) for gesture control
- **Lighting**: Good, even lighting for optimal gesture recognition

## Quick Start Installation

### Option 1: Web Version (Recommended)

1. **Open your browser** and navigate to the OX Board application
2. **Grant camera permissions** when prompted
3. **Allow microphone access** for audio input (optional)
4. **Start using gestures** immediately!

### Option 2: Install as Progressive Web App

1. **Click the install icon** in your browser's address bar
2. **Follow the installation prompts**
3. **Launch from your desktop** or home screen
4. **Enjoy native app performance** with offline capabilities

### Option 3: Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ox-board.git
cd ox-board

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## First Launch Setup

### 1. Camera Configuration

When you first launch OX Board, you'll be prompted to configure your camera:

1. **Select your camera** from the dropdown menu
2. **Adjust camera settings**:
   - Resolution: 1280x720 or higher for best performance
   - Frame rate: 30fps minimum, 60fps recommended
3. **Position your camera** so your hands are clearly visible
4. **Test gesture recognition** by making simple hand gestures

### 2. Audio Setup

Configure your audio settings for the best experience:

1. **Audio Input**: Select your microphone or audio interface (optional)
2. **Output Device**: Choose your speakers or headphones
3. **Monitoring**: Enable direct monitoring if using external audio hardware
4. **Test Audio**: Play the demo track to verify audio is working

### 3. Gesture Calibration

Calibrate gesture recognition for optimal performance:

1. **Open the gesture calibration panel**
2. **Follow the on-screen instructions**:
   - Make a fist with your dominant hand
   - Spread all five fingers wide
   - Pinch your thumb and index finger together
3. **Adjust sensitivity** if gestures feel too sensitive or not responsive enough
4. **Test each gesture** to ensure recognition is working properly

## Basic Usage Tutorial

### Loading Your First Track

1. **Click "Upload Track"** in the main interface
2. **Select an audio file** (MP3, WAV, FLAC supported)
3. **Wait for processing** - the track will be automatically separated into stems:
   - 🥁 Drums
   - 🎸 Bass
   - 🎹 Melody
   - 🎤 Vocals
4. **The track is now ready** for gesture control!

### Basic Gesture Controls

#### Volume Control (Pinch Gesture)

- **👌 Pinch closer together**: Decrease volume
- **👌 Pinch wider apart**: Increase volume
- **Try it**: Make a pinching motion with your dominant hand

#### Stem Selection (Point Gesture)

- **👆 Point at stem**: Select that stem for control
- **✊ Fist**: Mute/unmute the selected stem
- **Try it**: Point at different stems and make a fist

#### Effect Control (Spread Gesture)

- **🖐️ Spread fingers wider**: Increase effect intensity
- **🖐️ Bring fingers closer**: Decrease effect intensity
- **Try it**: Spread your fingers while pointing at a stem

### Using the Mixer Interface

#### Stem Mixer Panel

The main mixing interface shows all your stems with individual controls:

- **Volume Sliders**: Drag up/down to adjust volume
- **Mute Buttons**: Click to silence individual stems
- **Solo Buttons**: Click to hear only that stem
- **EQ Controls**: Adjust low, mid, and high frequencies
- **Pan Controls**: Position stems in stereo field

#### Visual Feedback

- **Waveforms**: See real-time audio visualization
- **Level Meters**: Monitor audio levels to prevent clipping
- **Gesture Indicators**: See which gestures are being recognized

### AI Assistant Features

#### Smart Recommendations

1. **Click the AI Assistant panel** to open recommendations
2. **View suggested mixes** based on your current audio
3. **Apply suggestions** with one click or refine them manually
4. **Learn from feedback** - the AI improves based on your preferences

#### Auto-Mixing

1. **Enable auto-mix mode** for hands-free mixing
2. **Set target mood or energy level**
3. **Let the AI create smooth transitions** between sections

## Troubleshooting Common Issues

### Camera Not Working

**Problem**: Camera feed doesn't appear or gesture recognition isn't working.

**Solutions**:

1. **Check permissions**: Ensure camera access is granted in browser settings
2. **Try different browser**: Some browsers have better camera support
3. **Update drivers**: Ensure camera drivers are up to date
4. **Check lighting**: Ensure good, even lighting on your hands
5. **Camera distance**: Position camera 2-3 feet away with clear view of hands

### Audio Issues

**Problem**: No sound or poor audio quality.

**Solutions**:

1. **Check audio device**: Select correct output device in settings
2. **Volume levels**: Ensure master volume and individual stem volumes are up
3. **Browser audio**: Some browsers require user interaction to enable audio
4. **External audio**: If using external hardware, check connections and drivers

### Gesture Recognition Problems

**Problem**: Gestures not being recognized properly.

**Solutions**:

1. **Recalibrate**: Run gesture calibration again
2. **Adjust sensitivity**: Lower sensitivity if too responsive, raise if not responsive enough
3. **Hand positioning**: Ensure hands are clearly visible and well-lit
4. **Background**: Avoid busy backgrounds that might confuse recognition
5. **Distance**: Keep hands at consistent distance from camera

### Performance Issues

**Problem**: Lagging, slow response, or high CPU usage.

**Solutions**:

1. **Close other applications**: Free up system resources
2. **Lower camera resolution**: Use 720p instead of 1080p if needed
3. **Reduce effects**: Disable complex effects if CPU usage is high
4. **Update browser**: Ensure you're using the latest browser version
5. **Check system requirements**: Verify your system meets minimum requirements

## Tips for Best Experience

### Optimal Gesture Setup

- **Lighting**: Use bright, even lighting - avoid harsh shadows or direct bright light
- **Background**: Use a plain background to help gesture recognition
- **Hand positioning**: Keep hands centered in camera view
- **Consistent distance**: Try to stay at the same distance from camera
- **Remove jewelry**: Watches or rings might interfere with recognition

### Audio Quality Tips

- **Monitor levels**: Keep levels in the green zone (-12dB to -6dB)
- **Use headphones**: Better for detailed mixing work
- **Room acoustics**: Consider room treatment for accurate monitoring
- **File quality**: Use high-quality audio files (44.1kHz, 16-bit minimum)

### Workflow Efficiency

- **Save presets**: Save your favorite gesture mappings and effect settings
- **Use keyboard shortcuts**: Learn keyboard shortcuts for common actions
- **Organize tracks**: Keep your track library organized for quick access
- **Regular calibration**: Recalibrate gestures weekly for best performance

## Getting Help

### Documentation

- **User Guide**: Complete guide to all features and capabilities
- **Gesture Reference**: Visual guide to all supported gestures
- **Troubleshooting**: Solutions to common problems
- **FAQ**: Frequently asked questions

### Community Support

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share tips with other users
- **Discord**: Join the community chat for real-time help

### Professional Support

- **Training Sessions**: Guided setup and advanced training
- **Custom Configuration**: Professional gesture and audio setup
- **Integration Support**: Help integrating with existing DJ/producer workflows

## What's Next?

Now that you're up and running with OX Board, explore these advanced features:

1. **Advanced Gestures**: Learn two-hand gestures and gesture recording
2. **Professional DJ Mode**: Access advanced DJ features and dual-deck mixing
3. **AI Integration**: Dive deeper into AI-powered mixing and recommendations
4. **Customization**: Customize gesture mappings and create effect chains
5. **Performance Mode**: Optimize for live performances and streaming

Happy mixing! 🎵✋
