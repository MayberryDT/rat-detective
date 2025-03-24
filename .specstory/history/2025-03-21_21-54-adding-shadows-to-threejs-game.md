## SpecStory

## Adding Shadows to ThreeJS Game (3/21/2025, 9:54:15 PM)

_**User**_

Add shadows to the game

---

_**Assistant**_

I'll help you add shadows to the game. Since this is a ThreeJS-based game, we'll need to enable and configure shadows in the scene. Let me check the relevant files first.

---

_****_

<details>
            <summary>Searched codebase "scene setup renderer camera lighting ThreeJS" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `src/scene.js` | L114-144 |
| `src/scene.js` | L60-114 |
| `src/scene.js` | L16-60 |
| `coverage/lcov-report/src/scene.js.html` | L880-913 |
| `coverage/lcov-report/src/scene.js.html` | L967-994 |
| `src/scene.js` | L144-190 |
| `src/scene.js` | L190-225 |
| `src/scene.js` | L284-332 |
| `coverage/lcov-report/src/scene.js.html` | L943-967 |
| `coverage/lcov-report/src/scene.js.html` | L994-1017 |
| `src/scene.js` | L1-16 |
| `src/scene.js` | L332-363 |
| `src/mouse-controls.js` | L1-30 |
| `coverage/lcov-report/src/scene.js.html` | L1169-1194 |
| `src/combat.js` | L87-145 |
| `src/npc.js` | L775-843 |
| `src/scene.js` | L225-256 |
| `src/rat.js` | L48-96 |
| `src/scene.js` | L363-406 |
| `src/combat.js` | L199-242 |
| `src/rat.js` | L1-48 |
| `coverage/lcov-report/src/rat.js.html` | L393-422 |
| `src/combat.js` | L145-199 |
| `src/index.html` | L1-46 |
| `src/scene.js` | L256-284 |

</details>

---

_****_

I see that we already have `renderer.shadowMap.enabled = true` in the scene setup, but we need to configure the lights and objects to cast and receive shadows. Let me make the necessary changes to implement shadows in the game.

---

_****_

```diff
          
          const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
-         directionalLight.position.set(1, 1, 1);
+         directionalLight.position.set(5, 10, 5);
+         directionalLight.castShadow = true;
+         directionalLight.shadow.mapSize.width = 2048;
+         directionalLight.shadow.mapSize.height = 2048;
+         directionalLight.shadow.camera.near = 0.5;
+         directionalLight.shadow.camera.far = 50;
+         directionalLight.shadow.camera.left = -15;
+         directionalLight.shadow.camera.right = 15;
+         directionalLight.shadow.camera.top = 15;
+         directionalLight.shadow.camera.bottom = -15;
+         directionalLight.shadow.bias = -0.0005;
          scene.add(directionalLight);
          debugLog(DEBUG_CATEGORIES.SCENE, 'Lighting setup complete');
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.shadowMap.enabled = true;
+         renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          renderer.setClearColor(0x87CEEB, 1);
          
```

---

_****_

Now let's modify the rat creation function to make rats cast and receive shadows.

---

_****_

```diff
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.4; // Position to allow legs to show below
+     body.castShadow = true;
+     body.receiveShadow = true;
      ratGroup.add(body);
      
      const coat = new THREE.Mesh(coatGeometry, coatMaterial);
      coat.position.y = 0.2; // Position at bottom of body
+     coat.castShadow = true;
+     coat.receiveShadow = true;
      ratGroup.add(coat);
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.2, 0.2, 0); // Position below the coat
+     leftLeg.castShadow = true;
+     leftLeg.receiveShadow = true;
      ratGroup.add(leftLeg);
      
      // Right leg
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.2, 0.2, 0); // Position below the coat
+     rightLeg.castShadow = true;
+     rightLeg.receiveShadow = true;
      ratGroup.add(rightLeg);
      
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 0.8, 0); // Position above body
+     head.castShadow = true;
+     head.receiveShadow = true;
      ratGroup.add(head);
      
      leftArm.position.set(-0.35, 0.6, 0);
      leftArm.rotation.z = -Math.PI / 6; // Angle slightly outward
+     leftArm.castShadow = true;
+     leftArm.receiveShadow = true;
      ratGroup.add(leftArm);
      
      rightArm.position.set(0.35, 0.6, 0);
      rightArm.rotation.z = Math.PI / 6; // Angle slightly outward
+     rightArm.castShadow = true;
+     rightArm.receiveShadow = true;
      ratGroup.add(rightArm);
      
      tail.position.set(0, 0.3, 0.3); // Position at back
      tail.rotation.x = -Math.PI / 4; // Angle upward
+     tail.castShadow = true;
+     tail.receiveShadow = true;
      ratGroup.add(tail);
      
      leftEar.position.set(-0.12, 0.75, 0);
      leftEar.rotation.x = -Math.PI / 6;
+     leftEar.castShadow = true;
+     leftEar.receiveShadow = true;
      ratGroup.add(leftEar);
      
      rightEar.position.set(0.12, 0.75, 0);
      rightEar.rotation.x = -Math.PI / 6;
+     rightEar.castShadow = true;
+     rightEar.receiveShadow = true;
      ratGroup.add(rightEar);
      
```

