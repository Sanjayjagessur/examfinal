declare global {
  interface Window {
    electronAPI: {
      saveTimetable: (data: any) => Promise<{ success: boolean; filePath?: string; message?: string }>;
      loadTimetable: () => Promise<{ success: boolean; data?: any; filePath?: string; message?: string }>;
      autoSave: (data: any) => Promise<{ success: boolean; message?: string }>;
      autoLoad: () => Promise<{ success: boolean; data?: any; message?: string }>;
    };
  }
}

export {};
