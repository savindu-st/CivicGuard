# Civic Guard: Coordinating City Response to Floods and Road Hazards

> **Civic Guard** is an end-to-end civic emergency coordination platform designed to verify citizen reports during severe weather, maintain a real-time trusted hazard map, deliver proactive warnings and safe evacuation routes to people at risk, and streamline dispatch for field crews and relief coordinators.

---

## 1. Executive Summary

During heavy rainstorms and flash floods, urban infrastructures face rapid degradation: storm drains clog, rivers burst their banks, roads submerge, and trees collapse faster than municipal councils can detect. While citizens frequently post warnings and pleas for help on social media, emergency response teams struggle to filter noise, verify authenticity, pinpoint exact geographic coordinates, and prioritize critical rescues.

**Civic Guard** bridges this critical gap through a **hybrid intelligence pipeline** combining deterministic geospatial/hydrological rules with computer vision and multimodal AI. It empowers local governments to cut through misinformation, alert vulnerable populations proactively, deploy repair crews swiftly, and match displaced citizens to verified shelters with available capacity.

---

## 2. Core Problem Statement

Traditional disaster reporting and dispatch mechanisms fail in three key areas during intense storm events:

1. **Information Overload & Misinformation**: Social media feeds become flooded with unverified photos, duplicate alerts, and outdated rumors, overwhelming dispatchers.
2. **Delayed Hazard Detection**: Council monitoring infrastructure (physical inspections, manual phone hotlines) cannot scale at the speed of rising floodwaters and falling trees.
3. **Disconnected Response Operations**: Field crews, relief coordinators, council officers, and citizens operate in informational silos, leading to misallocated emergency supplies, blocked rescue routes, and delayed road closures.

---

## 3. User Personas & Roles

Civic Guard serves four primary user roles, supported by system administration:

| Role | Responsibility | Key Platform Capabilities |
| :--- | :--- | :--- |
| **Citizen** | Reports local hazards and requests urgent humanitarian assistance | • Submits geotagged hazard photos (floods, fallen trees, blocked roads)<br>• Sends SOS help requests with household/mobility details<br>• Receives hyper-local area alerts, road closure notices, and safe detour routes<br>• Confirms or refutes nearby pending hazard reports |
| **Council Officer** | Triages incidents and coordinates cross-ward municipal response | • Monitors real-time Ward-by-Ward Control Dashboard<br>• Reviews AI-triaged hazard tickets and risk urgency scores<br>• Issues official road closures and area warnings<br>• Dispatches specialized field crews with priority queues |
| **Field Crew** | Resolves physical hazards on the ground | • Receives turn-by-turn mobile dispatch tickets with situational context<br>• Navigates to incident scenes avoiding confirmed closed roads<br>• Resolves hazards on-site and closes tickets by uploading proof-of-resolution photos<br>• Triggers immediate public map updates upon hazard clearance |
| **Relief Coordinator** | Manages emergency shelter logistics and humanitarian aid | • Accesses dedicated Relief Desk view<br>• Tracks real-time shelter bed capacity and medical/food resources<br>• Matches citizen SOS requests to nearest available shelters<br>• Coordinates emergency supply drop-offs and volunteer transport |
| **System Administrator** | Maintains platform integrity and data feeds | • Manages ward boundaries, telemetry thresholds, and road closures<br>• Audits AI confidence metrics and review queues<br>• Moderates bad actors and bans persistent false reporters |

---

## 4. Key Functional Features

### 4.1 Citizen Reporting & Help Requests
- **One-Tap Multi-Hazard Reporting**: Intuitive UI for reporting floods, blocked roads, and fallen trees with live camera capture and automatic GPS geofencing.
- **SOS Help Dispatch**: Dedicated workflow for stranded citizens to request medical assistance, evacuation, food, or dry shelter, including family size and special needs indicators.
- **Offline Resiliency**: Client-side storage queues reports locally if cellular connectivity drops during extreme storms, syncing automatically when connectivity is restored.

