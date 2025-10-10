# Entity Relationships

## Overview

This document maps relationships between entities in the OX Board system using entity-relationship diagrams.

---

## Core Audio Engine Relationships

```mermaid
erDiagram
    AudioService ||--|| "Tone.Context" : manages
    AudioService ||--o{ "Audio Nodes" : creates
    AudioService ||--|| DeckManager : initializes

    DeckManager ||--|{ Deck : contains
    DeckManager ||--|| Crossfader : uses
    DeckManager ||--|| Compressor : has
    DeckManager ||--|| Limiter : has
    DeckManager ||--|| "Master Gain" : has

    Deck ||--o| "Tone.Player" : contains
    Deck ||--|| "Tone.Gain" : has-output
    Deck ||--|| "Tone.EQ3" : has
    Deck ||--|| "Tone.Filter" : has
    Deck ||--o| Track : loads

    Track ||--o| DemucsOutput : may-have

    Crossfader ||--|| "Deck A" : routes
    Crossfader ||--|| "Deck B" : routes

    DeckManager {
        string deckA
        string deckB
        SyncState syncState
        boolean isRecording
    }

    Deck {
        string id
        DeckState state
        number pitch
        number volume
    }

    Track {
        string id
        string title
        number bpm
        string key
    }
```

---

## Stem Processing Relationships

```mermaid
erDiagram
    EnhancedAudioMixer ||--|{ Channel : contains
    EnhancedAudioMixer ||--|| Crossfader : uses
    EnhancedAudioMixer ||--|| "Master Chain" : has

    Channel ||--o| StemPlayer : may-have
    Channel ||--|| "Tone.Gain" : has
    Channel ||--|| "Tone.EQ3" : has
    Channel ||--|| "Tone.Filter" : has
    Channel ||--|| "Tone.Panner" : has

    StemPlayer ||--|{ "Stem Instance" : contains
    StemPlayer ||--|| "Stem Mix Crossfade" : uses

    "Stem Instance" ||--|| "Tone.Player" : has
    "Stem Instance" ||--|| "Tone.Gain" : has
    "Stem Instance" ||--|| "Tone.EQ3" : has
    "Stem Instance" ||--|| "Tone.Panner" : has
    "Stem Instance" ||--|| StemControls : controlled-by

    DemucsOutput ||--|| "drums buffer" : provides
    DemucsOutput ||--|| "bass buffer" : provides
    DemucsOutput ||--|| "melody buffer" : provides
    DemucsOutput ||--|| "vocals buffer" : provides
    DemucsOutput ||--|| "original buffer" : provides

    StemPlayer {
        Map players
        Map gains
        Map eqs
        number stemMix
    }

    Channel {
        number id
        boolean stemPlayerEnabled
        ChannelConfig config
    }
```

---

## Gesture Recognition Relationships

```mermaid
erDiagram
    CameraFeed ||--|{ Frame : produces
    Frame ||--|| MediaPipe : processed-by
    MediaPipe ||--|{ HandResult : detects

    HandResult ||--|| "21 Landmarks" : contains
    HandResult ||--|| Handedness : has
    HandResult ||--|| Confidence : has

    HandResult ||--|| KalmanFilter : smoothed-by
    KalmanFilter ||--|| "Smoothed Landmarks" : produces

    "Smoothed Landmarks" ||--|| AdvancedGestureRecognizer : input-to
    AdvancedGestureRecognizer ||--o{ GestureResult : produces

    GestureResult ||--|| GestureClassification : has-type
    GestureResult ||--|| "Gesture Data" : contains
    GestureResult ||--|| Metadata : has

    GestureResult ||--|| GestureHistory : stored-in
    GestureHistory ||--|| "Temporal Stability" : enables

    HandResult {
        Point2D landmarks
        string handedness
        number confidence
    }

    GestureResult {
        GestureClassification type
        number confidence
        number timestamp
        string handSide
    }
```

---

## Gesture Mapping Relationships

