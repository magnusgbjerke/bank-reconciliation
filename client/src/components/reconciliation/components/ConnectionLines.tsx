import React from "react";
import { ConnectionLine } from "../types";

interface ConnectionLinesProps {
  connectionLines: ConnectionLine[];
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  connectionLines,
}) => (
  <svg
    className="fixed inset-0 pointer-events-none z-10 hidden lg:block"
    style={{ width: "100vw", height: "100vh" }}
  >
    {connectionLines.map((line) => {
      const isBank = line.type === "bank";
      const midX = (line.startX + line.endX) / 2;
      const midY = (line.startY + line.endY) / 2;

      let pathData;
      if (isBank) {
        pathData = `
          M ${line.startX} ${line.startY}
          L ${midX - 30} ${line.startY}
          Q ${midX - 15} ${line.startY} ${midX} ${midY}
          Q ${midX + 15} ${line.endY} ${midX + 30} ${line.endY}
          L ${line.endX} ${line.endY}
        `;
      } else {
        pathData = `
          M ${line.startX} ${line.startY}
          L ${midX + 30} ${line.startY}
          Q ${midX + 15} ${line.startY} ${midX} ${midY}
          Q ${midX - 15} ${line.endY} ${midX - 30} ${line.endY}
          L ${line.endX} ${line.endY}
        `;
      }

      return (
        <path
          key={line.id}
          d={pathData}
          stroke={line.type === "bank" ? "#3b82f6" : "#10b981"}
          strokeWidth="3"
          strokeDasharray="12,8"
          opacity="0.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-20"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0.4;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values="3;4;3"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      );
    })}
  </svg>
);
