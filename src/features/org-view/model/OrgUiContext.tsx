import React, { createContext, useContext, useState, useMemo } from "react";

export type ActiveTab = "tree" | "table";

interface OrgUiContextValue {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const OrgUiContext = createContext<OrgUiContextValue | null>(null);

export const OrgUiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("tree");

  const value = useMemo(
    () => ({
      selectedNodeId,
      setSelectedNodeId,
      searchQuery,
      setSearchQuery,
      activeTab,
      setActiveTab,
    }),
    [selectedNodeId, searchQuery, activeTab],
  );

  return (
    <OrgUiContext.Provider value={value}>{children}</OrgUiContext.Provider>
  );
};

export const useOrgUi = (): OrgUiContextValue => {
  const context = useContext(OrgUiContext);
  if (!context) {
    throw new Error("useOrgUi must be used within an OrgUiProvider");
  }
  return context;
};
