import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrgTreeView } from '@/features/org-tree/ui/OrgTreeView';

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
  padding: 40px 20px;
`;

const Header = styled.header`
  max-width: 800px;
  margin: 0 auto 24px auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MainTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
`;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyle />
      <Layout>
        <Header>
          <MainTitle>Staff Pulse Dashboard</MainTitle>
        </Header>
        <OrgTreeView />
      </Layout>
    </QueryClientProvider>
  );
};

export default App;