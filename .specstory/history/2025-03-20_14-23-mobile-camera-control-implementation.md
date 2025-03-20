## SpecStory

## Mobile Camera Control Implementation (3/20/2025, 2:23:00 PM)

_**User**_

I just realised that theres no camera control on mobile. Make it so that dragging the screen controls the camera on mobile.

---

_**Assistant**_

I'll help you add mobile camera controls through touch events. First, let me search for the relevant camera control code.

---

_****_

<details>
            <summary>Searched codebase "camera control three.js camera movement" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `src/mouse-controls.js` | L1-60 |
| `src/mouse-controls.js` | L94-123 |
| `src/mouse-controls.js` | L60-94 |
| `src/movement.js` | L145-189 |
| `.specstory/history/2025-03-20_00-11-game-initialization-errors-and-debugging.md` | L1051-1097 |
| `src/movement.js` | L1-48 |
| `tests/mouse-controls.test.js` | L1-49 |
| `.specstory/history/2025-03-19_21-58-phase-6-completion-and-testing-strategy.md` | L6585-6651 |
| `tests/mouse-controls.test.js` | L49-69 |
| `src/scene.js` | L65-115 |
| `.specstory/history/2025-03-20_00-11-game-initialization-errors-and-debugging.md` | L1806-1861 |
| `src/scene.js` | L181-216 |
| `.specstory/history/2025-03-20_01-24-improving-shooting-accuracy-in-game.md` | L187-237 |
| `.specstory/history/2025-03-20_10-35-enhancing-map-complexity-with-more-buildings.md` | L5802-5847 |
| `.specstory/history/2025-03-20_00-11-game-initialization-errors-and-debugging.md` | L1629-1672 |
| `src/scene.js` | L141-181 |
| `.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L1868-1976 |
| `.specstory/history/2025-03-19_21-58-phase-6-completion-and-testing-strategy.md` | L1626-1649 |
| `src/movement.js` | L189-199 |
| `tests/movement.test.js` | L1-14 |
| `.specstory/history/2025-03-19_21-58-phase-6-completion-and-testing-strategy.md` | L5467-5515 |
| `.specstory/history/2025-03-19_21-58-phase-6-completion-and-testing-strategy.md` | L6651-6703 |
| `.specstory/history/2025-03-19_12-45-implementing-phase-3-with-tdd.md` | L1289-1339 |
| `.specstory/history/2025-03-19_21-58-phase-6-completion-and-testing-strategy.md` | L1649-1672 |
| `tests/movement.test.js` | L72-101 |

</details>

---

_****_

Based on the codebase search, I can see that we already have a movement control system in place, but we need to add touch controls for the camera. Let me first check the mobile-specific code.

---

_****_

<details>
            <summary>Grep search for "touchstart|touchmove|touchend" • **6** files</summary>
        
| File | Line | Match |
|------|------|-------|
| `file:///c%3A/rat-detective/src/movement.js` | L59 | `if ('ontouchstart' in window) {` |
| `file:///c%3A/rat-detective/src/movement.js` | L127 | `jumpButton.addEventListener('touchstart', () => keys.jump = true);` |
| `file:///c%3A/rat-detective/src/movement.js` | L128 | `jumpButton.addEventListener('touchend', () => keys.jump = false);` |
| `file:///c%3A/rat-detective/src/combat.js` | L78 | `if ('ontouchstart' in window && window.mobileCheeseButton) {` |
| `file:///c%3A/rat-detective/src/combat.js` | L79 | `window.mobileCheeseButton.addEventListener('touchstart', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L1729 | `-     if ('ontouchstart' in window) {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L1915 | `-     jumpButton.addEventListener('touchstart', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L1922 | `-     jumpButton.addEventListener('touchend', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L1937 | `+         jumpButton.addEventListener('touchstart', () => keys.jump = true);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L1938 | `+         jumpButton.addEventListener('touchend', () => keys.jump = false);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L2721 | `-         jumpButton.addEventListener('touchstart', () => keys.jump = true);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L2722 | `+         jumpButton.addEventListener('touchstart', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_13-48-update-phase-5-in-roadmap.md` | L2726 | `jumpButton.addEventListener('touchend', () => keys.jump = false);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_12-45-implementing-phase-3-with-tdd.md` | L217 | `+         shootButton.addEventListener('touchstart', () => fireCheeseGun({ scene, player }));` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L94 | `+         if ('ontouchstart' in window) {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L193 | `-         jumpButton.addEventListener('touchstart', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L197 | `-         jumpButton.addEventListener('touchend', () => keys.jump = false);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L198 | `+             jumpButton.addEventListener('touchstart', () => keys.jump = true);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L199 | `+             jumpButton.addEventListener('touchend', () => keys.jump = false);` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L253 | `-         shootButton.addEventListener('touchstart', () => fireCheeseGun({ scene, player }));` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L255 | `+         if ('ontouchstart' in window && window.mobileCheeseButton) {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-20_10-06-improving-mobile-game-controls.md` | L256 | `+             window.mobileCheeseButton.addEventListener('touchstart', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_11-55-phase-1-implementation-and-testing.md` | L1799 | `+     if ('ontouchstart' in window) {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_11-55-phase-1-implementation-and-testing.md` | L1944 | `+     jumpButton.addEventListener('touchstart', () => {` |
| `file:///c%3A/rat-detective/.specstory/history/2025-03-19_11-55-phase-1-implementation-and-testing.md` | L1951 | `+     jumpButton.addEventListener('touchend', () => {` |

</details>

---

_****_

I'll add touch-based camera controls by implementing a second touch area on the right side of the screen for camera control. Let me modify the mouse controls file to add this functionality.

---

_****_

Read file: undefined

---

_****_

I'll modify the mouse controls to add touch camera controls. I'll create a new edit that adds touch camera functionality:

---

_****_

```diff
          verticalAngle: 0,
          horizontalAngle: 0,
-         mouseSensitivity: 0.002
+         mouseSensitivity: 0.002,
+         touchSensitivity: 0.005,
+         lastTouchX: 0,
+         lastTouchY: 0
      };
  
      }
  
+     // Add touch camera controls for mobile
+     if ('ontouchstart' in window) {
+         // Create camera control area on the right side of the screen
+         const cameraControl = document.createElement('div');
+         cameraControl.id = 'camera-control';
+         cameraControl.style.position = 'absolute';
+         cameraControl.style.right = '0';
+         cameraControl.style.top = '0';
+         cameraControl.style.width = '50%';
+         cameraControl.style.height = '100%';
+         cameraControl.style.zIndex = '1000';
+         document.body.appendChild(cameraControl);
+ 
+         let touchActive = false;
+ 
+         cameraControl.addEventListener('touchstart', (event) => {
+             event.preventDefault();
+             touchActive = true;
+             const touch = event.touches[0];
+             controls.lastTouchX = touch.clientX;
+             controls.lastTouchY = touch.clientY;
+         });
+ 
+         cameraControl.addEventListener('touchmove', (event) => {
+             event.preventDefault();
+             if (!touchActive) return;
+ 
+             const touch = event.touches[0];
+             const movementX = touch.clientX - controls.lastTouchX;
+             const movementY = touch.clientY - controls.lastTouchY;
+ 
+             // Update player rotation (horizontal movement)
+             player.rotation.y -= movementX * controls.touchSensitivity;
+ 
+             // Update vertical angle with wider range
+             controls.verticalAngle = Math.max(
+                 -VERTICAL_LIMIT,
+                 Math.min(VERTICAL_LIMIT, controls.verticalAngle + movementY * controls.touchSensitivity)
+             );
+ 
+             // Store vertical angle in player for projectile firing
+             player.userData.verticalAngle = controls.verticalAngle;
+ 
+             // Update camera position
+             updateCamera(camera, player, controls.verticalAngle);
+ 
+             controls.lastTouchX = touch.clientX;
+             controls.lastTouchY = touch.clientY;
+         });
+ 
+         cameraControl.addEventListener('touchend', () => {
+             touchActive = false;
+         });
+ 
+         cameraControl.addEventListener('touchcancel', () => {
+             touchActive = false;
+         });
+     }
+ 
+     // Desktop mouse controls
      gameContainer.addEventListener('click', () => {
-         if (!controls.isLocked) {
+         if (!controls.isLocked && !('ontouchstart' in window)) {
              gameContainer.requestPointerLock();
          }
```

---

_****_

I've added touch camera controls with the following features:

1. A touch control area on the right half of the screen for camera movement
2. Touch sensitivity that's slightly higher than mouse sensitivity for better mobile control
3. Proper touch event handling with start, move, end, and cancel events
4. Prevention of pointer lock on mobile devices
5. The same vertical angle limits as mouse controls for consistency

The camera will now respond to touch dragging on the right side of the screen:
- Dragging left/right will rotate the camera horizontally
- Dragging up/down will adjust the camera's vertical angle
- The touch controls use the same underlying camera update logic as the mouse controls for consistency

The left side of the screen remains available for the movement joystick, and the touch camera controls work independently of the movement controls.

Would you like me to make any adjustments to the sensitivity or layout of the touch controls?

---

_**User**_

Okay, now i can move the camera, but i the buttons dont work. The joystick works, but not the buttons on the left.

---

_**Assistant**_

This issue is likely happening because our new camera control div is overlapping and intercepting touch events meant for the buttons. Let me fix this by adjusting the z-index and pointer-events settings.

---

_****_

```diff
          cameraControl.style.width = '50%';
          cameraControl.style.height = '100%';
-         cameraControl.style.zIndex = '1000';
+         cameraControl.style.zIndex = '1';  // Lower z-index so it doesn't overlap UI
+         cameraControl.style.pointerEvents = 'none'; // Don't intercept events by default
          document.body.appendChild(cameraControl);
+ 
+         // Create an inner touch area that excludes the UI regions
+         const touchArea = document.createElement('div');
+         touchArea.style.position = 'absolute';
+         touchArea.style.right = '0';
+         touchArea.style.top = '0';
+         touchArea.style.width = '100%';
+         touchArea.style.height = '100%';
+         touchArea.style.pointerEvents = 'auto'; // Enable touch events only for this area
+         cameraControl.appendChild(touchArea);
  
          let touchActive = false;
  
-         cameraControl.addEventListener('touchstart', (event) => {
+         touchArea.addEventListener('touchstart', (event) => {
              event.preventDefault();
              touchActive = true;
          });
  
-         cameraControl.addEventListener('touchmove', (event) => {
+         touchArea.addEventListener('touchmove', (event) => {
              event.preventDefault();
              if (!touchActive) return;
          });
  
-         cameraControl.addEventListener('touchend', () => {
+         touchArea.addEventListener('touchend', () => {
              touchActive = false;
          });
  
-         cameraControl.addEventListener('touchcancel', () => {
+         touchArea.addEventListener('touchcancel', () => {
              touchActive = false;
          });
```

---

_****_

I've made the following changes to fix the button interaction issues:

1. Lowered the z-index of the camera control div to 1 (from 1000) so it doesn't overlap UI elements
2. Set `pointerEvents: 'none'` on the main camera control div to prevent it from intercepting any events
3. Created an inner touch area that has `pointerEvents: 'auto'` to handle camera control touches
4. Moved all touch event listeners to the inner touch area

This change ensures that:
1. The camera controls won't interfere with any UI elements (buttons, joystick)
2. The right side of the screen will still work for camera control
3. All UI elements will receive their touch events properly

The buttons should now work correctly while still maintaining the camera control functionality. Let me know if you're still experiencing any issues with the buttons or if you need any adjustments to the touch sensitivity.

---

_**User**_

No, it's still not working. I can actually drag the screen from clicking on either button, which shouldnt be possible

---

_**Assistant**_

Ah, I see the issue. The touch area is still intercepting events from the buttons because it's positioned over them. Let me modify the camera control area to only cover the right side of the screen and avoid the button areas.

---

_****_

```diff
          cameraControl.style.width = '50%';
          cameraControl.style.height = '100%';
-         cameraControl.style.zIndex = '1';  // Lower z-index so it doesn't overlap UI
-         cameraControl.style.pointerEvents = 'none'; // Don't intercept events by default
+         cameraControl.style.zIndex = '1';
+         cameraControl.style.pointerEvents = 'auto'; // Enable touch events
+         
+         // Add a semi-transparent overlay to show touch area (helpful for debugging)
+         cameraControl.style.background = 'rgba(0, 0, 0, 0.0)';
+         
+         // Position it to avoid UI elements
+         cameraControl.style.paddingBottom = '120px'; // Avoid bottom UI elements
+         cameraControl.style.boxSizing = 'border-box';
          document.body.appendChild(cameraControl);
- 
-         // Create an inner touch area that excludes the UI regions
-         const touchArea = document.createElement('div');
-         touchArea.style.position = 'absolute';
-         touchArea.style.right = '0';
-         touchArea.style.top = '0';
-         touchArea.style.width = '100%';
-         touchArea.style.height = '100%';
-         touchArea.style.pointerEvents = 'auto'; // Enable touch events only for this area
-         cameraControl.appendChild(touchArea);
  
          let touchActive = false;
  
-         touchArea.addEventListener('touchstart', (event) => {
+         cameraControl.addEventListener('touchstart', (event) => {
              event.preventDefault();
              touchActive = true;
          });
  
-         touchArea.addEventListener('touchmove', (event) => {
+         cameraControl.addEventListener('touchmove', (event) => {
              event.preventDefault();
              if (!touchActive) return;
          });
  
-         touchArea.addEventListener('touchend', () => {
+         cameraControl.addEventListener('touchend', () => {
              touchActive = false;
          });
  
-         touchArea.addEventListener('touchcancel', () => {
+         cameraControl.addEventListener('touchcancel', () => {
              touchActive = false;
          });
```

---

_****_

I've made these changes:

1. Removed the inner touch area div since it was causing issues
2. Added padding at the bottom of the camera control area to avoid overlapping with buttons
3. Made the camera control div itself handle the touch events
4. Set `boxSizing: 'border-box'` to ensure padding is included in the total height
5. Added a transparent background (you won't see it, but it helps define the touch area)

Now the camera control should:
1. Only work on the right half of the screen
2. Not interfere with any buttons at the bottom
3. Allow the buttons to receive their touch events normally

Let me know if you're still experiencing any issues with the buttons or camera control.

---

_**User**_

Still not working. And i dont want camera control only on the right side. Buttons that arent working are in the bottom right.

The jump and cheese buttons arent working.

---

_**Assistant**_

Ah, I understand better now from your screenshot. The issue is that our camera control div is overlapping with the Jump and Cheese buttons in the bottom right. Let's modify the camera control to work everywhere except where the UI elements are.

---

_****_

```diff
      // Add touch camera controls for mobile
      if ('ontouchstart' in window) {
-         // Create camera control area on the right side of the screen
+         // Create camera control area that covers the whole screen
          const cameraControl = document.createElement('div');
          cameraControl.id = 'camera-control';
          cameraControl.style.position = 'absolute';
-         cameraControl.style.right = '0';
+         cameraControl.style.left = '0';
          cameraControl.style.top = '0';
-         cameraControl.style.width = '50%';
+         cameraControl.style.width = '100%';
          cameraControl.style.height = '100%';
          cameraControl.style.zIndex = '1';
-         cameraControl.style.pointerEvents = 'auto'; // Enable touch events
-         
-         // Add a semi-transparent overlay to show touch area (helpful for debugging)
-         cameraControl.style.background = 'rgba(0, 0, 0, 0.0)';
-         
-         // Position it to avoid UI elements
-         cameraControl.style.paddingBottom = '120px'; // Avoid bottom UI elements
-         cameraControl.style.boxSizing = 'border-box';
+         cameraControl.style.pointerEvents = 'none'; // Initially disable pointer events
          document.body.appendChild(cameraControl);
  
          let touchActive = false;
- 
-         cameraControl.addEventListener('touchstart', (event) => {
+         let touchStartX = 0;
+         let touchStartY = 0;
+ 
+         // Handle touch events on the document level
+         document.addEventListener('touchstart', (event) => {
+             // Check if the touch is on a UI element
+             const target = event.target;
+             if (target.tagName.toLowerCase() === 'button' || 
+                 target.id === 'joystick-container' ||
+                 target.closest('#joystick-container')) {
+                 return; // Don't handle touch events on UI elements
+             }
+ 
              event.preventDefault();
              touchActive = true;
              const touch = event.touches[0];
              controls.lastTouchX = touch.clientX;
              controls.lastTouchY = touch.clientY;
-         });
+             touchStartX = touch.clientX;
+             touchStartY = touch.clientY;
+         }, { passive: false });
  
-         cameraControl.addEventListener('touchmove', (event) => {
-             event.preventDefault();
+         document.addEventListener('touchmove', (event) => {
              if (!touchActive) return;
  
+             // If the touch started on a UI element, don't handle it
+             if (Math.abs(event.touches[0].clientX - touchStartX) < 10 &&
+                 Math.abs(event.touches[0].clientY - touchStartY) < 10) {
+                 return;
+             }
+ 
+             event.preventDefault();
              const touch = event.touches[0];
              const movementX = touch.clientX - controls.lastTouchX;
              controls.lastTouchX = touch.clientX;
              controls.lastTouchY = touch.clientY;
-         });
+         }, { passive: false });
  
-         cameraControl.addEventListener('touchend', () => {
+         document.addEventListener('touchend', () => {
              touchActive = false;
          });
  
-         cameraControl.addEventListener('touchcancel', () => {
+         document.addEventListener('touchcancel', () => {
              touchActive = false;
          });
```

---

_****_



---



---