---

_****_

Let me check if we need to configure shadows for the map as well.

---

_****_

<details>
            <summary>Searched codebase "map creation floor walls SewerMap" • **24** results</summary>
        
| File | Lines |
|------|-------|
| `src/map.js` | L12-28 |
| `src/map.js` | L28-42 |
| `src/map.js` | L42-100 |
| `src/map.js` | L1-12 |
| `src/map.js` | L212-252 |
| `src/map.js` | L122-141 |
| `src/map.js` | L100-122 |
| `src/map.js` | L256-260 |
| `src/map.js` | L141-178 |
| `src/map.js` | L178-212 |
| `src/map.js` | L252-256 |
| `src/map.js` | L268-274 |
| `src/map.js` | L260-264 |
| `src/tests/map.test.js` | L1-62 |
| `src/map.js` | L264-268 |
| `src/building-points.js` | L1-45 |
| `src/tests/map.test.js` | L88-143 |
| `src/building-points.js` | L45-55 |
| `src/building-points.js` | L55-87 |
| `src/npc.js` | L423-471 |
| `src/building-points.js` | L87-108 |
| `src/scene.js` | L16-60 |
| `src/spawn.js` | L1-30 |
| `coverage/lcov-report/src/scene.js.html` | L880-913 |

</details>

---

_****_

Now let me add shadow configuration for the map elements.

---

_****_

```diff
      floor.position.y = -0.5;
      floor.name = 'floor';
+     floor.receiveShadow = true;
      floor.userData = {
        isPipeFloor: false,
      northWall.position.set(0, wallHeight / 2, -this.length / 2);
      northWall.name = 'wall';
+     northWall.castShadow = true;
+     northWall.receiveShadow = true;
      northWall.userData = {
        isCollider: true,
      southWall.position.set(0, wallHeight / 2, this.length / 2);
      southWall.name = 'wall';
+     southWall.castShadow = true;
+     southWall.receiveShadow = true;
      southWall.userData = {
        isCollider: true,
      eastWall.position.set(this.width / 2, wallHeight / 2, 0);
      eastWall.name = 'wall';
+     eastWall.castShadow = true;
+     eastWall.receiveShadow = true;
      eastWall.userData = {
        isCollider: true,
      westWall.position.set(-this.width / 2, wallHeight / 2, 0);
      westWall.name = 'wall';
+     westWall.castShadow = true;
+     westWall.receiveShadow = true;
      westWall.userData = {
        isCollider: true,
        building.position.set(x, height / 2, z);
        building.name = `building-${index}`;
+       building.castShadow = true;
+       building.receiveShadow = true;
      
        // Add collision data
        building.userData = {
-       isCollider: true,
+         isCollider: true,
          colliderType: 'wall' // Buildings act like walls for collision
        };
```

---

_****_

Let me also check if we need to configure shadows for any projectiles or effects.

---

_****_

```diff
      });
      const projectile = new THREE.Mesh(geometry, material);
+     projectile.castShadow = true;
      
      // Get camera for direction
```

---

_****_

I've now configured shadows for all the main elements in the game:

1. Lighting:
- Added a properly positioned directional light with shadow casting enabled
- Configured shadow map size and camera frustum for better quality shadows
- Added shadow bias to prevent shadow acne

2. Map elements:
- Made the floor receive shadows
- Made walls both cast and receive shadows
- Made buildings both cast and receive shadows

3. Characters:
- Made all rat parts (body, limbs, etc.) cast and receive shadows

4. Projectiles:
- Made cheese projectiles cast shadows

5. Renderer:
- Enabled shadow mapping with PCF soft shadows for better quality

The shadows should now be working in the game. You should see realistic shadows being cast by all objects, making the scene look more three-dimensional and immersive. The shadows will update in real-time as objects move and as the lighting changes.

Is there anything specific about the shadows you'd like me to adjust, such as their softness, darkness, or the light position?

---



---

