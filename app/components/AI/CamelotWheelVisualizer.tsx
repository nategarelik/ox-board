'use client';

import React from 'react';

interface CamelotWheelVisualizerProps {
  currentKey?: { key: string; scale: 'major' | 'minor' };
  compatibleKeys?: string[];
  className?: string;
}

/**
 * Interactive Camelot Wheel for harmonic mixing visualization
 * Shows current key and compatible mixing keys
 */
export const CamelotWheelVisualizer: React.FC<CamelotWheelVisualizerProps> = ({
  currentKey,
  compatibleKeys = [],
  className = ''
}) => {
  // Camelot Wheel positions (outer = major, inner = minor)
  const wheelPositions = [
    { position: 1, major: 'B', minor: 'G#m', angle: 0 },
    { position: 2, major: 'F#', minor: 'D#m', angle: 30 },
    { position: 3, major: 'C#', minor: 'A#m', angle: 60 },
    { position: 4, major: 'G#', minor: 'Fm', angle: 90 },
    { position: 5, major: 'D#', minor: 'Cm', angle: 120 },
    { position: 6, major: 'A#', minor: 'Gm', angle: 150 },
    { position: 7, major: 'F', minor: 'Dm', angle: 180 },
    { position: 8, major: 'C', minor: 'Am', angle: 210 },
    { position: 9, major: 'G', minor: 'Em', angle: 240 },
    { position: 10, major: 'D', minor: 'Bm', angle: 270 },
    { position: 11, major: 'A', minor: 'F#m', angle: 300 },
    { position: 12, major: 'E', minor: 'C#m', angle: 330 }
  ];

  const getCurrentPosition = () => {
    if (!currentKey) return null;

    const keyStr = currentKey.scale === 'major' ? currentKey.key : `${currentKey.key}m`;
    return wheelPositions.find(pos =>
      pos.major === keyStr || pos.minor === keyStr
    );
  };

  const isCompatible = (position: typeof wheelPositions[0], type: 'major' | 'minor') => {
    const keyStr = type === 'major' ? position.major : position.minor;
    return compatibleKeys.includes(keyStr);
  };

  const isCurrent = (position: typeof wheelPositions[0], type: 'major' | 'minor') => {
    if (!currentKey) return false;
    const keyStr = type === 'major' ? position.major : position.minor;
    const currentKeyStr = currentKey.scale === 'major' ? currentKey.key : `${currentKey.key}m`;
    return keyStr === currentKeyStr;
  };

  const centerX = 120;
  const centerY = 120;
  const outerRadius = 90;
  const innerRadius = 60;

  const getPositionCoords = (angle: number, radius: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian)
    };
  };

  const currentPosition = getCurrentPosition();

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Camelot Wheel</h3>
        <p className="text-sm text-gray-400">Harmonic Mixing Guide</p>
        {currentKey && (
          <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/20 border border-blue-600/50 rounded-full">
            <span className="text-blue-400 text-sm">Current:</span>
            <span className="text-white font-medium">
              {currentKey.key} {currentKey.scale}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <svg width="240" height="240" viewBox="0 0 240 240" className="drop-shadow-lg">
          {/* Background circles */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke="rgb(55, 65, 81)"
            strokeWidth="2"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="none"
            stroke="rgb(55, 65, 81)"
            strokeWidth="2"
          />

          {/* Position markers and labels */}
          {wheelPositions.map((pos) => {
            const outerCoords = getPositionCoords(pos.angle, outerRadius);
            const innerCoords = getPositionCoords(pos.angle, innerRadius);
            const labelCoords = getPositionCoords(pos.angle, outerRadius + 20);

            return (
              <g key={pos.position}>
                {/* Position number */}
                <text
                  x={labelCoords.x}
                  y={labelCoords.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold fill-gray-300"
                >
                  {pos.position}
                </text>

                {/* Major key (outer ring) */}
                <circle
                  cx={outerCoords.x}
                  cy={outerCoords.y}
                  r="12"
                  className={`${
                    isCurrent(pos, 'major')
                      ? 'fill-blue-500 stroke-blue-300'
                      : isCompatible(pos, 'major')
                      ? 'fill-green-500/70 stroke-green-300'
                      : 'fill-gray-700 stroke-gray-500'
                  } stroke-2 transition-all duration-300`}
                />
                <text
                  x={outerCoords.x}
                  y={outerCoords.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs font-semibold ${
                    isCurrent(pos, 'major') || isCompatible(pos, 'major')
                      ? 'fill-white'
                      : 'fill-gray-300'
                  }`}
                >
                  B
                </text>

                {/* Minor key (inner ring) */}
                <circle
                  cx={innerCoords.x}
                  cy={innerCoords.y}
                  r="12"
                  className={`${
                    isCurrent(pos, 'minor')
                      ? 'fill-blue-500 stroke-blue-300'
                      : isCompatible(pos, 'minor')
                      ? 'fill-green-500/70 stroke-green-300'
                      : 'fill-gray-700 stroke-gray-500'
                  } stroke-2 transition-all duration-300`}
                />
                <text
                  x={innerCoords.x}
                  y={innerCoords.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs font-semibold ${
                    isCurrent(pos, 'minor') || isCompatible(pos, 'minor')
                      ? 'fill-white'
                      : 'fill-gray-300'
                  }`}
                >
                  A
                </text>

                {/* Connection lines for current key */}
                {currentPosition && currentPosition.position === pos.position && (
                  <>
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={outerCoords.x}
                      y2={outerCoords.y}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={innerCoords.x}
                      y2={innerCoords.y}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Center label */}
          <circle
            cx={centerX}
            cy={centerY}
            r="25"
            fill="rgb(31, 41, 55)"
            stroke="rgb(75, 85, 99)"
            strokeWidth="2"
          />
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-white"
          >
            CAMELOT
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-300"
          >
            WHEEL
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-300">Current Key</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          <span className="text-gray-300">Compatible</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-700"></div>
          <span className="text-gray-300">Other Keys</span>
        </div>
      </div>

      {/* Compatible keys list */}
      {compatibleKeys.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Compatible Keys</h4>
          <div className="flex flex-wrap gap-2">
            {compatibleKeys.map((key) => (
              <span
                key={key}
                className="px-2 py-1 bg-green-600/20 border border-green-600/50 rounded text-xs text-green-400"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mixing rules */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Mixing Rules</h4>
        <div className="space-y-1 text-xs text-gray-400">
          <div>• Same number = Perfect match</div>
          <div>• Adjacent numbers (±1) = Good match</div>
          <div>• Same number, different letter = Relative major/minor</div>
          <div>• B = Major keys, A = Minor keys</div>
        </div>
      </div>
    </div>
  );
};