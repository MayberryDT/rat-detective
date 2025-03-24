// Last updated: 2025-03-20T01:05:24.342Z
import * as THREE from 'three';
import { getRandomAppearance } from './ratAppearance';

export function createRat(options = {}) {
    // Get options with defaults
    const appearance = options.appearance || getRandomAppearance();
    const isNPC = options.isNPC || false;
    
    // Create basic rat body
    const ratGroup = new THREE.Group();
    
    // Rat body (trench coat style - taller and wider at bottom)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4; // Position to allow legs to show below
    ratGroup.add(body);
    
    // Lower part of trench coat (wider at bottom)
    const coatGeometry = new THREE.BoxGeometry(0.7, 0.4, 0.5);
    const coatMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    const coat = new THREE.Mesh(coatGeometry, coatMaterial);
    coat.position.y = 0.2; // Position at bottom of body
    ratGroup.add(coat);
    
    // Legs (cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.2, 0); // Position below the coat
    ratGroup.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.2, 0); // Position below the coat
    ratGroup.add(rightLeg);
    
    // Head (slightly smaller sphere)
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const headMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.8, 0); // Position above body
    ratGroup.add(head);
    
    // Arms (cylinders)
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.35, 0.6, 0);
    leftArm.rotation.z = -Math.PI / 6; // Angle slightly outward
    ratGroup.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.35, 0.6, 0);
    rightArm.rotation.z = Math.PI / 6; // Angle slightly outward
    ratGroup.add(rightArm);
    
    // Tail (thinner and longer cylinder)
    const tailGeometry = new THREE.CylinderGeometry(0.04, 0.02, 0.6, 8);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, 0.3); // Position at back
    tail.rotation.x = -Math.PI / 4; // Angle upward
    ratGroup.add(tail);
    
    // Ears (cones)
    const earGeometry = new THREE.ConeGeometry(0.06, 0.12, 4);
    const earMaterial = new THREE.MeshPhongMaterial({ color: appearance.ratColor });
    
    // Left ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.12, 0.75, 0);
    leftEar.rotation.x = -Math.PI / 6;
    ratGroup.add(leftEar);
    
    // Right ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.12, 0.75, 0);
    rightEar.rotation.x = -Math.PI / 6;
    ratGroup.add(rightEar);
    
    // Add hat based on appearance style
    const hatStyle = appearance.hatStyle;
    const hatGeometry = new THREE.CylinderGeometry(
        hatStyle.topRadius,
        hatStyle.bottomRadius,
        hatStyle.height,
        16
    );
    const hatMaterial = new THREE.MeshPhongMaterial({ color: appearance.hatColor });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.set(0, 0.95, 0);
    ratGroup.add(hat);
    
    // Hat brim
    const brimGeometry = new THREE.CylinderGeometry(
        hatStyle.brimWidth,
        hatStyle.brimWidth,
        hatStyle.brimHeight,
        16
    );
    const brimMaterial = new THREE.MeshPhongMaterial({ color: appearance.hatColor });
    const brim = new THREE.Mesh(brimGeometry, brimMaterial);
    brim.position.set(0, 0.88, 0);
    ratGroup.add(brim);
    
    // Position the whole rat - now starting from ground (y = 0)
    ratGroup.position.y = 0;
    ratGroup.name = isNPC ? 'npc-rat' : 'player-rat';
    
    // Create shadow plane (separate from rat group)
    const shadowGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.order = 'YXZ'; // Set rotation order to match the rat
    shadow.rotation.x = -Math.PI / 2; // Lay flat on the ground
    shadow.position.y = 0.01; // Slightly above ground to prevent z-fighting
    shadow.name = isNPC ? 'npc-shadow' : 'player-shadow';
    
    // Add necessary properties
    ratGroup.velocity = new THREE.Vector3(0, 0, 0);
    ratGroup.health = 100;
    ratGroup.rotation.order = 'YXZ';
    ratGroup.userData.mouseSensitivity = 0.002;
    
    // Set initial rotation to face forward (-Z direction) only for player rats
    if (!isNPC) {
        ratGroup.rotation.y = Math.PI;
    }
    
    console.log(`Created ${isNPC ? 'NPC' : 'player'} rat model with appearance:`, appearance.id);
    return { ratGroup, shadow };
} 