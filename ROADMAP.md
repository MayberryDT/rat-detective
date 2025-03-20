# Roadmap: Building "Rat Detective: Whisker Wars" in Cursor (Phased Development)

**Goal:** Build a web-based, multiplayer FPS rat detective game with 1–50 players, persistent free-for-all rounds, and no loading screens, using 100% AI-generated code in Cursor. Each phase is small, testable, and focuses on core functionality, allowing you to verify as a user before proceeding.

## Phase 1: Basic ThreeJS Scene (1–2 Hours)
- **Objective:** Create a minimal 3D sewer environment with a single rat detective model.
- **Tasks (AI Prompts in Cursor):**
  1. Generate a simple ThreeJS scene with a flat sewer floor (gray texture), basic walls (green texture), and a skybox (black or gray).
     - Prompt: "Write ThreeJS code for a simple 3D scene with a flat gray floor, green walls, and a black skybox, rendered in a web browser."
  2. Add a low-poly rat detective model (trench coat, whiskers) standing in the center, with basic animations (idle stance).
     - Prompt: "Generate ThreeJS code for a low-poly 3D rat detective model with a trench coat and whiskers, standing idle in the scene."
- **Testing as a User:** Load the webpage in a browser (desktop/mobile). Verify you see a 3D sewer environment with a rat model. Check for rendering issues or performance on mobile.
- **Output:** A static ThreeJS webpage (`index.html`, `script.js`) hosted locally or on Netlify.

## Phase 2: Basic Player Movement (2–3 Hours)
- **Objective:** Add basic movement controls for the rat detective (WASD, jump).
- **Tasks (AI Prompts in Cursor):**
  1. Modify the ThreeJS scene to add WASD movement and jumping for the rat model.
     - Prompt: "Add WASD movement and jump (Shift key) to the rat detective in the ThreeJS scene, with smooth physics-based movement."
  2. Ensure mobile compatibility with a virtual joystick using NippleJS for movement.
     - Prompt: "Integrate NippleJS into the ThreeJS scene for mobile touch controls, creating a virtual joystick for WASD movement."
- **Testing as a User:** Play as the rat, move around the sewer using WASD (desktop) or joystick (mobile), and jump. Verify smooth movement, no lag, and mobile responsiveness.
- **Output:** Updated `script.js` with movement logic, plus `index.html` linking NippleJS.

## Phase 3: Single-Player Combat (2–3 Hours)
- **Objective:** Add the cheese gun with basic firing mechanics.
- **Tasks (AI Prompts in Cursor):**
  1. Implement a cheese gun that fires rapid cheese projectiles (10 damage, short range, unlimited ammo) when clicking the mouse (desktop) or a button (mobile).
     - Prompt: "Add a cheese gun to the rat detective in ThreeJS that fires rapid cheese projectiles (short range, 10 damage) on left-click for desktop and a button for mobile, with simple physics."
  2. Add a basic HUD showing health (100 points) and ammo (unlimited, labeled "∞").
     - Prompt: "Create a ThreeJS or HTML/CSS HUD showing rat health (100) and ammo (∞) in the top-left corner."
- **Testing as a User:** Fire the cheese gun, watch projectiles fly, and check the HUD updates. Verify functionality on desktop (mouse) and mobile (button).
- **Output:** Updated `script.js` and `index.html` with combat and HUD.

## Phase 4: Mouse Controls and Camera (1–2 Hours)
- **Objective:** Implement proper FPS/TPS mouse controls and camera adjustments.
- **Tasks (AI Prompts in Cursor):**
  1. Add mouse-based aiming and character rotation.
     - Prompt: "Implement mouse-look controls in ThreeJS where moving the mouse rotates both the camera and the rat character, with proper third-person camera following."
  2. Adjust camera position and behavior for better gameplay.
     - Prompt: "Modify the ThreeJS camera to follow the rat more closely, with proper zoom level and smooth transitions during movement and rotation."
  3. Lock mouse pointer for desktop gameplay.
     - Prompt: "Add pointer lock controls for the mouse in ThreeJS, with proper enter/exit handling and cursor visibility states."
- **Testing as a User:** Move mouse to aim and turn character, verify camera follows smoothly, check pointer lock behavior.
- **Output:** Updated `movement.js` and `scene.js` with mouse controls and camera adjustments.

## Phase 5: Full-Size Map and Collision (2-3 Hours)
- **Objective:** Create a large sewer map with multiple levels and implement proper collision detection.
- **Tasks (AI Prompts in Cursor):**
  1. Design and implement a multi-level sewer map with platforms, tunnels, and strategic points.
     - Prompt: "Create a large ThreeJS sewer map with multiple levels, including upper walkways, lower tunnels, mid-level platforms, and strategic hiding spots like vents and pipes, optimized for 1-50 players."
  2. Add proper collision detection for walls, floors, and platforms.
     - Prompt: "Implement collision detection in ThreeJS using raycasting for the rat detective against walls, floors, platforms, and other map elements, ensuring smooth movement and preventing clipping."
