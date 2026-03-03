"use client";

import { useAuth } from "@/context/AuthContext";

export default function AccountSection() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-6 text-xs text-gray-300 relative top-[0.5px]">
      <div>
        <span className="mr-1 text-gray-400">Account:</span>
        <span className="font-medium text-white">{user.userid}</span>
      </div>

      <div>
        <span className="mr-1 text-gray-400">ePoints:</span>
        <span className="font-semibold text-white tabular-nums">
          {user.epoint}
        </span>
      </div>

      <div>
        <span className="mr-1 text-gray-400">vPoints:</span>
        <span className="font-semibold text-white tabular-nums">
          {user.vpoint}
        </span>
      </div>
    </div>
  );
}
