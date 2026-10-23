/**
 * TaxFlow UK Document Engine - Enterprise PDF Canvas & Layout Engine
 * Generates ISO 32000-1 compliant vector PDFs using pdf-lib.
 * Precise sub-pixel font measurement, zero syntax errors, and high-trust British FinTech styling.
 */

import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  degrees,
  type RGB
} from 'pdf-lib';

export interface PageSize {
  width: number;
  height: number;
}

export const A4: PageSize = {
  width: 595.28,
  height: 841.89
};

export interface TextStyleOptions {
  font?: 'regular' | 'bold' | 'oblique' | 'mono' | 'monoBold';
  size?: number;
  color?: RGB;
  align?: 'left' | 'right' | 'center';
}

export interface BoxStyleOptions {
  fillColor?: RGB;
  borderColor?: RGB;
  borderWidth?: number;
}

export interface TableColumn {
  header: string;
  width: number;
  align: 'left' | 'right' | 'center';
}

export interface TableRow {
  cells: string[];
  isHeader?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  bold?: boolean;
  italic?: boolean;
  color?: RGB;
  bgFill?: RGB;
}

export class EnterprisePdfDocument {
  public pdfDoc!: PDFDocument;
  public fontRegular!: PDFFont;
  public fontBold!: PDFFont;
  public fontOblique!: PDFFont;
  public fontMono!: PDFFont;
  public fontMonoBold!: PDFFont;

  public currentPage!: PDFPage;
  public pages: PDFPage[] = [];
  public pageSize: PageSize = A4;
  private watermarkText?: string;

  public static async create(pageSize: PageSize = A4): Promise<EnterprisePdfDocument> {
    const doc = new EnterprisePdfDocument();
    doc.pageSize = pageSize;
    doc.pdfDoc = await PDFDocument.create();

    // Embed standard Type1 vector fonts
    doc.fontRegular = await doc.pdfDoc.embedFont(StandardFonts.Helvetica);
    doc.fontBold = await doc.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    doc.fontOblique = await doc.pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    doc.fontMono = await doc.pdfDoc.embedFont(StandardFonts.Courier);
    doc.fontMonoBold = await doc.pdfDoc.embedFont(StandardFonts.CourierBold);

    return doc;
  }

  public setWatermark(text: string): void {
    this.watermarkText = text;
  }

  public addPage(): PDFPage {
    this.currentPage = this.pdfDoc.addPage([this.pageSize.width, this.pageSize.height]);
    this.pages.push(this.currentPage);
    return this.currentPage;
  }

