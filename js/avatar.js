// 3D stage for Newrosama, built on Three.js.
//
// Out of the box this draws a small placeholder character (built from plain
// geometry) so the page works with zero external assets. Loading a real VRM
// avatar (e.g. one made in VRoid Studio, or downloaded from VRoid Hub) is one
// call away: stage.loadVRM(url).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export class AvatarStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.talking = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x171225);

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    this.camera.position.set(0, 1.4, 2.5);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.add(new THREE.HemisphereLight(0xffe9f5, 0x33264d, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(1, 2, 1.5);
    this.scene.add(keyLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.2, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 4.5;
    this.controls.maxPolarAngle = Math.PI / 1.6;

    this.vrm = null;
    this.placeholder = buildPlaceholder();
    this.scene.add(this.placeholder);

    this.clock = new THREE.Clock();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.renderer.setAnimationLoop(() => this._tick());
  }

  setTalking(isTalking) {
    this.talking = isTalking;
  }

  /** Load a VRM avatar from a URL (local blob URL or remote .vrm file). */
  async loadVRM(url) {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const gltf = await loader.loadAsync(url);
    const vrm = gltf.userData.vrm;
    if (!vrm) throw new Error('이 파일은 VRM 아바타가 아니에요.');

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    if (this.vrm) this.scene.remove(this.vrm.scene);
    this.placeholder.visible = false;

    this.vrm = vrm;
    vrm.scene.rotation.y = Math.PI; // VRM models face +Z; turn to face the camera
    this.scene.add(vrm.scene);
    return vrm;
  }

  resetToPlaceholder() {
    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
      this.vrm = null;
    }
    this.placeholder.visible = true;
  }

  _resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  _tick() {
    const elapsed = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    if (this.vrm) {
      this._animateVRM(this.vrm, elapsed, delta);
    } else {
      this._animatePlaceholder(this.placeholder, elapsed);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _animatePlaceholder(group, t) {
    group.position.y = Math.sin(t * 1.6) * 0.02;
    group.rotation.y = Math.sin(t * 0.4) * 0.12;

    const blinkClosed = Math.sin(t * 2.1) > 0.97;
    group.userData.eyes.forEach((eye) => (eye.scale.y = blinkClosed ? 0.08 : 1));

    const mouthOpen = this.talking ? 0.4 + Math.abs(Math.sin(t * 14)) * 0.6 : 0.08;
    group.userData.mouth.scale.y = mouthOpen;
  }

  _animateVRM(vrm, t, dt) {
    vrm.update(dt);
    const expressions = vrm.expressionManager;
    if (!expressions) return;

    const blink = Math.max(0, Math.sin(t * 2.1) - 0.97) * 30;
    expressions.setValue('blink', blink);
    expressions.setValue('aa', this.talking ? Math.abs(Math.sin(t * 14)) * 0.7 : 0);
  }
}

function buildPlaceholder() {
  const group = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color: 0xffe2d6, roughness: 0.6 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x6f53c7, roughness: 0.4 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0xff7fae, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2c2640 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 32), skin);
  head.position.y = 1.56;
  group.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.295, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.65),
    hair
  );
  hairCap.position.y = 1.62;
  group.add(hairCap);

  const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 16), hair);
  ponytail.position.set(0, 1.45, -0.22);
  ponytail.rotation.x = 0.5;
  group.add(ponytail);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.62, 24), cloth);
  torso.position.y = 1.08;
  group.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 24), dark);
  collar.position.y = 1.36;
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  const eyeGeometry = new THREE.SphereGeometry(0.034, 16, 16);
  const leftEye = new THREE.Mesh(eyeGeometry, dark);
  leftEye.position.set(-0.095, 1.575, 0.235);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.095;
  group.add(leftEye, rightEye);

  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.085, 0.03),
    new THREE.MeshBasicMaterial({ color: 0xc06070, side: THREE.DoubleSide })
  );
  mouth.position.set(0, 1.475, 0.265);
  group.add(mouth);

  group.userData.eyes = [leftEye, rightEye];
  group.userData.mouth = mouth;
  return group;
}
