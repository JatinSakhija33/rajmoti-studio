import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Upload, Flame, Snowflake, RotateCw, AlertCircle } from "lucide-react";

export type MugType = "white" | "black" | "magic";

interface ThreePhotoMugProps {
  mugType?: MugType;
  defaultPhotoUrl?: string;
  onPhotoUploaded?: (url: string) => void;
}

export function ThreePhotoMug({
  mugType = "magic",
  defaultPhotoUrl,
  onPhotoUploaded,
}: ThreePhotoMugProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultPhotoUrl || null);
  const [isHot, setIsHot] = useState<boolean>(true); // For magic mug: Cold vs Hot
  const [currentType, setCurrentType] = useState<MugType>(mugType);
  const [isRotating, setIsRotating] = useState(true);
  const [resolutionWarning, setResolutionWarning] = useState("");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mugMeshRef = useRef<THREE.Mesh | null>(null);
  const photoTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    onPhotoUploaded?.(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (img.naturalWidth < 1000 || img.naturalHeight < 1000) {
        setResolutionWarning(
          `Resolution advisory: Photo is ${img.naturalWidth}×${img.naturalHeight}px. Crisp 300 DPI mug printing looks best with high-res photos.`,
        );
      } else {
        setResolutionWarning("");
      }
      updateTexture(img);
    };
  };

  // Helper to draw mug decal canvas texture
  const updateTexture = (imgElement?: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background ceramic color
    const baseColor = currentType === "black" || (currentType === "magic" && !isHot) ? "#1A1A1A" : "#FFFFFF";
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If Magic mug and Cold, photo is hidden by thermal layer
    if (currentType === "magic" && !isHot) {
      // Very faint thermal ghosting
      if (imgElement) {
        ctx.globalAlpha = 0.08;
        ctx.drawImage(imgElement, 256, 64, 512, 384);
        ctx.globalAlpha = 1.0;
      }
    } else if (imgElement) {
      // Draw customer photo on front section of mug (aspect 4:3)
      ctx.drawImage(imgElement, 256, 64, 512, 384);

      // Subtle border/vignette
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 4;
      ctx.strokeRect(256, 64, 512, 384);
    } else {
      // Placeholder illustration
      ctx.fillStyle = "#EAE4DC";
      ctx.fillRect(256, 64, 512, 384);
      ctx.fillStyle = "#8B6D3F";
      ctx.font = "bold 32px Playfair Display, serif";
      ctx.textAlign = "center";
      ctx.fillText("Rajmoti Studio · Jetpur", 512, 230);
      ctx.font = "20px Montserrat, sans-serif";
      ctx.fillText("Upload photo to preview wrap", 512, 280);
    }

    if (photoTextureRef.current) {
      photoTextureRef.current.image = canvas;
      photoTextureRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 380;
    const height = mountRef.current.clientHeight || 320;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#FAF7F1");

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Initial Decal Canvas Texture
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    photoTextureRef.current = texture;

    // Ceramic Material
    const mugMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
    });
    materialRef.current = mugMaterial;

    // Mug Geometry (Cylinder with open top)
    const mugGroup = new THREE.Group();
    const cylinderGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 64, 1, false);
    const cylinder = new THREE.Mesh(cylinderGeo, mugMaterial);
    mugGroup.add(cylinder);

    // Mug Handle (Torus Geometry)
    const handleGeo = new THREE.TorusGeometry(0.7, 0.16, 24, 48, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({
      color: currentType === "black" || (currentType === "magic" && !isHot) ? 0x1a1a1a : 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(-1.25, 0, 0);
    handle.rotation.z = -Math.PI / 2;
    mugGroup.add(handle);

    // Slightly tilt for natural studio angle
    mugGroup.rotation.x = 0.15;
    scene.add(mugGroup);
    mugMeshRef.current = cylinder;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe6f0ff, 0.6);
    dirLight2.position.set(-4, 3, -3);
    scene.add(dirLight2);

    // Render loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (isRotating && !isDraggingRef.current) {
        mugGroup.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Load initial texture
    if (photoUrl) {
      const img = new Image();
      img.src = photoUrl;
      img.onload = () => updateTexture(img);
    } else {
      updateTexture();
    }

    // Mouse / Touch Rotation Handlers
    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      mugGroup.rotation.y += deltaX * 0.01;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
      if (mountRef.current && dom) {
        mountRef.current.removeChild(dom);
      }
    };
  }, []);

  // Update texture when mug type, hot state or photo changes
  useEffect(() => {
    if (photoUrl) {
      const img = new Image();
      img.src = photoUrl;
      img.onload = () => updateTexture(img);
    } else {
      updateTexture();
    }
  }, [currentType, isHot, photoUrl]);

  return (
    <div className="flex flex-col gap-3">
      {/* 3D Viewport Stage */}
      <div className="relative mx-auto w-full max-w-[440px] h-[300px] rounded-2xl overflow-hidden bg-[#FAF7F1] border border-stone-200 shadow-sm flex items-center justify-center">
        <div ref={mountRef} className="size-full cursor-grab active:cursor-grabbing" />

        {/* Watermark / Guidance */}
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm border border-stone-200 px-2.5 py-1 rounded-full text-[10px] text-stone-600 font-semibold flex items-center gap-1 pointer-events-none">
          <RotateCw size={11} className={isRotating ? "animate-spin" : ""} /> Drag to rotate 360°
        </div>

        {/* Magic Mug Thermal Status Pill */}
        {currentType === "magic" && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-stone-200 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 pointer-events-none">
            {isHot ? (
              <>
                <Flame size={14} className="text-amber-600" />
                <span className="text-amber-900">Hot: Photo Revealed</span>
              </>
            ) : (
              <>
                <Snowflake size={14} className="text-blue-600" />
                <span className="text-stone-700">Cold: Black Coating</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mug Customization Controls */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="font-semibold text-stone-700 flex flex-col gap-1">
          <span>Mug Variety:</span>
          <select
            className="w-full border border-stone-300 rounded-lg p-2 bg-white font-normal"
            value={currentType}
            onChange={(e) => setCurrentType(e.target.value as MugType)}
          >
            <option value="magic">✨ Thermochromic Magic Mug</option>
            <option value="white">⚪ Classic White Ceramic</option>
            <option value="black">⚫ Premium Gloss Black</option>
          </select>
        </label>

        {currentType === "magic" ? (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-stone-700">Thermal Simulation:</span>
            <div className="flex rounded-lg border border-stone-300 overflow-hidden bg-white p-0.5">
              <button
                type="button"
                onClick={() => setIsHot(false)}
                className={`flex-1 py-1.5 px-2 rounded font-medium flex items-center justify-center gap-1 text-[11px] ${
                  !isHot ? "bg-stone-800 text-white shadow-xs" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Snowflake size={12} /> Cold
              </button>
              <button
                type="button"
                onClick={() => setIsHot(true)}
                className={`flex-1 py-1.5 px-2 rounded font-medium flex items-center justify-center gap-1 text-[11px] ${
                  isHot ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Flame size={12} /> Hot
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-stone-700">Auto-Rotation:</span>
            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              className="py-2 px-3 border border-stone-300 rounded-lg bg-white font-medium text-stone-700 hover:bg-stone-50"
            >
              {isRotating ? "Pause Spin" : "Resume 360° Spin"}
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
        <div>
          <span className="font-semibold text-stone-800 block">Personalized Mug Photo</span>
          <span className="text-[11px] text-stone-500">Curved 3D cylinder mapping</span>
        </div>
        <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#29251F] text-amber-100 hover:bg-stone-800 flex items-center gap-1.5">
          <Upload size={13} /> {photoUrl ? "Change Photo" : "Upload Photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoUpload} />
        </label>
      </div>

      {resolutionWarning && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{resolutionWarning}</span>
        </div>
      )}
    </div>
  );
}
