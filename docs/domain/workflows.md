# Domain Workflows

## Overview

This document describes key workflows and process flows in the OX Board system using Mermaid diagrams.

---

## 1. Audio Initialization Workflow

### Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant AudioService
    participant SafeAudioContext
    participant DeckManager
    participant Browser

    User->>UI: Click/Touch (User Gesture)
    UI->>AudioService: initialize()
    AudioService->>SafeAudioContext: initialize()
    SafeAudioContext->>Browser: Check autoplay policy

    alt User Gesture Required
        Browser-->>SafeAudioContext: State: suspended
        SafeAudioContext-->>AudioService: Error: User gesture required
        AudioService-->>UI: Throw error with message
        UI-->>User: Show "Click to start" message
    else Gesture Detected
        Browser-->>SafeAudioContext: State: running
        SafeAudioContext-->>AudioService: Success
        AudioService->>AudioService: Create Tone.Context
        AudioService->>AudioService: Create master routing graph
        AudioService->>AudioService: Start performance monitoring
        AudioService-->>UI: Success
        UI->>DeckManager: initializeDecks()
        DeckManager->>DeckManager: Check AudioService.isReady()
        DeckManager->>DeckManager: Initialize Deck A & B
        DeckManager->>DeckManager: Connect audio chain
        DeckManager->>DeckManager: Start metrics monitoring
        DeckManager-->>UI: Success
        UI-->>User: Audio ready
    end
```

### Critical Path

1. **User Gesture** → Mandatory browser requirement
2. **AudioService Init** → Creates single shared context
3. **DeckManager Init** → Must wait for AudioService
4. **Audio Chain Connection** → Routing established
5. **Monitoring Start** → Performance tracking begins

**Total Time**: ~50-100ms from user gesture to audio ready

---

## 2. Track Loading & Playback Workflow

### State Machine

```mermaid
stateDiagram-v2
    [*] --> Empty: Deck Created
    Empty --> Loading: loadTrack(url)
    Loading --> Error: Load Failed
    Loading --> Loaded: Load Success
    Error --> Loading: Retry
    Loaded --> Playing: play()
    Playing --> Paused: pause()
    Paused --> Playing: play()
    Playing --> Stopped: stop()
    Stopped --> Loaded: Track remains loaded
    Loaded --> Empty: Unload track
    Playing --> Loading: Load new track

    note right of Loading
        - Fetch audio file
        - Decode audio buffer
        - Analyze BPM/Key (optional)
        - Create Tone.Player
    end note

    note right of Playing
        - Update currentTime (60fps)
        - Emit positionUpdate events
        - Check loop points
        - Monitor for beat sync
    end note
```

### Sequence for Track Load

```mermaid
sequenceDiagram
    participant UI
    participant Store
    participant Deck
    participant TonePlayer
    participant Analyzer

    UI->>Store: loadTrack(deckId, track)
    Store->>Deck: loadTrack(url, metadata)
    Deck->>TonePlayer: new Tone.Player(url)
    TonePlayer->>TonePlayer: Fetch & decode buffer

    par Parallel Processing
        Deck->>Analyzer: analyzeBPM(buffer)
        Analyzer-->>Deck: BPM result
    and
        Deck->>Analyzer: analyzeKey(buffer)
        Analyzer-->>Deck: Key result
    end

    Deck->>Deck: Update state with metadata
    Deck->>Store: Emit 'loaded' event
    Store->>UI: Update deck state
    UI->>UI: Show track info
```

---

## 3. Stem Separation & Loading Workflow

### Flow Diagram

```mermaid
flowchart TD
    Start([User selects stem separation]) --> CheckTrack{Track loaded?}
    CheckTrack -->|No| Error1[Show error: No track loaded]
    CheckTrack -->|Yes| SetProcessing[Set processing state]
    SetProcessing --> CallAPI[Call /api/stemify]

    CallAPI --> APIProcess{API Processing}
    APIProcess -->|Progress| UpdateProgress[Update progress bar]
    UpdateProgress --> APIProcess

    APIProcess -->|Success| ReceiveStems[Receive DemucsOutput]
    APIProcess -->|Failure| Error2[Show error message]

    ReceiveStems --> EnableStemPlayer[Enable stem player on channel]
    EnableStemPlayer --> LoadLoop{For each stem}

    LoadLoop --> LoadDrums[Load drums buffer]
    LoadLoop --> LoadBass[Load bass buffer]
    LoadLoop --> LoadMelody[Load melody buffer]
    LoadLoop --> LoadVocals[Load vocals buffer]
    LoadLoop --> LoadOriginal[Load original buffer]

    LoadDrums --> CreatePlayers[Create Tone.Players]
    LoadBass --> CreatePlayers
    LoadMelody --> CreatePlayers
    LoadVocals --> CreatePlayers
    LoadOriginal --> CreatePlayers

    CreatePlayers --> ConnectChain[Connect audio routing]
    ConnectChain --> UpdateState[Update stem controls state]
    UpdateState --> Complete([Stems ready])

    Error1 --> End([End])
    Error2 --> ClearProcessing[Clear processing state]
    ClearProcessing --> End
