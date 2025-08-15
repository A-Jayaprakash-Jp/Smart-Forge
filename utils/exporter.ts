import { ProductionLog, DowntimeEvent, IncidentLog, AiReport } from '../types';
import saveAs from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel } from 'docx';


type HistoryItem = (ProductionLog & {type: 'log', date: Date}) | (DowntimeEvent & {type: 'downtime', date: Date}) | (IncidentLog & {type: 'incident', date: Date});

const getHistoryAsArray = (data: HistoryItem[]): (string[])[] => {
    return data.map(item => {
        if (item.type === 'log') {
            const details = `Good: ${item.goodMoulds}, Rejected: ${item.rejectedMoulds}. Cycle Time: ${item.actualCycleTime?.toFixed(1) || 'N/A'}s. Energy: ${item.energyConsumedKwh?.toFixed(2) || 'N/A'}kWh. Reasons: ${item.rejectionReason?.join('; ') || 'N/A'}`;
            return ['Production Log', item.timestamp.toLocaleString(), item.machineId, String(item.userId), details, item.batchNumber || 'N/A'];
        } else if (item.type === 'downtime') {
            const durationMs = item.end ? item.end.getTime() - item.start.getTime() : 0;
            const durationMinutes = Math.round(durationMs / 60000);
            const details = `Reason: ${item.reason}, Duration: ${durationMinutes} mins. Notes: ${item.notes || 'N/A'}`;
            return ['Downtime', item.start.toLocaleString(), item.machineId, String(item.userId), details, `DT-${item.id.slice(0, 6)}`];
        } else { // Incident
            const details = `Severity: ${item.severity}. Description: ${item.description}. Resolution: ${item.resolution || 'Pending'}`;
            return ['Incident', item.timestamp.toLocaleString(), item.machineId, String(item.reportedByUserId), details, `INC-${item.id.slice(0, 6)}`];
        }
    });
};

const HEADERS = ['Type', 'Timestamp', 'Machine ID', 'User ID', 'Details', 'Reference/ID'];

// --- CSV Exporter ---
export const exportHistoryToCSV = (data: HistoryItem[], filename: string) => {
    const rows = getHistoryAsArray(data).map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );
    const csvString = [HEADERS.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};

// --- Excel (XLSX) Exporter ---
export const exportHistoryToExcel = (data: HistoryItem[], filename: string) => {
    const rows = getHistoryAsArray(data);
    const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Work History');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${filename}.xlsx`);
};

// --- PDF Exporter ---
export const exportHistoryToPDF = (data: HistoryItem[], filename: string) => {
    const doc = new jsPDF();
    doc.text("DISA Work History Report", 14, 15);
    autoTable(doc, {
        head: [HEADERS],
        body: getHistoryAsArray(data),
        startY: 20,
    });
    doc.save(`${filename}.pdf`);
};

// --- Word (DOCX) Exporter ---
export const exportHistoryToWord = (data: HistoryItem[], filename: string) => {
    const headerRow = new TableRow({
        children: HEADERS.map(header => new TableCell({
            width: { size: 16.6, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
        })),
    });

    const dataRows = getHistoryAsArray(data).map(row => new TableRow({
        children: row.map(cell => new TableCell({
            children: [new Paragraph(String(cell))],
        })),
    }));

    const table = new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ children: [new TextRun({ text: "DISA Work History Report", bold: true, size: 28 })] }),
                new Paragraph(" "),
                table,
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${filename}.docx`);
    });
};

// --- Text (TXT) Exporter ---
export const exportHistoryToText = (data: HistoryItem[], filename: string) => {
    let textContent = "DISA Work History Report\n=========================\n\n";
    const rows = getHistoryAsArray(data);
    rows.forEach(row => {
        textContent += `${HEADERS[0]}:      ${row[0]}\n`;
        textContent += `${HEADERS[1]}: ${row[1]}\n`;
        textContent += `${HEADERS[2]}:   ${row[2]}\n`;
        textContent += `${HEADERS[3]}:   ${row[3]}\n`;
        textContent += `${HEADERS[4]}:   ${row[4]}\n`;
        textContent += `${HEADERS[5]}: ${row[5]}\n`;
        textContent += "----------------------------------------\n";
    });
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${filename}.txt`);
};

// --- AI Report Exporters ---

