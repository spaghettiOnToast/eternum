import React from "react";
import { TopNavigation } from "../modules/top-navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-[calc(100vh)] w-full">
      <div className="">
        <TopNavigation />
      </div>
      <div className="flex-grow border-gold/15 border-t overflow-auto rounded">{children}</div>
    </div>
  );
};
