import { useId } from "react";

export default function S4Logo({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `s4grad-${uid}`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="S4 Security"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M20 3L5 9v11c0 8.284 6.268 15.621 15 17C29.732 35.621 36 28.284 36 20V9L20 3z"
        fill={`url(#${gradId})`}
        opacity="0.15"
      />
      <path
        d="M20 3L5 9v11c0 8.284 6.268 15.621 15 17C29.732 35.621 36 28.284 36 20V9L20 3z"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        fill={`url(#${gradId})`}
        letterSpacing="-0.5"
      >
        S4
      </text>
    </svg>
  );
}