export const exportAiReportToText = (report: AiReport, filename: string) => {
    let content = `AI-Generated Performance Report\n`;
    content += `==============================\n\n`;

    content += `EXECUTIVE SUMMARY\n-----------------\n${report.executiveSummary}\n\n`;

    content += `KEY INSIGHTS\n------------\n`;
    report.keyInsights.forEach(insight => {
        content += `- [${insight.impact}] ${insight.point}\n`;
    });
    content += `\n`;

    content += `RECOMMENDATIONS\n---------------\n`;
    report.recommendations.forEach(rec => {
        content += `- [${rec.priority}] ${rec.action}\n  (Justification: ${rec.justification})\n`;
    });
    content += `\n`;

    content += `DATA DEEP DIVE\n--------------\n${report.dataDeepDive}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${filename}.txt`);
};


// Helper: Render a table for PDF
function renderTablePDF(doc: any, y: number, headers: string[], rows: any[][]): number {
    const margin = 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    let x = margin;
    headers.forEach((h: string) => {
        doc.text(String(h), x, y);
        x += 30;
    });
    y += 7;
    doc.setFont(undefined, 'normal');
    rows.forEach((row: any[]) => {
        x = margin;
        row.forEach((cell: any) => {
            doc.text(String(cell), x, y);
            x += 30;
        });
        y += 7;
    });
    return y;
}

export const exportAiReportToPDF = (report: any, filename: string) => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("AI-Generated Report", 15, y);
    y += 10;

    // Detect report type and render accordingly
    if (report.preamble && report.shifts) { // DMM Parameter
        doc.setFontSize(14);
        doc.text("DMM SETTING PARAMETERS CHECK SHEET", 15, y); y += 8;
        Object.entries(report.preamble).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 15, y); y += 6; });
        ["shift1", "shift2", "shift3"].forEach(shift => {
            doc.setFontSize(12); doc.text(shift.toUpperCase(), 15, y); y += 6;
            if (report.shifts[shift] && report.shifts[shift].length) {
                y = renderTablePDF(doc, y, Object.keys(report.shifts[shift][0]), report.shifts[shift].map(Object.values));
            } else { doc.text("No data", 15, y); y += 6; }
        });
    } else if (report.preamble && report.summary && report.rows) { // Daily Production
        doc.setFontSize(14);
        doc.text("DAILY PRODUCTION PERFORMANCE", 15, y); y += 8;
        Object.entries(report.preamble).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 15, y); y += 6; });
        y = renderTablePDF(doc, y, Object.keys(report.rows[0]), report.rows.map(Object.values));
        doc.text(`Unplanned Reasons: ${report.unplannedReasons}`, 15, y); y += 6;
        Object.entries(report.footer).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 15, y); y += 6; });
    } else if (report.rows && Array.isArray(report.rows) && report.rows[0]?.sNo !== undefined) { // NCR
        doc.setFontSize(14);
        doc.text("Non-Conformance Report", 15, y); y += 8;
        y = renderTablePDF(doc, y, Object.keys(report.rows[0]), report.rows.map(Object.values));
    } else if (report.rows && Array.isArray(report.rows) && report.rows[0]?.date !== undefined && report.rows[0]?.counterNumber !== undefined) { // Setting Adjustment
        doc.setFontSize(14);
        doc.text("DISA SETTING ADJUSTMENT RECORD", 15, y); y += 8;
        y = renderTablePDF(doc, y, Object.keys(report.rows[0]), report.rows.map(Object.values));
    } else if (report.preamble && report.rows && report.rows[0]?.days) { // Checklist or Daily Monitoring
        doc.setFontSize(14);
        if (report.preamble.machine) doc.text(`DISA MACHINE OPERATOR CHECK SHEET - ${report.preamble.machine}`, 15, y);
        else doc.text("EOHS - DAILY PERFORMANCE MONITORING REPORT", 15, y);
        y += 8;
        Object.entries(report.preamble).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 15, y); y += 6; });
        // Table: parameter/checkPoint + days (ensure 31 days columns)
        const headers = [report.rows[0].monitoringParameter ? "Parameter" : "CheckPoint", ...Array.from({length: 31}, (_, i) => (i+1).toString())];
    const rows = report.rows.map((row: { monitoringParameter?: string; checkPoint?: string; days: { [day: string]: string } }) => [row.monitoringParameter || row.checkPoint, ...Array.from({length: 31}, (_, i) => row.days[String(i+1)] ?? '')]);
        y = renderTablePDF(doc, y, headers, rows);
    } else if (report.preamble && report.rows && report.rows[0]?.errorProofName) { // ROR Verification
        doc.setFontSize(14);
        doc.text("ROR PROOF VERIFICATION CHECK LIST", 15, y); y += 8;
        Object.entries(report.preamble).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 15, y); y += 6; });
        y = renderTablePDF(doc, y, Object.keys(report.rows[0]), report.rows.map(Object.values));
    } else if (report.preamble && report.summary && report.keyMetrics) { // Executive Summary
        doc.setFontSize(14);
        doc.text("Executive Summary Report", 15, y); y += 8;
        Object.entries(report.preamble).forEach(([k, v]) => { doc.text(`${k}: ${v}`, 15, y); y += 6; });
        doc.text("Summary:", 15, y); y += 6; doc.text(report.summary, 15, y); y += 8;
        doc.text("Key Metrics:", 15, y); y += 6;
    report.keyMetrics.forEach((m: { metric: string; value: string; change: string }) => { doc.text(`${m.metric}: ${m.value} (${m.change})`, 15, y); y += 6; });
    doc.text("Insights:", 15, y); y += 6;
    report.insights.forEach((i: string) => { doc.text(`- ${i}`, 15, y); y += 5; });
    doc.text("Recommendations:", 15, y); y += 6;
    report.recommendations.forEach((r: string) => { doc.text(`- ${r}`, 15, y); y += 5; });
    } else if (report.executiveSummary && report.keyInsights && report.recommendations && report.dataDeepDive) { // Generic
        doc.setFontSize(14);
        doc.text("Executive Summary", 15, y); y += 8;
        doc.text(report.executiveSummary, 15, y); y += 8;
        doc.text("Key Insights:", 15, y); y += 6;
    report.keyInsights.forEach((i: { point: string }) => { doc.text(`- ${i.point}`, 15, y); y += 5; });
    doc.text("Recommendations:", 15, y); y += 6;
    report.recommendations.forEach((r: { action: string }) => { doc.text(`- ${r.action}`, 15, y); y += 5; });
        doc.text("Data Deep Dive:", 15, y); y += 6;
        doc.text(report.dataDeepDive, 15, y); y += 8;
    } else {
        doc.text("Unsupported report type", 15, y);
    }
    doc.save(`${filename}.pdf`);
};


