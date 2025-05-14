import { create } from 'zustand';

interface TableRoute {
  path: string;
  table: string;
  primary: string;
  button: string;
}

interface ConfigState {
  dbConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  tablesToWatch: string[];
  tableRoutes: TableRoute[];

  setDbConfig: (config: ConfigState['dbConfig']) => void;
  setTablesToWatch: (tables: string[]) => void;
  setTableRoutes: (routes: TableRoute[]) => void;

  // 패널 열림 여부
  isSqlPanelVisible: boolean;
  isConfigVisible: boolean;
  setIsSqlPanelVisible: (visible: boolean) => void;
  setIsConfigVisible: (visible: boolean) => void;

  isInsertPanelVisible: boolean;
  setIsInsertPanelVisible: (visible: boolean) => void;

}

export const useConfigStore = create<ConfigState>((set) => ({
  dbConfig: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '0000',
    database: 'mydb',
  },
  tablesToWatch: [],
  tableRoutes: [],
  // 기본 값 설정
  // tableRoutes: [
  //   {
  //     path: '/logs',
  //     table: 'private.system_log',
  //     primary: 'idx',
  //     button: 'View Logs',
  //   },
  //   {
  //     path: '/events',
  //     table: 'history',
  //     primary: 'idx',
  //     button: 'View Events',
  //   },
  // ],

  setDbConfig: (config) => set({ dbConfig: config }),
  setTablesToWatch: (tables) => set({ tablesToWatch: tables }),
  setTableRoutes: (routes) => set({ tableRoutes: routes }),

  // 패널 열림 여부
  isSqlPanelVisible: false,
  isConfigVisible: false,
  setIsSqlPanelVisible: (visible) => set({ isSqlPanelVisible: visible }),
  setIsConfigVisible: (visible) => set({ isConfigVisible: visible }),

  isInsertPanelVisible: false,
  setIsInsertPanelVisible: (visible) => set({ isInsertPanelVisible: visible }),
}));