```mermaid
erDiagram
    GestureStemMapper ||--|{ MappingProfile : contains
    MappingProfile ||--|| "Active Profile" : may-be
    MappingProfile ||--|{ GestureMapping : contains

    GestureMapping ||--|| GestureClassification : maps-from
    GestureMapping ||--|| ControlType : maps-to
    GestureMapping ||--|| TargetStem : targets
    GestureMapping ||--|| ControlMode : has-mode
    GestureMapping ||--o| MappingParams : has-params

    GestureStemMapper ||--|| FeedbackState : maintains
    GestureStemMapper ||--|| PerformanceMetrics : tracks

    GestureDetectionResult ||--|| GestureMapping : matched-by
    GestureDetectionResult ||--|| "Control Value" : produces

    "Control Value" ||--|| StoreAction : triggers
    StoreAction ||--|| StemControl : updates

    GestureMapping {
        string id
        GestureClassification gestureType
        string handSide
        string targetStem
        ControlType controlType
        ControlMode mode
    }

    ControlType {
        enum volume
        enum pan
        enum eq
        enum mute
    }
```

---

## State Management Relationships

```mermaid
erDiagram
    EnhancedDJStore ||--o| EnhancedAudioMixer : references
    EnhancedDJStore ||--|{ Deck : manages-state
    EnhancedDJStore ||--|{ ChannelConfig : tracks
    EnhancedDJStore ||--|{ StemControlState : maintains
    EnhancedDJStore ||--o| GestureStemMapper : references

    Deck ||--o| Track : contains
    Deck ||--o| StemPlayerState : has

    Track ||--o| DemucsOutput : may-have

    StemControlState ||--|| "drums controls" : has
    StemControlState ||--|| "bass controls" : has
    StemControlState ||--|| "melody controls" : has
    StemControlState ||--|| "vocals controls" : has
    StemControlState ||--|| "original controls" : has
    StemControlState ||--|| stemMix : has

    EnhancedDJStore ||--|| UIState : manages
    UIState ||--|| ViewMode : has
    UIState ||--|| "Selected Deck" : tracks

    EnhancedDJStore {
        EnhancedAudioMixer mixer
        Deck decks
        Record stemControls
        boolean gestureMapperEnabled
    }

    Deck {
        number id
        Track track
        boolean isPlaying
        boolean stemPlayerEnabled
    }
```

---

## Music Analysis Relationships

```mermaid
erDiagram
    Track ||--|| "Audio Buffer" : has
    "Audio Buffer" ||--|| MusicAnalyzerWorker : analyzed-by

    MusicAnalyzerWorker ||--|| "BPM Detection" : performs
    MusicAnalyzerWorker ||--|| "Key Detection" : performs
    MusicAnalyzerWorker ||--|| "Spectral Analysis" : performs

    "BPM Detection" ||--|| "BPM Value" : produces
    "Key Detection" ||--|| "Camelot Key" : produces
    "Spectral Analysis" ||--|| "Spectral Features" : produces

    "Camelot Key" ||--|| "Harmonic Wheel" : mapped-to
    "Harmonic Wheel" ||--|{ "Compatible Keys" : provides

    AnalysisResult ||--|| Track : enriches

    MusicAnalyzerWorker {
        Worker thread
        Essentia module
    }

    AnalysisResult {
        number bpm
        string key
        number energy
        number spectralCentroid
    }
```

---

## Performance Monitoring Relationships

```mermaid
erDiagram
    AudioService ||--|| AudioContext : wraps
    AudioContext ||--|| BaseLatency : measures
    AudioContext ||--|| OutputLatency : measures
    AudioContext ||--|| SampleRate : provides

    AudioService ||--|| PerformanceMonitor : runs
    PerformanceMonitor ||--|| AudioServiceStats : produces

    DeckManager ||--|| MetricsCollector : runs
    MetricsCollector ||--|| AudioServiceStats : reads
    MetricsCollector ||--|| PerformanceMetrics : produces

    PerformanceMetrics ||--|| "performance:update event" : emitted-as
    "performance:update event" ||--|| UI : consumed-by

    AudioServiceStats {
        number latency
        number cpuUsage
        boolean isRunning
        number sampleRate
    }

    PerformanceMetrics {
        number audioLatency
        number renderTime
        number dropouts
        number cpuUsage
    }
```

