import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type PageTitleState = { label?: string; caption?: string };
type Ctx = { pageTitle: PageTitleState; setPageTitle: (t: PageTitleState) => void };

const PageTitleContext = createContext<Ctx>({ pageTitle: {}, setPageTitle: () => {} });

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitleState] = useState<PageTitleState>({});
  const setPageTitle = useCallback((t: PageTitleState) => setPageTitleState(t), []);
  return <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}

export function useSetPageTitle(title: PageTitleState | null) {
  const { setPageTitle } = usePageTitle();
  useEffect(() => {
    if (title) setPageTitle(title);
    return () => setPageTitle({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title?.label, title?.caption]);
}
