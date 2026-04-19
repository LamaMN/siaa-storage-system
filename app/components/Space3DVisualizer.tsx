'use client';
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Edges } from '@react-three/drei';
import * as THREE from 'three';

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

export default function Space3DVisualizer({
  spaceWidth = 3,
  spaceLength = 3,
  spaceHeight = 2.5,
  onClose
}: Space3DVisualizerProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [newPkgWidth, setNewPkgWidth] = useState<number>(0.5);
  const [newPkgHeight, setNewPkgHeight] = useState<number>(0.5);
  const [newPkgLength, setNewPkgLength] = useState<number>(0.5);

  const addPackage = () => {
    // Simple stacking logic: find highest point at center, or just stack upwards at origin
    // For a real app, this would be a bin-packing algorithm.
    // For now, we stack them in a grid simply to visualize.
    
    // We'll place it randomly on the floor for visual effect, but clamping within room size
    const margin = 0.1;
    const maxX = (spaceWidth / 2) - (newPkgWidth / 2) - margin;
    const maxZ = (spaceLength / 2) - (newPkgLength / 2) - margin;
    
    let targetX = (Math.random() * 2 - 1) * Math.max(0, maxX);
    let targetZ = (Math.random() * 2 - 1) * Math.max(0, maxZ);
    let targetY = newPkgHeight / 2; // on the floor

    // Very naive collision detection to stack
    let collision = true;
    let attempts = 0;
    while(collision && attempts < 50) {
      collision = false;
      for(const p of packages) {
        // check flat bounds
        const overlapX = Math.abs(targetX - p.x) < (newPkgWidth/2 + p.w/2);
        const overlapZ = Math.abs(targetZ - p.z) < (newPkgLength/2 + p.l/2);
        if(overlapX && overlapZ) {
          // overlap, so put it on top
          if (targetY < p.y + p.h/2 + newPkgHeight/2) {
             targetY = p.y + p.h/2 + newPkgHeight/2;
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

    setPackages([...packages, newPkg]);
  };

  const clearPackages = () => setPackages([]);

  const roomVolume = spaceWidth * spaceLength * spaceHeight;
  const packagesVolume = packages.reduce((acc, p) => acc + (p.w * p.h * p.l), 0);
  const percentFilled = (packagesVolume / roomVolume) * 100;
  
  // Is any package overflowing height?
  const isOverflowing = packages.some(p => (p.y + p.h/2) > spaceHeight);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1a365d' }}>3D Space Visualizer</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4a5568' }}>
            Room Dimensions: {spaceWidth}m (W) × {spaceLength}m (L) × {spaceHeight}m (H) 
            &nbsp;|&nbsp; Volume: {roomVolume.toFixed(2)} m³
          </p>
        </div>
        <button onClick={onClose} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar: Controls */}
        <div style={{ width: '320px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2d3748', marginTop: 0 }}>Add Package</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>Width (m)</label>
              <input type="number" step="0.1" min="0.1" value={newPkgWidth} onChange={e => setNewPkgWidth(parseFloat(e.target.value) || 0.1)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>Length (m)</label>
              <input type="number" step="0.1" min="0.1" value={newPkgLength} onChange={e => setNewPkgLength(parseFloat(e.target.value) || 0.1)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', marginTop: '4px' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>Height (m)</label>
              <input type="number" step="0.1" min="0.1" value={newPkgHeight} onChange={e => setNewPkgHeight(parseFloat(e.target.value) || 0.1)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '6px', marginTop: '4px' }} />
            </div>
          </div>
          
          <button onClick={addPackage} style={{ width: '100%', padding: '10px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginBottom: '24px' }}>
            Add to Space
          </button>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2d3748', margin: '0 0 12px 0' }}>Status</h3>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#4a5568', display: 'flex', justifyContent: 'space-between' }}>
                <span>Packages:</span> <strong>{packages.length}</strong>
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4a5568', display: 'flex', justifyContent: 'space-between' }}>
                <span>Filled Volume:</span> <strong>{percentFilled.toFixed(1)}% ({packagesVolume.toFixed(2)} m³)</strong>
              </p>
              
              <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, percentFilled)}%`, background: isOverflowing ? '#e53e3e' : '#48bb78', transition: 'width 0.3s ease' }} />
              </div>
              
              {isOverflowing && (
                <p style={{ color: '#e53e3e', fontSize: '12px', fontWeight: 600, marginTop: '12px', marginBottom: 0 }}>
                  ⚠️ Warning: Packages exceed room height!
                </p>
              )}
            </div>
          </div>
          
          {packages.length > 0 && (
            <button onClick={clearPackages} style={{ width: '100%', padding: '10px', background: '#fff', color: '#e53e3e', border: '1px solid #fc8181', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
              Clear All Packages
            </button>
          )}
        </div>

        {/* Right Area: 3D Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas camera={{ position: [spaceWidth * 1.5, spaceHeight * 1.5, spaceLength * 1.5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            <OrbitControls target={[0, spaceHeight/2, 0]} />

            {/* Room Base (Floor) */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[spaceWidth, spaceLength]} />
              <meshStandardMaterial color="#edf2f7" />
              <Edges color="#cbd5e0" />
            </mesh>
            
            {/* Outline Room (Wireframe) */}
            <Box args={[spaceWidth, spaceHeight, spaceLength]} position={[0, spaceHeight/2, 0]}>
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              <Edges color="#a0aec0" opacity={0.5} transparent />
            </Box>

            {/* Walls */}
            <Wall width={spaceWidth} height={spaceHeight} position={[0, spaceHeight/2, -spaceLength/2]} rotation={[0, 0, 0]} />
            <Wall width={spaceLength} height={spaceHeight} position={[-spaceWidth/2, spaceHeight/2, 0]} rotation={[0, Math.PI/2, 0]} />
            <Wall width={spaceLength} height={spaceHeight} position={[spaceWidth/2, spaceHeight/2, 0]} rotation={[0, -Math.PI/2, 0]} />

            {/* Packages */}
            {packages.map(p => (
              <Box key={p.id} args={[p.w, p.h, p.l]} position={[p.x, p.y, p.z]}>
                <meshStandardMaterial color={p.color} />
                <Edges color="#000" scale={1.01} />
              </Box>
            ))}

          </Canvas>
          <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ background: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>
              Drag to rotate &middot; Scroll to zoom
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