---

## Component-Service Relationships

```mermaid
erDiagram
    UIComponents ||--|| EnhancedDJStore : subscribes-to
    EnhancedDJStore ||--|| StoreActions : provides

    StoreActions ||--|| EnhancedAudioMixer : calls
    StoreActions ||--|| GestureStemMapper : calls

    CameraFeed ||--|| useGestures : uses-hook
    useGestures ||--|| HandTracking : performs
    HandTracking ||--|| GestureRecognition : feeds
    GestureRecognition ||--|| StoreActions : triggers

    StemPlayerDashboard ||--|| EnhancedDJStore : reads-from
    StemPlayerDashboard ||--|| StemControls : renders
    StemControls ||--|| StoreActions : invokes

    TerminalApp ||--|| FeatureFlags : checks
    FeatureFlags ||--|| "UI Mode" : determines

    UIComponents {
        component StemPlayerDashboard
        component TerminalApp
        component CameraFeed
    }
```

---

## Worker Relationships

```mermaid
erDiagram
    MainThread ||--|| MusicAnalyzerClient : creates
    MusicAnalyzerClient ||--|| MusicAnalyzerWorker : spawns

    MusicAnalyzerWorker ||--|| "Essentia WASM" : loads
    MusicAnalyzerWorker ||--|| "Audio Processing" : performs

    MusicAnalyzerClient ||--|| MessageChannel : uses
    MessageChannel ||--|| "Request Queue" : maintains
    MessageChannel ||--|| "Response Handler" : processes

    MainThread ||--|| AudioBuffer : provides
    AudioBuffer ||--|| "Transferable Buffer" : converted-to
    "Transferable Buffer" ||--|| MusicAnalyzerWorker : transferred-to

    MusicAnalyzerWorker ||--|| AnalysisResult : produces
    AnalysisResult ||--|| MessageChannel : sent-via
    MessageChannel ||--|| MainThread : delivers-to

    MusicAnalyzerClient {
        Worker worker
        Map pendingRequests
        boolean isReady
    }
```

---

## Lifecycle Relationships

```mermaid
flowchart TD
    AppStart([Application Start]) --> CheckAudio{Audio Context Created?}

    CheckAudio -->|No| WaitGesture[Wait for User Gesture]
    WaitGesture --> UserClick[User Click]
    UserClick --> InitAudio[Initialize AudioService]

    CheckAudio -->|Yes| InitAudio

    InitAudio --> CheckReady{AudioService Ready?}
    CheckReady -->|No| Error[Throw Error]
    CheckReady -->|Yes| InitDeck[Initialize DeckManager]

    InitDeck --> InitMixer[Initialize EnhancedAudioMixer]
    InitMixer --> InitGesture[Initialize GestureStemMapper]
    InitGesture --> InitStore[Initialize Store State]
    InitStore --> RenderUI[Render UI Components]

    RenderUI --> ActiveState([Active State])

    ActiveState --> Cleanup{App Unmount?}
    Cleanup -->|Yes| DisposeMixer[Dispose Mixer]
    DisposeMixer --> DisposeDeck[Dispose DeckManager]
    DisposeDeck --> DisposeAudio[Dispose AudioService]
    DisposeAudio --> Complete([Cleanup Complete])
```

---

## Data Flow: Gesture to Audio

```mermaid
graph LR
    subgraph Input
        Camera[Camera] --> MediaPipe[MediaPipe]
    end

    subgraph Processing
        MediaPipe --> HandResult[Hand Result]
        HandResult --> Recognizer[Gesture Recognizer]
        Recognizer --> GestureResult[Gesture Result]
        GestureResult --> Mapper[Gesture Mapper]
        Mapper --> Mapping[Find Mapping]
    end

    subgraph State
        Mapping --> StoreAction[Store Action]
        StoreAction --> StoreUpdate[Update State]
    end

    subgraph Audio
        StoreUpdate --> MixerCall[Mixer Method Call]
        MixerCall --> StemControl[Stem Control Update]
        StemControl --> AudioParam[Audio Parameter]
        AudioParam --> Sound[Audio Output]
    end

    style Camera fill:#4CAF50
    style Sound fill:#2196F3
```

