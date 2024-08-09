import useUIStore from "@/hooks/store/useUIStore";
import { useEffect } from "react";

export const BattleContainer = ({ children }: { children: React.ReactNode }) => {
  const setBattleView = useUIStore((state) => state.setBattleView);

  const handleEscapePress = (e: any) => {
    if (e.key === "Escape") {
      setBattleView(null);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", (e) => handleEscapePress(e));
    return () => document.removeEventListener("keydown", (e) => handleEscapePress(e));
  }, []);

  return (
    <div className="w-screen h-screen z-[200] bg-transparent top-0 left-0 absolute pointer-events-auto">{children}</div>
  );
};
