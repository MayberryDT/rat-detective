# Game Specification: "Rat Detective: Whisker Wars"  
**Multiplayer FPS for the 2025 Vibe Coding Game Jam**  
**Version: Minimum Viable Product (MVP)**  
**Date: March 18, 2025**  

This specification outlines the development of a web-based, multiplayer first-person shooter (FPS) featuring tactical rat combat in an immersive sewer environment. It adheres to the 2025 Vibe Coding Game Jam rules: 100% of code written by AI, web-accessible without login/signup, free-to-play, multiplayer-focused, and built for modern browsers.

## 1. Game Overview
**Title:** Rat Detective: Whisker Wars  
**Genre:** First-Person Shooter (FPS)  
**Theme:** Tactical rat combat in a noir sewer setting  
**Target Audience:** Players seeking fast-paced multiplayer action with strategic depth and unique gameplay mechanics.  

**Target Platform:** Web browser (desktop and mobile, e.g., iPhone Safari), hosted on a domain/subdomain (e.g., `ratdetective.fun`).  
**Players:** Supports 1–50 players on a single large map, with players able to join or leave at any time during rotating rounds.  
**Game Mode (MVP):** Persistent free-for-all, where players compete individually to achieve the highest score through kills and cheese token collection, with rounds rotating every 10 minutes.  
**Vibe:** Playful, competitive, and chaotic, with a rat detective twist—think trench-coated rats wielding cheese guns in a sewer labyrinth, underscored by squeaky sound effects and vibrant visuals.

## 2. Core Features
### 2.1 Gameplay Mechanics
- **Objective:** Each player starts with 100 health points. Players compete in a persistent free-for-all to achieve the highest score, earned by:
  - Eliminating opponents (+5 points per kill).
  - Collecting cheese clue tokens scattered across the map (+1 point per token).
- **Round Structure:** Rounds last 10 minutes, rotating continuously. At the end of each round, the player with the highest score is declared the round winner, scores reset, and a new round begins immediately. Players can join or leave at any time without disrupting gameplay.
- **Movement and Combat:**
  - Players control rat detectives with agile movement (walking, jumping, circle strafing, crouching) for dynamic combat.
  - Combat focuses on cheese-based weaponry with various tactical options.
  - Health regenerates slowly (1 point per second) when not taking damage.
  - Strategic use of cover and positioning is key to survival.
  - Players can use environmental features like vents, cheese holes, and sewer pipes for hiding or ambushing.
- **Map Interaction:**
  - Destructible elements (e.g., weak walls, cheese blocks) can be blown up with trap mines, adding chaos and strategy.
  - Cheese clue tokens respawn every 30 seconds across the map, ensuring constant action even with fluctuating player counts.
- **Physics-Based Fun:** Rats can slip on wet sewer patches or bounce off cheese piles, adding unpredictability to combat.

### 2.2 Multiplayer
- **Player Capacity:** Supports 1–50 players simultaneously on a single large map, with dynamic scaling to handle low (1 player) or high (50 players) participation.
- **Join/Leave Mechanics:** Players can join or leave at any time during a round without interrupting gameplay. New players start with 100 health and 0 score, spawning at random safe locations (e.g., away from other players).
- **Synchronization:** Uses WebSockets for real-time multiplayer state syncing (player positions, health, scores, cheese token locations), with client-side prediction and interpolation to handle latency and player churn.
- **No Teams:** Pure free-for-all, with no alliances or team-based mechanics for the MVP.

### 2.3 Rat-Themed Elements
- **Characters:** All players are rat detectives with a uniform appearance (e.g., trench coat, magnifying glass, whiskers), ensuring fairness and simplicity for MVP. No unlockables or character customization.
- **Levels:** One large map, "Sewer Sleuth Sanctuary," a sprawling 3D sewer network with:
  - Multiple levels (upper walkways, lower tunnels, mid-level platforms) to accommodate 1–50 players.
  - Hiding spots (vents, cheese holes, under pipes) for strategic play.
  - Scattered cheese clue tokens (respawn every 30 seconds).
  - Dynamic elements like dripping water slowing movement or cheese piles for cover.