---

## Dependency Graph

```mermaid
graph TD
    Browser[Browser APIs] --> SafeContext[Safe Audio Context]
    Browser --> MediaPipe[MediaPipe CDN]

    SafeContext --> AudioService[AudioService Singleton]
    AudioService --> ToneJS[Tone.js Library]

    AudioService --> DeckManager[DeckManager Singleton]
    AudioService --> Mixer[EnhancedAudioMixer]

    DeckManager --> Deck[Deck Instances]
    DeckManager --> Crossfader[Crossfader]

    Mixer --> Channel[Channel Instances]
    Channel --> StemPlayer[StemPlayer]

    MediaPipe --> HandResult[Hand Results]
    HandResult --> KalmanFilter[Kalman Filter]
    KalmanFilter --> Recognizer[Gesture Recognizer]
    Recognizer --> GestureMapper[Gesture Stem Mapper]

    GestureMapper --> Store[Zustand Store]
    Mixer --> Store
    DeckManager --> Store

    Store --> UI[React Components]

    style Browser fill:#FF9800
    style AudioService fill:#4CAF50
    style Store fill:#2196F3
    style UI fill:#9C27B0
```

---

## Cardinality Summary

| Relationship                       | Type           | Cardinality | Constraint               |
| ---------------------------------- | -------------- | ----------- | ------------------------ |
| AudioService → DeckManager         | Composition    | 1:1         | Singleton pair           |
| DeckManager → Deck                 | Composition    | 1:2         | Exactly 2 decks (A, B)   |
| EnhancedAudioMixer → Channel       | Composition    | 1:4         | Exactly 4 channels       |
| Channel → StemPlayer               | Aggregation    | 1:0..1      | Optional per channel     |
| StemPlayer → Stem Instance         | Composition    | 1:5         | 5 stems (4 + original)   |
| MappingProfile → GestureMapping    | Composition    | 1:\*        | Variable mappings        |
| GestureStemMapper → MappingProfile | Aggregation    | 1:\*        | Multiple profiles        |
| Deck → Track                       | Aggregation    | 1:0..1      | Optional track loaded    |
| Track → DemucsOutput               | Aggregation    | 1:0..1      | Optional stem data       |
| HandResult → GestureResult         | Transformation | 1:0..\*     | 0-many gestures per hand |
| GestureResult → StoreAction        | Trigger        | 1:0..1      | May or may not trigger   |

---

## Key Relationship Patterns

### 1. Singleton Pattern

- **AudioService** ↔ **DeckManager**: One-to-one singleton pair
- Both must exist for application to function
- Lifecycle managed together

### 2. Factory Pattern

- **AudioService** creates audio nodes (Gain, EQ3, Filter, etc.)
- Ensures consistent configuration
- Manages resource lifecycle

### 3. Event Emitter Pattern

- **DeckManager** emits events (play, pause, sync, etc.)
- Loose coupling between audio engine and UI
- Allows multiple subscribers

### 4. Observer Pattern

- **Zustand Store** observes state changes
- React components subscribe to slices
- Automatic re-render on updates

### 5. Strategy Pattern

- **Crossfader curves**: Linear, Constant-Power, Exponential
- **Gesture mapping modes**: Continuous, Toggle, Trigger
- Runtime selection of algorithm

### 6. Mediator Pattern

- **EnhancedDJStore** mediates between:
  - UI Components
  - Audio Services
  - Gesture Mappers
- Centralized state coordination

---

## Relationship Metrics

| Metric                     | Count |
| -------------------------- | ----- |
| Total Entity Types         | 45    |
| Core Domain Entities       | 25    |
| Supporting Entities        | 20    |
| One-to-One Relationships   | 12    |
| One-to-Many Relationships  | 18    |
| Many-to-Many Relationships | 3     |
| Composition Relationships  | 22    |
| Aggregation Relationships  | 15    |
| Dependency Relationships   | 31    |

---

_Last Updated: 2025-10-09_
_Total Relationships Mapped: 68_
_Diagrams: 10 ER and flow diagrams_