```

### Stem Player Audio Chain

```mermaid
graph LR
    Drums[Drums Player] --> DrumsGain[Drums Gain]
    Bass[Bass Player] --> BassGain[Bass Gain]
    Melody[Melody Player] --> MelodyGain[Melody Gain]
    Vocals[Vocals Player] --> VocalsGain[Vocals Gain]
    Original[Original Player] --> OriginalGain[Original Gain]

    DrumsGain --> DrumsEQ[Drums EQ3]
    BassGain --> BassEQ[Bass EQ3]
    MelodyGain --> MelodyEQ[Melody EQ3]
    VocalsGain --> VocalsEQ[Vocals EQ3]

    DrumsEQ --> DrumsPan[Drums Panner]
    BassEQ --> BassPan[Bass Panner]
    MelodyEQ --> MelodyPan[Melody Panner]
    VocalsEQ --> VocalsPan[Vocals Panner]

    DrumsPan --> StemMix[Stem Mix Bus]
    BassPan --> StemMix
    MelodyPan --> StemMix
    VocalsPan --> StemMix

    OriginalGain --> OriginalMix[Original Bus]

    StemMix --> Crossfade[Stem/Original Crossfade]
    OriginalMix --> Crossfade

    Crossfade --> Output[Channel Output]
```

---

## 4. Gesture Recognition Pipeline

### Data Flow

```mermaid
flowchart LR
    Camera[Camera Feed] --> MediaPipe[MediaPipe Hands]
    MediaPipe --> RawLandmarks[21 Hand Landmarks]

    RawLandmarks --> Normalize[Coordinate Normalization]
    Normalize --> Kalman[Kalman Filtering]
    Kalman --> SmoothedLandmarks[Smoothed Landmarks]

    SmoothedLandmarks --> Recognizer[AdvancedGestureRecognizer]

    Recognizer --> SingleHand{Single or Two-Hand?}

    SingleHand -->|Single| DetectSingle[Detect Single-Hand Gestures]
    SingleHand -->|Two| DetectTwo[Detect Two-Hand Gestures]

    DetectSingle --> Pinch[Pinch Detection]
    DetectSingle --> Fist[Fist Detection]
    DetectSingle --> Palm[Palm Open Detection]
    DetectSingle --> Swipe[Swipe Detection]

    DetectTwo --> TwoHandPinch[Two-Hand Pinch]
    DetectTwo --> Rotate[Rotation Detection]
    DetectTwo --> Spread[Spread Detection]

    Pinch --> Filter[Confidence Filtering]
    Fist --> Filter
    Palm --> Filter
    Swipe --> Filter
    TwoHandPinch --> Filter
    Rotate --> Filter
    Spread --> Filter

    Filter --> History[Gesture History]
    History --> Stability[Temporal Stability Check]

    Stability --> ValidGestures[Valid Gestures]
    ValidGestures --> Mapper[GestureStemMapper]

    Mapper --> Mapping{Find Active Mapping}
    Mapping --> ApplyControl[Apply to Stem Control]
    ApplyControl --> Store[Update Store State]
    Store --> Audio[Update Audio Parameters]
```

### Gesture Processing Timeline

```mermaid
gantt
    title Gesture-to-Audio Latency Breakdown (Target: 50ms)
    dateFormat X
    axisFormat %L ms

    section Capture
    Camera Frame Capture: 0, 16

    section Detection
    MediaPipe Hand Detection: 16, 32

    section Recognition
    Coordinate Normalization: 32, 35
    Kalman Filtering: 35, 38
    Gesture Classification: 38, 45

    section Mapping
    Find Active Mapping: 45, 47
    Calculate Control Value: 47, 49

    section Application
    Update Store State: 49, 50
    Apply Audio Parameter: 50, 52