// Helper: Render a table for Word
function renderTableWord(headers: string[], rows: any[][]): Table {
    return new Table({
        rows: [
            new TableRow({ children: headers.map((h: string) => new TableCell({ children: [new Paragraph(String(h))] })) }),
            ...rows.map((row: any[]) => new TableRow({ children: row.map((cell: any) => new TableCell({ children: [new Paragraph(String(cell))] })) }))
        ]
    });
}


export const exportAiReportToWord = (report: any, filename: string) => {
    let children: (Paragraph | Table)[] = [new Paragraph({ text: "AI-Generated Report", heading: HeadingLevel.TITLE })];
    // Detect report type and render accordingly
    if (report.preamble && report.shifts) { // DMM Parameter
        children.push(new Paragraph({ text: "DMM SETTING PARAMETERS CHECK SHEET", heading: HeadingLevel.HEADING_1 }));
        Object.entries(report.preamble).forEach(([k, v]) => children.push(new Paragraph(`${k}: ${v}`)));
        ["shift1", "shift2", "shift3"].forEach(shift => {
            children.push(new Paragraph({ text: shift.toUpperCase(), heading: HeadingLevel.HEADING_2 }));
            if (report.shifts[shift] && report.shifts[shift].length) {
                children.push(renderTableWord(Object.keys(report.shifts[shift][0]), report.shifts[shift].map(Object.values)));
            } else {
                children.push(new Paragraph("No data"));
            }
        });
    } else if (report.preamble && report.summary && report.rows) { // Daily Production
        children.push(new Paragraph({ text: "DAILY PRODUCTION PERFORMANCE", heading: HeadingLevel.HEADING_1 }));
        Object.entries(report.preamble).forEach(([k, v]) => children.push(new Paragraph(`${k}: ${v}`)));
        children.push(renderTableWord(Object.keys(report.rows[0]), report.rows.map(Object.values)));
        children.push(new Paragraph(`Unplanned Reasons: ${report.unplannedReasons}`));
        Object.entries(report.footer).forEach(([k, v]) => children.push(new Paragraph(`${k}: ${v}`)));
    } else if (report.rows && Array.isArray(report.rows) && report.rows[0]?.sNo !== undefined) { // NCR
        children.push(new Paragraph({ text: "Non-Conformance Report", heading: HeadingLevel.HEADING_1 }));
        children.push(renderTableWord(Object.keys(report.rows[0]), report.rows.map(Object.values)));
    } else if (report.rows && Array.isArray(report.rows) && report.rows[0]?.date !== undefined && report.rows[0]?.counterNumber !== undefined) { // Setting Adjustment
        children.push(new Paragraph({ text: "DISA SETTING ADJUSTMENT RECORD", heading: HeadingLevel.HEADING_1 }));
        children.push(renderTableWord(Object.keys(report.rows[0]), report.rows.map(Object.values)));
    } else if (report.preamble && report.rows && report.rows[0]?.days) { // Checklist or Daily Monitoring
        if (report.preamble.machine) children.push(new Paragraph({ text: `DISA MACHINE OPERATOR CHECK SHEET - ${report.preamble.machine}`, heading: HeadingLevel.HEADING_1 }));
        else children.push(new Paragraph({ text: "EOHS - DAILY PERFORMANCE MONITORING REPORT", heading: HeadingLevel.HEADING_1 }));
        Object.entries(report.preamble).forEach(([k, v]) => children.push(new Paragraph(`${k}: ${v}`)));
        // Table: parameter/checkPoint + days (ensure 31 days columns)
        const headers = [report.rows[0].monitoringParameter ? "Parameter" : "CheckPoint", ...Array.from({length: 31}, (_, i) => (i+1).toString())];
        const rows = report.rows.map((row: any) => [row.monitoringParameter || row.checkPoint, ...Array.from({length: 31}, (_, i) => row.days[(i+1).toString()] ?? '')]);
        children.push(renderTableWord(headers, rows));
    } else if (report.preamble && report.rows && report.rows[0]?.errorProofName) { // ROR Verification
        children.push(new Paragraph({ text: "ROR PROOF VERIFICATION CHECK LIST", heading: HeadingLevel.HEADING_1 }));
        Object.entries(report.preamble).forEach(([k, v]) => children.push(new Paragraph(`${k}: ${v}`)));
        children.push(renderTableWord(Object.keys(report.rows[0]), report.rows.map(Object.values)));
    } else if (report.preamble && report.summary && report.keyMetrics) { // Executive Summary
        children.push(new Paragraph({ text: "Executive Summary Report", heading: HeadingLevel.HEADING_1 }));
        Object.entries(report.preamble).forEach(([k, v]) => children.push(new Paragraph(`${k}: ${v}`)));
        children.push(new Paragraph("Summary:"));
        children.push(new Paragraph(report.summary));
        children.push(new Paragraph("Key Metrics:"));
        report.keyMetrics.forEach((m: any) => children.push(new Paragraph(`${m.metric}: ${m.value} (${m.change})`)));
        children.push(new Paragraph("Insights:"));
        report.insights.forEach((i: any) => children.push(new Paragraph(`- ${i}`)));
        children.push(new Paragraph("Recommendations:"));
        report.recommendations.forEach((r: any) => children.push(new Paragraph(`- ${r}`)));
    } else if (report.executiveSummary && report.keyInsights && report.recommendations && report.dataDeepDive) { // Generic
        children.push(new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1 }));
        children.push(new Paragraph(report.executiveSummary));
        children.push(new Paragraph("Key Insights:"));
        report.keyInsights.forEach((i: any) => children.push(new Paragraph(`- ${i.point}`)));
        children.push(new Paragraph("Recommendations:"));
        report.recommendations.forEach((r: any) => children.push(new Paragraph(`- ${r.action}`)));
        children.push(new Paragraph("Data Deep Dive:"));
        children.push(new Paragraph(report.dataDeepDive));
    } else {
        children.push(new Paragraph("Unsupported report type"));
    }
    const doc = new Document({ sections: [{ children }] });
    Packer.toBlob(doc).then(blob => { saveAs(blob, `${filename}.docx`); });
};


// --- Generic Chart Data Exporter ---
export const exportChartDataToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => {
            const cell = row[header];
            const cellString = String(cell === null || cell === undefined ? '' : cell);
            return `"${cellString.replace(/"/g, '""')}"`;
        }).join(',')
    );
    const csvString = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};