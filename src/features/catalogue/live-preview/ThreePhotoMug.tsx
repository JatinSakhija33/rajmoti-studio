import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Upload, Flame, Snowflake, RotateCw, AlertCircle, Eye, Info } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/site";

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
  const [photoUrl, setPhotoUrl] = useState<string>(
    defaultPhotoUrl || "/products/mug-sample-couple.svg",
  );
  const [isHot, setIsHot] = useState<boolean>(true); // For magic mug: Cold vs Hot
  const [currentType, setCurrentType] = useState<MugType>(mugType);
  const [isRotating, setIsRotating] = useState(true);
  const [resolutionWarning, setResolutionWarning] = useState("");
  const activeImageRef = useRef<HTMLImageElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mugMeshRef = useRef<THREE.Mesh | null>(null);
  const mugGroupRef = useRef<THREE.Group | null>(null);
  const photoTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  const isDraggingRef = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });

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
      activeImageRef.current = img;
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

  useEffect(() => {
    const img = new Image();
    img.src = photoUrl;
    img.onload = () => {
      activeImageRef.current = img;
      updateTexture(img);
    };
  }, [photoUrl, currentType, isHot]);

  // Helper to draw mug decal canvas texture
  const updateTexture = (imgElement?: HTMLImageElement) => {
    const activeImg = imgElement || activeImageRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background ceramic color
    const baseColor =
      currentType === "black" || (currentType === "magic" && !isHot) ? "#1A1A1A" : "#FFFFFF";
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If Magic mug and Cold, photo is hidden by thermal layer
    if (currentType === "magic" && !isHot) {
      if (activeImg) {
        // Very faint thermal ghosting
        ctx.globalAlpha = 0.08;
        ctx.drawImage(activeImg, 256, 64, 512, 384);
        ctx.globalAlpha = 1.0;
      }
    } else if (activeImg) {
      // Draw customer photo on front section of mug (aspect 4:3)
      ctx.drawImage(activeImg, 256, 64, 512, 384);

      // Subtle vignette border
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 3;
      ctx.strokeRect(256, 64, 512, 384);
    } else {
      // Placeholder illustration
      ctx.fillStyle = "#EAE4DC";
      ctx.fillRect(256, 64, 512, 384);
      ctx.fillStyle = "#8B6D3F";
      ctx.font = "bold 30px 'Playfair Display', serif";
      ctx.textAlign = "center";
      ctx.fillText("Rajmoti Studio · Jetpur", 512, 230);
      ctx.font = "19px Montserrat, sans-serif";
      ctx.fillText("Upload photo to preview 360° wrap", 512, 280);
    }

    if (photoTextureRef.current) {
      photoTextureRef.current.image = canvas;
      photoTextureRef.current.needsUpdate = true;
    }
  };

  // IntersectionObserver to pause rendering when offscreen
  useEffect(() => {
    if (!mountRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    observer.observe(mountRef.current);
    return () => observer.disconnect();
  }, []);

  // Three.js Scene Setup & Lifecycle
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 380;
    const height = mountRef.current.clientHeight || 320;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#FAF7F1");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    const mugGroup = new THREE.Group();
    mugGroupRef.current = mugGroup;

    // Cylinder Body
    const cylGeo = new THREE.CylinderGeometry(1.05, 1.05, 2.3, 64, 1, true);

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.wrapS = THREE.RepeatWrapping;
    canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
    photoTextureRef.current = canvasTexture;

    const cylMat = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      roughness: 0.15,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    materialRef.current = cylMat;

    const cylinder = new THREE.Mesh(cylGeo, cylMat);
    mugGroup.add(cylinder);

    // Inner & Bottom
    const bottomGeo = new THREE.CircleGeometry(1.04, 64);
    const bottomMat = new THREE.MeshStandardMaterial({
      color: currentType === "black" || (currentType === "magic" && !isHot) ? 0x1a1a1a : 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.rotation.x = Math.PI / 2;
    bottom.position.y = -1.14;
    mugGroup.add(bottom);

    // Ceramic Handle
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

    // Natural studio angle tilt
    mugGroup.rotation.x = 0.15;
    scene.add(mugGroup);
    mugMeshRef.current = cylinder;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe6f0ff, 0.65);
    dirLight2.position.set(-4, 3, -3);
    scene.add(dirLight2);

    // Render loop with visibility check
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return; // Pause rendering when offscreen
      if (isRotating && !isDraggingRef.current && mugGroup) {
        mugGroup.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Initial Texture Paint
    if (photoUrl) {
      const img = new Image();
      img.src = photoUrl;
      img.onload = () => updateTexture(img);
    } else {
      updateTexture();
    }

    // Mouse & Touch Pointer Listeners for full mobile/desktop 360° drag
    const dom = renderer.domElement;

    const onPointerDown = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      previousPointerPosition.current = { x: clientX, y: clientY };
    };

    const onPointerMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const deltaX = clientX - previousPointerPosition.current.x;
      mugGroup.rotation.y += deltaX * 0.012;
      previousPointerPosition.current = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseDown = (e: MouseEvent) => onPointerDown(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
    const handleMouseUp = () => onPointerUp();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onPointerUp();

    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    dom.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Responsive window resize
    const handleResize = () => {
      if (!mountRef.current || !renderer) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);

      cylGeo.dispose();
      bottomGeo.dispose();
      handleGeo.dispose();
      canvasTexture.dispose();
      renderer.dispose();
    };
  }, [currentType, isHot]);

  // Update texture when photoUrl changes
  useEffect(() => {
    if (photoUrl) {
      const img = new Image();
      img.src = photoUrl;
      img.onload = () => updateTexture(img);
    } else {
      updateTexture();
    }
  }, [photoUrl, currentType, isHot]);

  return (
    <div className="flex flex-col gap-3">
      {/* Mug Variant & Thermal State Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100/90 rounded-xl border border-stone-200">
        <div className="flex items-center gap-1.5">
          {(["magic", "white", "black"] as MugType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCurrentType(type)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                currentType === type
                  ? "bg-[#29251F] text-amber-100 shadow-xs"
                  : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              {type === "magic" ? "Magic Reveal Mug" : `${type} Ceramic`}
            </button>
          ))}
        </div>

        {/* Cold / Hot Switch for Magic Mug */}
        {currentType === "magic" && (
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-300">
            <button
              type="button"
              onClick={() => setIsHot(false)}
              className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                !isHot ? "bg-stone-800 text-white shadow-xs" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Snowflake size={12} /> Cold
            </button>
            <button
              type="button"
              onClick={() => setIsHot(true)}
              className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                isHot ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Flame size={12} /> Hot
            </button>
          </div>
        )}
      </div>

      {/* 3D WebGL Canvas Stage */}
      <div className="relative mx-auto w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden border border-stone-300 shadow-md bg-[#FAF7F1] flex items-center justify-center">
        <div ref={mountRef} className="size-full cursor-grab active:cursor-grabbing" />

        {/* Interactive Overlay Badges */}
        <div className="absolute top-3 left-3 pointer-events-none">
          {currentType === "magic" && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                isHot
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-stone-800 text-stone-200 border border-stone-700"
              }`}
            >
              {isHot ? <Flame size={10} className="text-amber-600" /> : <Snowflake size={10} />}
              {isHot ? "Hot Beverage (Revealed)" : "Cold State (Hidden Coating)"}
            </span>
          )}
        </div>

        {/* 360 Drag Prompt */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[10px] font-medium bg-[#29251F]/75 text-amber-100 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
            <RotateCw size={11} className={isRotating ? "animate-spin" : ""} /> Drag horizontally to rotate 360°
          </span>
        </div>

        {/* Rotation Toggle */}
        <button
          type="button"
          onClick={() => setIsRotating((r) => !r)}
          className="absolute top-3 right-3 text-xs bg-white/90 hover:bg-white p-1.5 rounded-lg shadow-xs text-stone-700 border border-stone-200"
          title={isRotating ? "Pause Auto-Rotation" : "Resume Auto-Rotation"}
        >
          {isRotating ? "Pause" : "Spin"}
        </button>
      </div>

      {/* Photo Uploader & Resolution Advisory */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-stone-800">Preview with your photograph</span>
          <label className="cursor-pointer text-xs font-semibold text-[#8B6D3F] hover:underline flex items-center gap-1">
            <Upload size={13} /> Choose photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        {photoUrl ? (
          <p className="text-[11px] text-emerald-700 flex items-center gap-1">
            ✓ Photograph wrapped around 3D cylinder. Drag to check handle area.
          </p>
        ) : (
          <p className="text-[11px] text-stone-500">
            Processed locally on your device. Never uploaded until order submission.
          </p>
        )}

        {currentType === "magic" && (
          <p className="text-[11px] text-stone-500 flex items-start gap-1">
            <Info size={12} className="shrink-0 mt-0.5 text-stone-400" />
            <span>
              Thermal reveal is an illustrative approximation. In actual use, pouring hot tea/coffee above 60°C reveals your photo within seconds.
            </span>
          </p>
        )}

        {resolutionWarning && (
          <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 text-[11px]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{resolutionWarning}</span>
          </div>
        )}
      </div>
    </div>
  );
}
