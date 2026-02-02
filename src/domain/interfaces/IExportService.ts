export interface ExportOptions {
    fileName: string;
    sheetName?: string;
    title?: string;
    columns: { header: string; dataKey: string }[];
    data: any[];
}

export interface IExportService {
    exportToExcel(options: ExportOptions): void;
    exportToCSV(options: ExportOptions): void;
    exportToPDF(options: ExportOptions): void;
}