- **Testing as a User:** Navigate the full map, verify collision with all surfaces, test platform jumping, and check for any clipping issues. Ensure smooth performance on both desktop and mobile.
- **Output:** Updated `scene.js` with full map geometry and collision system.

## Phase 6: Multiplayer Core (3–4 Hours)
- **Objective:** Add WebSocket support for 1–5 players, with basic syncing.
- **Tasks (AI Prompts in Cursor):**
  1. Set up a Node.js/Express backend on Heroku with WebSockets (using `socket.io`) for real-time syncing of player positions and health.
     - Prompt: "Write Node.js/Express code with socket.io for a WebSocket server hosted on Heroku, syncing 1–5 player positions and health in real-time."
  2. Update the frontend to connect to the WebSocket, displaying 1–5 rat detectives moving and shooting in real-time.
     - Prompt: "Modify the ThreeJS frontend to use WebSocket (socket.io) to sync 1–5 rat detectives' positions, health, and cheese gun shots in real-time."
- **Testing as a User:** Open multiple browser tabs or devices, join as 1–5 players, move, shoot, and verify synchronized actions. Check for lag or desyncs.
- **Output:** `server.js` for Heroku, updated `script.js` and `index.html` for WebSocket integration.

## Phase 7: Full Multiplayer Scaling (3–4 Hours)
- **Objective:** Scale multiplayer to 1–50 players, with dynamic join/leave.
- **Tasks (AI Prompts in Cursor):**
  1. Enhance the WebSocket server to handle 1–50 players, with dynamic join/leave mechanics (random safe spawns, silent removal on leave).
     - Prompt: "Update the Node.js/Express socket.io server to handle 1–50 players with dynamic join/leave, spawning new players at safe locations and removing leavers silently."
  2. Update the frontend to handle 1–50 players, ensuring performance and visibility (e.g., mini-map updates, player culling for distant rats).
     - Prompt: "Modify the ThreeJS frontend to handle 1–50 players via WebSocket, with a mini-map showing player dots and culling distant rats for performance."
- **Testing as a User:** Test with 1, 5, 10, 25, and 50 players (using multiple devices/tabs), join/leave mid-round, and verify smooth gameplay, no lag, and accurate syncing.
- **Output:** Updated `server.js` and `script.js`.

## Phase 8: Additional Weapons and UI (2–3 Hours)
- **Objective:** Add tail whip, trap mines, and a leaderboard.
- **Tasks (AI Prompts in Cursor):**
  1. Implement tail whip (20 damage, knockback, 5-second cooldown) and trap mines (15 damage, 3-second immobilize, 3 max active, 10-second cooldown).
     - Prompt: "Add a tail whip (20 damage, knockback, 5-second cooldown) and trap mines (15 damage, 3-second immobilize, 3 max, 10-second cooldown) to the rat detective in ThreeJS, synced via WebSocket."
  2. Add a real-time leaderboard (top 5 scores) and round timer (10 minutes) to the HUD.
     - Prompt: "Update the ThreeJS or HTML/CSS HUD to show a real-time leaderboard (top 5 scores) and a 10-minute round timer."
- **Testing as a User:** Use tail whip and trap mines, check their effects, and verify leaderboard/timer updates across players. Test on mobile.
- **Output:** Updated `script.js` and `index.html`.

## Phase 9: Final Polish and Deployment (2–3 Hours)
- **Objective:** Optimize for mobile, ensure no loading screens, and deploy to Netlify/Heroku.
- **Tasks (AI Prompts in Cursor):**
  1. Optimize ThreeJS rendering for mobile (low-poly assets, reduced draw calls) and ensure <2-second load time.
     - Prompt: "Optimize the ThreeJS game for mobile web, reducing polygon counts and ensuring <2-second load time with no loading screens."
  2. Deploy frontend to Netlify and backend to Heroku, linking with a custom domain (e.g., `ratdetective.fun`).
     - Prompt: "Write deployment scripts for hosting the ThreeJS frontend on Netlify and Node.js backend on Heroku, with HTTPS and a custom domain."
- **Testing as a User:** Verify the game loads instantly on desktop/mobile, plays smoothly with 1–50 players, and rounds rotate correctly. Check Heroku/Netlify hosting.
- **Output:** Deployed game, final `index.html`, `script.js`, and `server.js`.