```

**Total Latency**: ~52ms (within 50ms target for most cases)

---

## 5. Beat Sync Workflow

### Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant DeckManager
    participant MasterDeck
    participant SlaveDeck
    participant Transport

    User->>UI: Click "Sync" (Deck B to Deck A)
    UI->>DeckManager: sync("A")

    DeckManager->>MasterDeck: getBPM()
    MasterDeck-->>DeckManager: 128 BPM

    DeckManager->>SlaveDeck: getBPM()
    SlaveDeck-->>DeckManager: 140 BPM

    DeckManager->>DeckManager: Calculate pitch adjustment
    Note right of DeckManager: pitchDiff = (128/140 - 1) * 100<br/>= -8.57%

    DeckManager->>SlaveDeck: setPitch(-8.57)
    SlaveDeck->>SlaveDeck: Adjust playback rate

    DeckManager->>DeckManager: Update sync state
    Note right of DeckManager: syncState = {<br/>  master: "A",<br/>  slaveOffset: -8.57,<br/>  isLocked: true<br/>}

    DeckManager->>UI: Emit 'sync:engaged' event
    UI->>User: Show sync indicator

    loop Position Monitoring
        SlaveDeck->>DeckManager: Emit 'positionUpdate'
        DeckManager->>DeckManager: Calculate beat drift
        alt Drift > threshold
            DeckManager->>SlaveDeck: Micro pitch adjustment
        end
    end

    User->>UI: Click "Unsync"
    UI->>DeckManager: unsync()
    DeckManager->>SlaveDeck: setPitch(0)
    DeckManager->>UI: Emit 'sync:disengaged'
```

---

## 6. Recording Workflow

### State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: DeckManager Ready
    Idle --> Starting: startRecording()
    Starting --> Recording: Recorder Started
    Starting --> Error: Start Failed
    Recording --> Stopping: stopRecording()
    Stopping --> Idle: Blob Returned
    Error --> Idle: Clear Error

    note right of Recording
        - Tap master gain output
        - Tone.Recorder captures audio
        - Emit 'recording:start' event
        - Show recording indicator
    end note

    note right of Stopping
        - Stop recorder
        - Disconnect from master gain
        - Dispose recorder
        - Return audio Blob
        - Emit 'recording:stop' event
    end note
```

---

## 7. Crossfader Routing Workflow

### Audio Routing Diagram

```mermaid
flowchart TB
    subgraph DeckManager
        DeckA[Deck A Output]
        DeckB[Deck B Output]
    end

    subgraph Crossfader
        InputA[Input A]
        InputB[Input B]
        FadeLogic{Crossfader Position}
        OutputA[Attenuated A]
        OutputB[Attenuated B]
    end

    subgraph MasterChain
        MixBus[Mix Bus]
        Compressor[Compressor<br/>Threshold: -12dB<br/>Ratio: 4:1]
        Limiter[Limiter<br/>Threshold: -1dB]
        MasterGain[Master Gain]
        Destination[Audio Output]
    end

    DeckA --> InputA
    DeckB --> InputB

    InputA --> FadeLogic
    InputB --> FadeLogic

    FadeLogic -->|Position = 0<br/>A: 100%, B: 0%| OutputA
    FadeLogic -->|Position = 0.5<br/>A: 50%, B: 50%| OutputA
    FadeLogic -->|Position = 1<br/>A: 0%, B: 100%| OutputB

    OutputA --> MixBus
    OutputB --> MixBus

    MixBus --> Compressor
    Compressor --> Limiter
    Limiter --> MasterGain
    MasterGain --> Destination
```

### Crossfader Position Mapping

```mermaid
graph TD
    Position[Crossfader Position: 0.0 to 1.0]

    Position -->|0.0| FullA[Deck A: 100%<br/>Deck B: 0%]
    Position -->|0.25| MostlyA[Deck A: 75%<br/>Deck B: 25%]
    Position -->|0.5| Center[Deck A: 50%<br/>Deck B: 50%]
    Position -->|0.75| MostlyB[Deck A: 25%<br/>Deck B: 75%]
    Position -->|1.0| FullB[Deck A: 0%<br/>Deck B: 100%]

    style FullA fill:#4CAF50
    style Center fill:#FFC107
    style FullB fill:#2196F3
```

---

## 8. Performance Monitoring Workflow

### Data Collection Flow

```mermaid
flowchart TD
    Start([Performance Monitoring Started]) --> Interval{Every 1 second}

    Interval --> AudioService[AudioService.updatePerformanceStats]
    Interval --> DeckManager[DeckManager Performance Loop]

    AudioService --> GetContext[Get AudioContext]
    GetContext --> BaseLatency[Read baseLatency]
    GetContext --> OutputLatency[Read outputLatency]
    GetContext --> SampleRate[Read sampleRate]

    BaseLatency --> CalcTotal[Calculate Total Latency]
    OutputLatency --> CalcTotal

    CalcTotal --> EstimateCPU[Estimate CPU Usage]
    EstimateCPU --> UpdateStats[Update AudioServiceStats]

    DeckManager --> GetAudioStats[Get AudioService Stats]
    GetAudioStats --> BuildMetrics[Build PerformanceMetrics]

    BuildMetrics --> EmitEvent[Emit 'performance:update' Event]
    EmitEvent --> UIUpdate[UI Updates Performance Display]

    UIUpdate --> Interval