### 4.2 Automated Environmental Monitoring (Weather & River Feeds)
- **Autonomous Warning Engine**: Ingests live telemetry (or simulated feeds) of precipitation intensity and river water-level gauges.
- **Proactive Threshold Triggers**: Automatically generates area flood warnings and flags low-lying flood basins before citizen reports even arrive.

### 4.3 Hybrid Verification Architecture
Civic Guard balances speed, reliability, and computational cost through a two-tier verification architecture:
- **Deterministic Plain-Code Engine**:
  - *Spatio-temporal Clustering*: Automatically links reports within 200 meters submitted within rolling time windows.
  - *Weather Telemetry Correlation*: Validates whether local gauge levels and rainfall history physically corroborate reported surface flooding.
- **Multimodal AI Engine**:
  - *Computer Vision Classifier*: Analyzes citizen photos to verify hazard type (flood water vs. fallen tree vs. debris), detect water depth/severity, and filter out irrelevant/spam uploads.
  - *Location Scene & EXIF Validator*: Assesses image metadata and visual scene cues against reported geolocation to flag recycled or deceptive images.
  - *Risk Urgency Grader*: Dynamically evaluates risk factoring road hierarchy (arterial vs. local), nearby critical facilities (hospitals, schools), and rising water rates.

### 4.4 Real-Time Trusted Hazard Map & Evacuation Routing
- **Public Real-Time Map**: Dynamic map interface displaying verified hazards, closed roads, operational shelters, and safe transit corridors.
- **Intelligent Detours & Safe Routes**: Calculates detour trajectories that steer drivers and pedestrians away from active hazard zones.

### 4.5 Closed-Loop Field Operations & Feedback
- **Photo-Verified Resolution**: Field crews close incident tickets by capturing post-repair imagery, ensuring transparent council accountability and immediately opening cleared roads on the public map.
- **Continuous AI Feedback Loop**: Verified crew outcomes and officer decisions feed back into the Hazard Aggregator model to fine-tune future classification thresholds and reduce false positives.

---

## 5. End-to-End Core Acceptance Criteria

To satisfy complete operational requirements, the platform guarantees the following five end-to-end flows:

1. **Citizen Incident Reporting**: A citizen can submit a hazard report or help request complete with photo upload and GPS coordinates.
2. **Autonomous Gauge-Driven Warnings**: A mocked weather and river telemetry feed independently triggers area-wide warnings when safety thresholds are breached.
3. **Separation of Verification Concerns**:
   - Weather correlation and spatial clustering execute via plain, deterministic code.
   - Image authenticity, hazard classification, and location scene checks execute via AI vision models.
4. **Automated Alerting & Route Generation**: A confirmed flood automatically issues hyper-local alerts and broadcasts safe, detour-aware routes to all users in the affected zone.
5. **Lifecycle Closure & Map Synchronization**: A field crew dispatches to the scene, resolves the hazard, and submits a closure photo, which instantly marks the road open on the public hazard map.

---

## 6. Data Mocking & Simulation Plan

For development, testing, and staging demonstrations, Civic Guard includes a comprehensive simulation harness:

- **Historical Weather Replay Script**: Simulates a multi-hour torrential rain event, replaying hourly precipitation bursts and rising river gauge levels across target zones.
- **Synthetic Hazard Image Library**: Pre-categorized dataset of flood depths, fallen tree obstructions, road washouts, and edge-case non-hazards (e.g., puddles, unrelated memes).
- **Multi-Ward Synthetic Topology**: Realistic geographical coverage spanning several city wards with varying road hierarchies (primary highways, secondary roads, residential lanes).
- **Dynamic Shelter Capacities**: Simulated network of emergency shelters with fluctuating bed capacities, ADA accessibility attributes, and emergency food/medical stocks.

---

## 7. Stretch Goals

- **Dynamic Graph Detours**: Real-time recalculation of traffic navigation graphs routing emergency vehicles around dynamic water crests.
- **Automated Relief Matching**: Constraint-satisfaction routing matching citizen SOS requests directly to the nearest shelter that possesses available capacity and appropriate medical facilities.
