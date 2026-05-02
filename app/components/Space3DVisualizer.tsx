'use client';
import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { translations, type Language } from '@/lib/translations';

interface Space3DVisualizerProps {
  spaceWidth?: number;
  spaceLength?: number;
  spaceHeight?: number;
  imageUrl?: string;  // kept in interface for compatibility but ignored
  onClose: () => void;
}

interface Package {
  id: string;
  w: number;
  h: number;
  l: number;
  color: string;
  x: number;
  y: number;
  z: number;
}

const COLORS = ['#ff6b35', '#2b6cb0', '#48bb78', '#ed8936', '#9f7aea', '#ed64a6'];

const Wall = ({ width, height, position, rotation }: { width: number, height: number, position: [number, number, number], rotation: [number, number, number] }) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[width, height]} />
    <meshStandardMaterial color="#dce8f5" side={THREE.DoubleSide} transparent opacity={0.6} />
  </mesh>
);

// Clickable package box — highlights when selected
function PackageBox({
  pkg,
  selected,
  onClick,
}: {
  pkg: Package;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      args={[pkg.w, pkg.h, pkg.l]}
      position={[pkg.x, pkg.y, pkg.z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <meshStandardMaterial color={pkg.color} emissive={selected ? '#ffffff' : '#000000'} emissiveIntensity={selected ? 0.25 : 0} />
      <Edges color={selected ? '#facc15' : '#000'} scale={1.01} lineWidth={selected ? 3 : 1} />
    </Box>
  );
}

export default function Space3DVisualizer({
  spaceWidth = 3,
  spaceLength = 3,
  spaceHeight = 2.5,
  onClose
}: Space3DVisualizerProps) {
  const [lang, setLang] = useState<Language>('en');
  const [packages, setPackages] = useState<Package[]>([]);
  const [newPkgWidth, setNewPkgWidth] = useState<number>(0.5);
  const [newPkgHeight, setNewPkgHeight] = useState<number>(0.5);
  const [newPkgLength, setNewPkgLength] = useState<number>(0.5);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    if (match?.[1] === 'ar') setLang('ar');
  }, []);

  const t = translations[lang];

  const selectedPkg = packages.find(p => p.id === selectedId) ?? null;

  // ── Add package ──────────────────────────────────────────────────────────
  const addPackage = () => {
    const margin = 0.1;
    const maxX = (spaceWidth / 2) - (newPkgWidth / 2) - margin;
    const maxZ = (spaceLength / 2) - (newPkgLength / 2) - margin;

    let targetX = (Math.random() * 2 - 1) * Math.max(0, maxX);
    let targetZ = (Math.random() * 2 - 1) * Math.max(0, maxZ);
    let targetY = newPkgHeight / 2;

    let collision = true;
    let attempts = 0;
    while (collision && attempts < 50) {
      collision = false;
      for (const p of packages) {
        const overlapX = Math.abs(targetX - p.x) < (newPkgWidth / 2 + p.w / 2);
        const overlapZ = Math.abs(targetZ - p.z) < (newPkgLength / 2 + p.l / 2);
        if (overlapX && overlapZ) {
          if (targetY < p.y + p.h / 2 + newPkgHeight / 2) {
            targetY = p.y + p.h / 2 + newPkgHeight / 2;
          }
        }
      }
      attempts++;
    }

    const newPkg: Package = {
      id: Math.random().toString(36).substring(7),
      w: newPkgWidth,
      h: newPkgHeight,
      l: newPkgLength,
      color: COLORS[packages.length % COLORS.length],
      x: targetX,
      y: targetY,
      z: targetZ
    };

    setPackages(prev => [...prev, newPkg]);
    setSelectedId(newPkg.id);
  };

  // ── Move selected package ─────────────────────────────────────────────────
  const moveSelected = (axis: 'x' | 'y' | 'z', value: number) => {
    setPackages(prev =>
      prev.map(p => p.id === selectedId ? { ...p, [axis]: value } : p)
    );
  };

  // ── Remove selected package ───────────────────────────────────────────────
  const removeSelected = () => {
    setPackages(prev => prev.filter(p => p.id !== selectedId));
    setSelectedId(null);
  };

  const clearPackages = () => { setPackages([]); setSelectedId(null); };

  const roomVolume = spaceWidth * spaceLength * spaceHeight;
  const packagesVolume = packages.reduce((acc, p) => acc + (p.w * p.h * p.l), 0);
  const percentFilled = (packagesVolume / roomVolume) * 100;
  const isOverflowing = packages.some(p => (p.y + p.h / 2) > spaceHeight);

  // Slider bounds for the selected package
  const xMin = selectedPkg ? -((spaceWidth - selectedPkg.w) / 2) : 0;
  const xMax = selectedPkg ?  ((spaceWidth - selectedPkg.w) / 2) : 0;
  const yMin = selectedPkg ? selectedPkg.h / 2 : 0;
  const yMax = selectedPkg ? spaceHeight - selectedPkg.h / 2 : 0;
  const zMin = selectedPkg ? -((spaceLength - selectedPkg.l) / 2) : 0;
  const zMax = selectedPkg ?  ((spaceLength - selectedPkg.l) / 2) : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>

      {/* Mobile-responsive styles */}
      <style>{`
        .visualizer-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .visualizer-controls {
          width: 320px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          min-height: 0;
        }
        .visualizer-canvas {
          flex: 1;
          position: relative;
          min-height: 0;
          overflow: hidden;
        }
        .pos-slider { width: 100%; accent-color: #ff6b35; cursor: pointer; }
        @media (max-width: 640px) {
          .visualizer-body {
            flex-direction: column;
            height: 100%;
          }
          .visualizer-canvas {
            flex: 0 0 50% !important;
            height: 50% !important;
            max-height: 50% !important;
            order: 1;
            overflow: hidden;
          }
          .visualizer-controls {
            width: 100% !important;
            border-right: none;
            border-top: 1px solid #e2e8f0;
            flex: 0 0 50% !important;
            height: 50% !important;
            max-height: 50% !important;
            order: 2;
            padding: 16px;
            overflow-y: auto;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1a365d' }}>{t.visualizer3DTitle}</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4a5568' }}>
            {t.visualizerRoomDimensions}: {spaceWidth}{t.visualizerMeter} ({t.visualizerW}) × {spaceLength}{t.visualizerMeter} ({t.visualizerL}) × {spaceHeight}{t.visualizerMeter} ({t.visualizerH})
            &nbsp;|&nbsp; {t.visualizerVolume}: {roomVolume.toFixed(2)} {t.visualizerMeter}³
          </p>
        </div>
        <button onClick={onClose} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
      </div>

      <div className="visualizer-body">

        {/* Controls panel */}
        <div className="visualizer-controls">

          {/* ── Add Package ── */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2d3748', marginTop: 0 }}>{t.visualizerAddPackage}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>{t.visualizerWidthM}</label>
              <input type="number" step="0.1" min="0.1" max={spaceWidth} value={newPkgWidth} onChange={e => setNewPkgWidth(Math.min(parseFloat(e.target.value) || 0.1, spaceWidth))} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>{t.visualizerLengthM}</label>
              <input type="number" step="0.1" min="0.1" max={spaceLength} value={newPkgLength} onChange={e => setNewPkgLength(Math.min(parseFloat(e.target.value) || 0.1, spaceLength))} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', marginTop: '4px' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>{t.visualizerHeightM}</label>
              <input type="number" step="0.1" min="0.1" max={spaceHeight} value={newPkgHeight} onChange={e => setNewPkgHeight(Math.min(parseFloat(e.target.value) || 0.1, spaceHeight))} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', marginTop: '4px' }} />
            </div>
          </div>

          <button onClick={addPackage} style={{ width: '100%', padding: '10px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
            {t.visualizerAddToSpace}
          </button>

          {/* ── Position Controls (shown when a package is selected) ── */}
          {selectedPkg && (
            <div style={{ background: '#fff', border: '2px solid #ff6b35', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1a365d' }}>
                  📦 Move Package
                </h3>
                <button
                  onClick={removeSelected}
                  style={{ background: '#fff5f5', border: '1px solid #fc8181', color: '#e53e3e', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>

              {/* X slider */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>← Left / Right →</label>
                  <span style={{ fontSize: '12px', color: '#718096' }}>{selectedPkg.x.toFixed(2)} m</span>
                </div>
                <input
                  className="pos-slider"
                  type="range"
                  min={xMin}
                  max={xMax}
                  step={0.01}
                  value={selectedPkg.x}
                  onChange={e => moveSelected('x', parseFloat(e.target.value))}
                />
              </div>

              {/* Y slider */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>↓ Down / Up ↑</label>
                  <span style={{ fontSize: '12px', color: '#718096' }}>{(selectedPkg.y - selectedPkg.h / 2).toFixed(2)} m from floor</span>
                </div>
                <input
                  className="pos-slider"
                  type="range"
                  min={yMin}
                  max={yMax}
                  step={0.01}
                  value={selectedPkg.y}
                  onChange={e => moveSelected('y', parseFloat(e.target.value))}
                />
              </div>

              {/* Z slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>← Front / Back →</label>
                  <span style={{ fontSize: '12px', color: '#718096' }}>{selectedPkg.z.toFixed(2)} m</span>
                </div>
                <input
                  className="pos-slider"
                  type="range"
                  min={zMin}
                  max={zMax}
                  step={0.01}
                  value={selectedPkg.z}
                  onChange={e => moveSelected('z', parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}

          {!selectedPkg && packages.length > 0 && (
            <p style={{ fontSize: '12px', color: '#a0aec0', textAlign: 'center', margin: '0 0 20px 0' }}>
              Click a package in the 3D view to select and move it
            </p>
          )}

          {/* ── Status ── */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2d3748', margin: '0 0 12px 0' }}>{t.visualizerStatus}</h3>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#4a5568', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.visualizerPackages}:</span> <strong>{packages.length}</strong>
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4a5568', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.visualizerFilledVolume}:</span> <strong>{percentFilled.toFixed(1)}% ({packagesVolume.toFixed(2)} {t.visualizerMeter}³)</strong>
              </p>
              <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, percentFilled)}%`, background: isOverflowing ? '#e53e3e' : '#48bb78', transition: 'width 0.3s ease' }} />
              </div>
              {isOverflowing && (
                <p style={{ color: '#e53e3e', fontSize: '12px', fontWeight: 600, marginTop: '12px', marginBottom: 0 }}>
                  {t.visualizerOverflowWarning}
                </p>
              )}
            </div>
          </div>

          {packages.length > 0 && (
            <button onClick={clearPackages} style={{ width: '100%', padding: '10px', background: '#fff', color: '#e53e3e', border: '1px solid #fc8181', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
              {t.visualizerClearAll}
            </button>
          )}
        </div>

        {/* 3D Canvas */}
        <div className="visualizer-canvas">
          <Canvas
            camera={{ position: [spaceWidth * 1.5, spaceHeight * 1.5, spaceLength * 1.5], fov: 45 }}
            onPointerMissed={() => setSelectedId(null)}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            <OrbitControls target={[0, spaceHeight / 2, 0]} />

            {/* Room Base (Floor) */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[spaceWidth, spaceLength]} />
              <meshStandardMaterial color="#edf2f7" />
              <Edges color="#cbd5e0" />
            </mesh>

            {/* Outline Room (Wireframe) */}
            <Box args={[spaceWidth, spaceHeight, spaceLength]} position={[0, spaceHeight / 2, 0]}>
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              <Edges color="#a0aec0" opacity={0.5} transparent />
            </Box>

            {/* Walls */}
            <Wall width={spaceWidth} height={spaceHeight} position={[0, spaceHeight / 2, -spaceLength / 2]} rotation={[0, 0, 0]} />
            <Wall width={spaceLength} height={spaceHeight} position={[-spaceWidth / 2, spaceHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
            <Wall width={spaceLength} height={spaceHeight} position={[spaceWidth / 2, spaceHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} />

            {/* Packages */}
            {packages.map(p => (
              <PackageBox
                key={p.id}
                pkg={p}
                selected={p.id === selectedId}
                onClick={() => setSelectedId(prev => prev === p.id ? null : p.id)}
              />
            ))}

          </Canvas>
          <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ background: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>
              {selectedId ? '📦 Package selected — use sliders to move it' : t.visualizerDragHint}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