```

### Metrics Dashboard Data Flow

```mermaid
sequenceDiagram
    participant Timer
    participant AudioService
    participant DeckManager
    participant Store
    participant UI

    loop Every 1 second
        Timer->>AudioService: Tick
        AudioService->>AudioService: Update latency metrics
        AudioService->>AudioService: Estimate CPU usage

        Timer->>DeckManager: Tick
        DeckManager->>AudioService: getStats()
        AudioService-->>DeckManager: AudioServiceStats

        DeckManager->>DeckManager: Build PerformanceMetrics
        DeckManager->>Store: Emit 'performance:update'
        Store->>UI: Update performance state

        UI->>UI: Render metrics dashboard
        Note right of UI: - Audio Latency: 18ms<br/>- CPU Usage: 15%<br/>- Dropouts: 0<br/>- Sample Rate: 48kHz
    end
```

---

## 9. Error Handling Flow

### Error Propagation Strategy

```mermaid
flowchart TD
    Error([Error Occurs]) --> Classify{Error Type}

    Classify -->|Critical| AudioInit[Audio Initialization Error]
    Classify -->|Recoverable| DeckLoad[Deck Load Error]
    Classify -->|Warning| GestureError[Gesture Recognition Error]

    AudioInit --> BlockUI[Block UI - Show Error Modal]
    BlockUI --> UserAction{User Action}
    UserAction -->|Retry| Reinit[Reinitialize AudioService]
    UserAction -->|Cancel| GracefulFail[Disable Audio Features]

    DeckLoad --> EmitEvent[Emit 'deck:error' Event]
    EmitEvent --> ShowToast[Show Error Toast]
    ShowToast --> LogError[Log to Console]
    LogError --> ClearDeck[Clear Deck State]
    ClearDeck --> Continue([Continue Operation])

    GestureError --> LogWarning[Log Warning]
    LogWarning --> DisableGesture[Temporarily Disable Gesture]
    DisableGesture --> Retry{Auto Retry}
    Retry -->|Success| EnableGesture[Re-enable Gesture]
    Retry -->|Fail| Continue

    EnableGesture --> Continue
    GracefulFail --> Continue
    Reinit --> Continue
```

---

## 10. Multi-Channel Stem Mixing Workflow

### 4-Channel Mixer Architecture

```mermaid
graph TB
    subgraph Channel0[Channel 0]
        SP0[Stem Player 0]
        EQ0[EQ3]
        Filter0[Filter]
        Gain0[Gain]
    end

    subgraph Channel1[Channel 1]
        SP1[Stem Player 1]
        EQ1[EQ3]
        Filter1[Filter]
        Gain1[Gain]
    end

    subgraph Channel2[Channel 2]
        SP2[Stem Player 2]
        EQ2[EQ3]
        Filter2[Filter]
        Gain2[Gain]
    end

    subgraph Channel3[Channel 3]
        SP3[Stem Player 3]
        EQ3[EQ3]
        Filter3[Filter]
        Gain3[Gain]
    end

    SP0 --> EQ0 --> Filter0 --> Gain0
    SP1 --> EQ1 --> Filter1 --> Gain1
    SP2 --> EQ2 --> Filter2 --> Gain2
    SP3 --> EQ3 --> Filter3 --> Gain3

    Gain0 --> XF_A[Crossfader A]
    Gain1 --> XF_A
    Gain2 --> XF_B[Crossfader B]
    Gain3 --> XF_B

    XF_A --> Mix[Master Mix]
    XF_B --> Mix

    Mix --> MasterComp[Master Compressor]
    MasterComp --> MasterLim[Master Limiter]
    MasterLim --> MasterOut[Master Output]
```

---

## Workflow Metrics Summary

| Workflow               | Average Duration | Critical Path Steps | Error Handling              |
| ---------------------- | ---------------- | ------------------- | --------------------------- |
| Audio Initialization   | 50-100ms         | 5                   | Critical - blocking         |
| Track Loading          | 500ms-2s         | 4                   | Recoverable - retry         |
| Stem Separation        | 10-30s           | 7                   | Recoverable - show progress |
| Gesture Recognition    | 16-52ms          | 6                   | Graceful - log & continue   |
| Beat Sync              | <100ms           | 4                   | Recoverable - show error    |
| Recording Start        | <50ms            | 3                   | Recoverable - retry         |
| Performance Monitoring | 1s interval      | Continuous          | N/A - metrics only          |

---

_Last Updated: 2025-10-09_
_Total Workflows Documented: 10_
_Diagrams: 15 Mermaid charts_