- **Weapons and Items:** Only the three weapons listed above, with no upgrades or unlockables for MVP.

### 2.4 Game Mode (MVP)
- **Persistent Free-for-All:** Continuous 10-minute rounds with no breaks or downtime. Players compete individually to achieve the highest score within each round. At the end of a round, the top scorer is announced, scores reset, and a new round begins.
- **Scoring and Endgame:**
  - Display a real-time leaderboard on-screen (top 5 players by score).
  - No win animations or complex post-game screens—just a simple "Round Over" message showing the round winner and final scores for 5 seconds before the next round starts.
  - Players retain no progress or state between rounds (e.g., health, score resets).

### 2.5 No Social Features
- No chat, emotes, or social interaction features for MVP, focusing solely on gameplay to meet jam deadlines and simplicity goals.

## 3. Technical Requirements
### 3.1 Platform and Engine
- **Platform:** Web-based, accessible via any modern browser (Chrome, Firefox, Safari on desktop and mobile).
- **Engine:** ThreeJS for 3D rendering, ensuring lightweight performance and compatibility with mobile web.
- **AI Coding:** 100% of code generated by AI tools (e.g., Cursor's AI), including:
  - ThreeJS scene setup (sewer map, rat models, weapons).
  - Multiplayer syncing (WebSocket implementation for 1–50 players, dynamic join/leave).
  - Physics (movement, weapon effects, destructible terrain).
  - Mobile controls (NippleJS for touch-based aiming/shooting).
  - UI (score display, leaderboard, round timer).

### 3.2 Performance
- **No Loading Screens:** Game loads instantly (<2 seconds) with minimal assets (low-poly 3D models, basic textures, small audio files).
- **Mobile Optimization:** Works seamlessly on mobile web (e.g., iPhone Safari) with:
  - Touch controls using NippleJS (virtual joystick for movement, buttons for weapons).
  - Reduced polygon counts and optimized rendering for low-end devices, scalable for 1–50 players.
- **Network:** Lightweight WebSocket implementation for multiplayer, with client-side prediction to minimize latency (e.g., 100–200ms target latency) and handle player join/leave dynamically.

### 3.3 Assets
- **3D Models:** Low-poly rat detective model (trench coat, whiskers), sewer environment (pipes, platforms, cheese blocks), and weapons (cheese gun, tail whip, trap mine).
- **Textures:** Simple, vibrant textures (e.g., green sewer walls, yellow cheese, gray pipes) generated or sourced via AI tools.
- **Audio:** Squeaky rat sounds, cheese-throwing effects, and upbeat background music (royalty-free, lightweight MP3s).
- **Size Limit:** Total asset size <5MB for instant loading.

### 3.4 Hosting
- Host on a lightweight server (e.g., Vercel, Netlify) with a custom domain (e.g., `ratdetective.fun`).
- Use a CDN for global performance, especially for mobile users.

## 4. User Interface
- **Pre-Game:** Simple username prompt (text input, "Enter Rat Name") on a black screen with a rat silhouette, no login required.
- **In-Game:**
  - HUD shows health bar (top-left), ammo count (unlimited for cheese gun, cooldown timers for tail whip/trap mine), and mini-map (top-right, showing player dots and cheese tokens).
  - Real-time leaderboard (bottom-center, top 5 players by score).
  - Round timer (top-center, counting down from 10 minutes).
- **Post-Round:** "Round Over" screen for 5 seconds, showing the round winner and final scores, then automatically starts the next round.
- **Join/Leave Handling:** No disruption to gameplay—new players spawn at random safe locations, and leaving players are removed silently from the game state.

### 4.1 Controls
- **Desktop:**
  - Movement: WASD or arrow keys.
  - Aim/Look: Mouse (smooth rotation, no inversion option for MVP).
  - Shoot Cheese Gun: Left-click (continuous fire).
  - Tail Whip: Right-click (5-second cooldown).
  - Place Trap Mine: Spacebar (3 mines max, 10-second cooldown).
  - Jump: Shift (for navigating platforms).
- **Mobile (NippleJS):**
  - Virtual joystick (left side) for movement.
  - Buttons (right side): Shoot (cheese gun), Whip (tail), Mine (trap), Jump.
  - Aiming via touch drag on a secondary area or auto-aim with slight stickiness for mobile ease.

## 5. Development Plan (AI-Driven)
### 5.1 AI Coding Tasks (100%)
- **ThreeJS Setup:** AI generates code for the sewer map, rat model, and weapon models (e.g., "Write ThreeJS code for a low-poly rat detective with a trench coat and cheese gun").
- **Physics:** AI codes physics for movement (strafing, jumping), weapon effects (cheese projectiles, knockback), and destructible terrain (e.g., "Implement ThreeJS physics for a cheese block that explodes with trap mines").
- **Multiplayer Syncing:** AI generates WebSocket code for 1–50 player syncing, dynamic join/leave, and persistent rounds (e.g., "Write JavaScript for a WebSocket-based multiplayer FPS in ThreeJS with 1–50 players, client prediction, and rotating 10-minute rounds").
- **Mobile Controls:** AI integrates NippleJS for touch controls (e.g., "Create mobile touch controls for a ThreeJS FPS using NippleJS for movement and buttons for actions").
- **UI/UX:** AI codes the HUD, leaderboard, round timer, and username prompt (e.g., "Generate HTML/CSS/ThreeJS code for a simple FPS HUD with health, ammo, mini-map, and round timer").
- **Assets:** AI generates or sources low-poly 3D models, textures, and audio (e.g., "Design a low-poly sewer map in ThreeJS with pipes and cheese blocks").

### 5.2 No Manual Coding
- All code will be AI-generated, ensuring 100% compliance with the jam's rule. The developer will only prompt, review, and test AI output, ensuring functionality and performance.

### 5.3 Timeline
- **Day 1–2:** AI generates ThreeJS scene, physics, and basic rat model/weapon mechanics.
- **Day 3–4:** AI codes multiplayer syncing for 1–50 players, dynamic join/leave, and round rotation, test with varying player counts.
- **Day 5–6:** AI builds UI, optimizes for mobile, and tests performance (no loading screens).
- **Day 7:** Final testing, hosting on a domain, and submission by March 25, 2025.

## 6. Key Differentiators
- **Rat Detective Vibe:** Whimsical, cartoonish rat theme with cheese-based weapons and sewer environments, distinct from *GoldenEye*’s spy aesthetic.
- **Large-Scale Persistent Free-for-All:** Supports 1–50 players on one map, with open join/leave and rotating rounds, creating chaotic, *GoldenEye*-inspired battles with strategic depth.
- **Instant Play:** Lightweight design ensures no loading screens, aligning with jam rules and mobile accessibility.

## 7. Risks and Mitigations
- **Performance with 1–50 Players:** Risk of lag with up to 50 players. Mitigate by optimizing ThreeJS rendering, using client-side prediction, and testing on low-end mobile devices with varying player counts.
- **AI Coding Bugs:** Risk of incomplete or buggy AI code. Mitigate by carefully prompting AI, testing each component thoroughly, and iterating AI outputs to ensure functionality.
- **Mobile Compatibility:** Risk of touch controls feeling clunky or performance issues with 50 players. Mitigate by testing with NippleJS on iPhone/Android and refining based on feedback, prioritizing scalability.

## 8. Deliverables for MVP
- Web-hosted game at `ratdetective.fun` (or similar) with instant access, no login.
- Functional multiplayer FPS with 1–50 players, persistent free-for-all mode, rat detective theme, and cheese-based gameplay.
- Compatible on desktop and mobile web, with no loading screens or social features.
- 100% of code AI-generated, documented in comments (e.g., "Generated by Cursor's AI on March 2025").