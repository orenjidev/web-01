"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export const ServerInfoSection = () => {
  return (
    <div className="pb-4">
      <Card>
        <CardHeader>
          <CardTitle> Server Information </CardTitle>
          <CardDescription>RNG Server</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="font-medium text-sm">FEATURES</span>
          <div className="text-xs">
            <p>Official Ran GS Server - 2015</p>
            <p>Optimized Render (GPU Based)</p>
            <p>8 Class Gameplay (Magician)</p>
            <p>Official Items - Item Set Option</p>
            <p>Official Skill Effect</p>
            <p>Official Contribution System and Accessories</p>
            <p>Official Item Compound</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
