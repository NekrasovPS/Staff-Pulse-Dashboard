import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrgTreeView } from "@/features/org-tree/ui/OrgTreeView";
import { OrgTable } from "@/features/org-table/ui/OrgTable";
import {
  OrgUiProvider,
  useOrgUi,
} from "@/features/org-view/model/OrgUiContext";
import { useOrgWebSocket } from "@/features/org-socket/api/useOrgWebSocket";
import { ConnectionBadge } from "@/features/org-socket/ui/ConnectionBadge";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
  }
`;

const Layout = styled.main`
  min-height: 100vh;
  padding: 32px 24px;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MainTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.span`
  font-size: 14px;
  color: #64748b;
`;

const TabSwitcher = styled.div`
  display: flex;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 8px;

  @media (min-width: 1280px) {
    display: none;
  }
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  border: none;
  outline: none;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  background-color: ${({ $isActive }) =>
    $isActive ? "#ffffff" : "transparent"};
  color: ${({ $isActive }) => ($isActive ? "#0f172a" : "#64748b")};
  box-shadow: ${({ $isActive }) =>
    $isActive ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none"};
  transition: all 0.2s ease;
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: 1280px) {
    display: grid;
    grid-template-columns: 480px 1fr;
    align-items: start;
  }
`;

const ViewPanel = styled.div<{ $isVisibleOnMobile: boolean }>`
  display: ${({ $isVisibleOnMobile }) =>
    $isVisibleOnMobile ? "block" : "none"};

  @media (min-width: 1280px) {
    display: block;
  }
`;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const DashboardContent: React.FC = () => {
  const { activeTab, setActiveTab } = useOrgUi();
  const { status } = useOrgWebSocket();

  return (
    <Layout>
      <Header>
        <TitleGroup>
          <MainTitle>Staff Pulse Dashboard</MainTitle>
          <Subtitle>
            Мониторинг оргструктуры и эффективности подразделений
          </Subtitle>
        </TitleGroup>

        <HeaderRight>
          <ConnectionBadge status={status} />
          <TabSwitcher>
            <TabButton
              $isActive={activeTab === "tree"}
              onClick={() => setActiveTab("tree")}
            >
              Дерево
            </TabButton>
            <TabButton
              $isActive={activeTab === "table"}
              onClick={() => setActiveTab("table")}
            >
              Таблица
            </TabButton>
          </TabSwitcher>
        </HeaderRight>
      </Header>

      <ContentGrid>
        <ViewPanel $isVisibleOnMobile={activeTab === "tree"}>
          <OrgTreeView />
        </ViewPanel>

        <ViewPanel $isVisibleOnMobile={activeTab === "table"}>
          <OrgTable />
        </ViewPanel>
      </ContentGrid>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <OrgUiProvider>
        <GlobalStyle />
        <DashboardContent />
      </OrgUiProvider>
    </QueryClientProvider>
  );
};

export default App;
