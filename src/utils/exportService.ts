import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatters } from './formatters';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns?: string[];
  filters?: Record<string, any>;
  metadata?: Record<string, any>;
  format: 'pdf' | 'excel';
  chartImage?: string; // Base64 encoded chart image
}

export class ExportService {
  // Export to PDF
  static async exportToPDF(options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    
    // Add TBWA branding
    this.addPDFHeader(doc, options);
    
    // Add filters summary if provided
    let yPosition = 60;
    if (options.filters && Object.keys(options.filters).length > 0) {
      yPosition = this.addFiltersSection(doc, options.filters, yPosition);
    }
    
    // Add chart image if provided
    if (options.chartImage) {
      doc.addImage(options.chartImage, 'PNG', 15, yPosition, 180, 100);
      yPosition += 110;
    }
    
    // Add data table
    if (options.data && options.data.length > 0) {
      this.addDataTable(doc, options.data, options.columns, yPosition);
    }
    
    // Add footer
    this.addPDFFooter(doc);
    
    // Save the PDF
    const filename = `${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }
  
  // Export to Excel
  static async exportToExcel(options: ExportOptions): Promise<void> {
    const wb = XLSX.utils.book_new();
    
    // Create main data sheet
    const ws = XLSX.utils.json_to_sheet(options.data);
    
    // Add filters sheet if provided
    if (options.filters && Object.keys(options.filters).length > 0) {
      const filtersData = Object.entries(options.filters).map(([key, value]) => ({
        Filter: key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1),
        Value: value || 'All'
      }));
      const filtersWs = XLSX.utils.json_to_sheet(filtersData);
      XLSX.utils.book_append_sheet(wb, filtersWs, 'Applied Filters');
    }
    
    // Add metadata sheet if provided
    if (options.metadata) {
      const metadataData = Object.entries(options.metadata).map(([key, value]) => ({
        Property: key,
        Value: value
      }));
      const metadataWs = XLSX.utils.json_to_sheet(metadataData);
      XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata');
    }
    
    // Append main data sheet
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Apply styling
    this.styleExcelSheet(ws);
    
    // Save the file
    const filename = `${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
  
  // Helper: Add PDF header with TBWA branding
  private static addPDFHeader(doc: jsPDF, options: ExportOptions): void {
    // TBWA logo placeholder (in production, use actual logo)
    doc.setFillColor(123, 58, 237); // Primary color
    doc.rect(15, 10, 30, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('SCOUT', 20, 17);
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.text(options.title, 15, 35);
    
    // Subtitle
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(options.subtitle, 15, 45);
    }
    
    // Export date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
  }
  
  // Helper: Add filters section
  private static addFiltersSection(doc: jsPDF, filters: Record<string, any>, startY: number): number {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Applied Filters:', 15, startY);
    
    let y = startY + 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const label = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1);
        doc.text(`${label}: ${value}`, 20, y);
        y += 6;
      }
    });
    
    return y + 10;
  }
  
  // Helper: Add data table
  private static addDataTable(doc: jsPDF, data: any[], columns?: string[], startY: number): void {
    if (!data || data.length === 0) return;
    
    // Auto-detect columns if not provided
    const tableColumns = columns || Object.keys(data[0]);
    
    // Format headers
    const headers = tableColumns.map(col => 
      col.replace(/_/g, ' ').charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')
    );
    
    // Format data
    const tableData = data.map(row => 
      tableColumns.map(col => {
        const value = row[col];
        if (typeof value === 'number') {
          // Format numbers based on column name
          if (col.includes('revenue') || col.includes('amount')) {
            return formatters.currency(value);
          } else if (col.includes('percent') || col.includes('rate')) {
            return formatters.percentage(value);
          } else {
            return formatters.number(value);
          }
        }
        return value || '-';
      })
    );
    
    // Add table with autoTable plugin
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: [123, 58, 237], // Primary color
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      margin: { left: 15, right: 15 }
    });
  }
  
  // Helper: Add PDF footer
  private static addPDFFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 280, 195, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Scout Analytics by TBWA\\Philippines', 15, 287);
      doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
    }
  }
  
  // Helper: Style Excel sheet
  private static styleExcelSheet(ws: XLSX.WorkSheet): void {
    // Get range
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[headerCell]) continue;
      
      ws[headerCell].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '7B3AED' } }, // Primary color
        alignment: { horizontal: 'center' }
      };
    }
    
    // Auto-fit columns
    const colWidths: any[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10;
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cell] && ws[cell].v) {
          const width = ws[cell].v.toString().length;
          if (width > maxWidth) maxWidth = width;
        }
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    ws['!cols'] = colWidths;
  }
  
  // Export chart as image
  static async chartToImage(chartElement: HTMLElement): Promise<string> {
    // This would use html2canvas in a real implementation
    // For now, return a placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
  
  // Batch export multiple datasets
  static async batchExport(datasets: ExportOptions[]): Promise<void> {
    for (const dataset of datasets) {
      if (dataset.format === 'pdf') {
        await this.exportToPDF(dataset);
      } else {
        await this.exportToExcel(dataset);
      }
      // Add small delay between exports
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}