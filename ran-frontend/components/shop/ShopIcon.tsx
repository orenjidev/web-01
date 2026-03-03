"use client";

import React from "react";

interface ShopIconProps {
  iconUrl: string;
  iconType: "atlas" | "direct";
  iconMain?: number;
  iconSub?: number;
  size?: number;
  className?: string;
}

const GRID_SIZE = 35;

export const ShopIcon: React.FC<ShopIconProps> = ({
  iconUrl,
  iconType,
  iconMain = 0,
  iconSub = 0,
  size = GRID_SIZE,
  className = "",
}) => {
  if (!iconUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-gray-800 ${className}`}
      />
    );
  }

  if (iconType === "direct") {
    return (
      <img
        src={iconUrl}
        width={size}
        height={size}
        alt="icon"
        className={className}
        draggable={false}
      />
    );
  }

  const x = iconMain * GRID_SIZE;
  const y = iconSub * GRID_SIZE;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${iconUrl})`,
        backgroundPosition: `-${x}px -${y}px`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};