  public getFont(type?: 'regular' | 'bold' | 'oblique' | 'mono' | 'monoBold'): PDFFont {
    switch (type) {
      case 'bold':
        return this.fontBold;
      case 'oblique':
        return this.fontOblique;
      case 'mono':
        return this.fontMono;
      case 'monoBold':
        return this.fontMonoBold;
      default:
        return this.fontRegular;
    }
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    options?: TextStyleOptions
  ): void {
    if (!this.currentPage) this.addPage();

    const font = this.getFont(options?.font);
    const size = options?.size || 10;
    const color = options?.color || rgb(0.1, 0.1, 0.1);
    const align = options?.align || 'left';

    const textWidth = font.widthOfTextAtSize(text, size);
    let renderX = x;

    if (align === 'right') {
      renderX = x - textWidth;
    } else if (align === 'center') {
      renderX = x - textWidth / 2;
    }

    this.currentPage.drawText(text, {
      x: renderX,
      y,
      size,
      font,
      color
    });
  }

  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: BoxStyleOptions
  ): void {
    if (!this.currentPage) this.addPage();

    this.currentPage.drawRectangle({
      x,
      y,
      width,
      height,
      color: options?.fillColor,
      borderColor: options?.borderColor,
      borderWidth: options?.borderWidth || 0
    });
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: { color?: RGB; thickness?: number }
  ): void {
    if (!this.currentPage) this.addPage();

    this.currentPage.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      color: options?.color || rgb(0.8, 0.8, 0.8),
      thickness: options?.thickness || 1
    });
  }

  public drawTable(
    startX: number,
    startY: number,
    columns: TableColumn[],
    rows: TableRow[],
    options?: {
      rowHeight?: number;
      headerBg?: RGB;
      headerColor?: RGB;
      zebraColor?: RGB;
      borderColor?: RGB;
    }
  ): number {
    const rowHeight = options?.rowHeight || 20;
    const headerBg = options?.headerBg || rgb(0.95, 0.96, 0.98);
    const headerColor = options?.headerColor || rgb(0.12, 0.23, 0.36);
    const zebraColor = options?.zebraColor || rgb(0.98, 0.99, 1.0);
    const borderColor = options?.borderColor || rgb(0.88, 0.9, 0.93);

    const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);
    let currentY = startY;

    // 1. Draw Table Header
    this.drawRect(startX, currentY - rowHeight + 5, totalWidth, rowHeight, {
      fillColor: headerBg,
      borderColor,
      borderWidth: 0.5
    });

    let colX = startX;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const targetX = col.align === 'right' ? colX + col.width - 6 : col.align === 'center' ? colX + col.width / 2 : colX + 6;
      this.drawText(col.header, targetX, currentY - rowHeight + 11, {
        font: 'bold',
        size: 8.5,
        color: headerColor,
        align: col.align
      });
      colX += col.width;
    }

    currentY -= rowHeight;

    // 2. Draw Table Rows
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];

      // Zebra striping
      if (row.bgFill) {
        this.drawRect(startX, currentY - rowHeight + 5, totalWidth, rowHeight, {
          fillColor: row.bgFill
        });
      } else if (r % 2 === 1 && !row.isTotal) {
        this.drawRect(startX, currentY - rowHeight + 5, totalWidth, rowHeight, {
          fillColor: zebraColor
        });
      }

      // Top rule for totals
      if (row.isTotal || row.isSubtotal) {
        this.drawLine(startX, currentY + 5, startX + totalWidth, currentY + 5, {
          color: rgb(0.4, 0.4, 0.4),
          thickness: 0.75
        });
      }

      colX = startX;
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        const val = row.cells[c] || '';
        const targetX = col.align === 'right' ? colX + col.width - 6 : col.align === 'center' ? colX + col.width / 2 : colX + 6;

        this.drawText(val, targetX, currentY - rowHeight + 11, {
          font: row.bold || row.isTotal ? 'bold' : row.italic ? 'oblique' : 'regular',
          size: row.isTotal ? 9.5 : 8.5,
          color: row.color || (row.isTotal ? rgb(0.05, 0.1, 0.15) : rgb(0.2, 0.2, 0.2)),
          align: col.align
        });

        colX += col.width;
      }

      // Bottom double rule for total
      if (row.isTotal) {
        this.drawLine(startX, currentY - rowHeight + 5, startX + totalWidth, currentY - rowHeight + 5, {
          color: rgb(0.2, 0.2, 0.2),
          thickness: 1
        });
        this.drawLine(startX, currentY - rowHeight + 3, startX + totalWidth, currentY - rowHeight + 3, {
          color: rgb(0.2, 0.2, 0.2),
          thickness: 1
        });
      }

      currentY -= rowHeight;
    }

    return currentY;
  }

  public drawRunningHeader(title: string, subtitle?: string): void {
    if (!this.currentPage) return;
    const topY = this.pageSize.height - 35;

    // Header divider rule
    this.drawLine(45, topY - 10, this.pageSize.width - 45, topY - 10, {
      color: rgb(0.85, 0.88, 0.92),
      thickness: 0.75
    });

    this.drawText(title, 45, topY, {
      font: 'bold',
      size: 8.5,
      color: rgb(0.3, 0.35, 0.4)
    });

    if (subtitle) {
      this.drawText(subtitle, this.pageSize.width - 45, topY, {
        font: 'regular',
        size: 8,
        color: rgb(0.5, 0.55, 0.6),
        align: 'right'
      });
    }
  }

  public drawRunningFooter(pageIndex: number, totalPages: number, companyNumber?: string): void {
    if (!this.currentPage) return;
    const bottomY = 40;

    // Footer divider rule
    this.drawLine(45, bottomY + 12, this.pageSize.width - 45, bottomY + 12, {
      color: rgb(0.85, 0.88, 0.92),
      thickness: 0.75
    });

    const crnText = companyNumber ? `Company Registration No. ${companyNumber} (England and Wales)` : 'Statutory Return';
    this.drawText(crnText, 45, bottomY, {
      font: 'regular',
      size: 8,
      color: rgb(0.5, 0.55, 0.6)
    });

    this.drawText(`Page ${pageIndex} of ${totalPages}`, this.pageSize.width - 45, bottomY, {
      font: 'regular',
      size: 8,
      color: rgb(0.5, 0.55, 0.6),
      align: 'right'
    });
  }

  public applyWatermarkToAllPages(): void {
    if (!this.watermarkText) return;

    for (const page of this.pages) {
      const centerX = this.pageSize.width / 2;
      const centerY = this.pageSize.height / 2;
      const size = 34;
      const textWidth = this.fontBold.widthOfTextAtSize(this.watermarkText, size);

      page.drawText(this.watermarkText, {
        x: centerX - textWidth / 2.5,
        y: centerY - 40,
        size,
        font: this.fontBold,
        color: rgb(0.7, 0.73, 0.78),
        opacity: 0.12,
        rotate: degrees(45)
      });
    }
  }

  public async toBuffer(): Promise<Buffer> {
    this.applyWatermarkToAllPages();
    const pdfBytes = await this.pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
