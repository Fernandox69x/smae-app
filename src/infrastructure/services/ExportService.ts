import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { IExportService, ExportOptions } from '../../domain/interfaces/IExportService';

export class ExportService implements IExportService {
    exportToExcel(options: ExportOptions): void {
        const { fileName, sheetName = 'Sheet1', columns, data } = options;

        // Map data to display headers
        const exportData = data.map(item => {
            const row: any = {};
            columns.forEach(col => {
                row[col.header] = item[col.dataKey];
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    exportToCSV(options: ExportOptions): void {
        const { fileName, columns, data } = options;

        const exportData = data.map(item => {
            const row: any = {};
            columns.forEach(col => {
                row[col.header] = item[col.dataKey];
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${fileName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    exportToPDF(options: ExportOptions): void {
        const { fileName, title, columns, data } = options;
        const doc = new jsPDF() as any;

        if (title) {
            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
        }

        const headers = columns.map(col => col.header);
        const rows = data.map(item => columns.map(col => item[col.dataKey]));

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: title ? 35 : 15,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [243, 244, 246] }
        });

        doc.save(`${fileName}.pdf`);
    }
}
