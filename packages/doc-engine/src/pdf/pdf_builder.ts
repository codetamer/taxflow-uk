/**
 * TaxFlow UK Document Engine - Pure TypeScript PDF Document Builder
 * Generates ISO 32000-1 compliant vector PDF documents with zero external runtime dependencies.
 * Fast, deterministic, serverless-ready, and lightweight.
 */

export interface PageSize {
  width: number;
  height: number;
}

export const A4: PageSize = {
  width: 595.28,
  height: 841.89
};

interface PdfObject {
  id: number;
  content: string;
  stream?: string;
}

export class SimplePdfDocument {
  private objects: PdfObject[] = [];
  private pageObjectIds: number[] = [];
  private currentPageStream: string[] = [];
  private pageSize: PageSize;
  private watermarkText?: string;

  constructor(pageSize: PageSize = A4) {
    this.pageSize = pageSize;
  }

  public setWatermark(text: string): void {
    this.watermarkText = text;
  }

  public addPage(): void {
    this.finalizeCurrentPage();
  }

  private finalizeCurrentPage(): void {
    // If watermark enabled, draw it on the page
    if (this.watermarkText) {
      this.drawWatermark(this.watermarkText);
    }

    const streamContent = this.currentPageStream.join('\n');
    const streamObjId = this.objects.length + 1;
    this.objects.push({
      id: streamObjId,
      content: `<< /Length ${Buffer.byteLength(streamContent, 'utf-8')} >>\nstream\n${streamContent}\nendstream`
    });

    const pageObjId = this.objects.length + 1;
    this.objects.push({
      id: pageObjId,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageSize.width} ${this.pageSize.height}] /Contents ${streamObjId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> >>`
    });

    this.pageObjectIds.push(pageObjId);
    this.currentPageStream = [];
  }

  // Graphics and text commands
  public drawText(
    text: string,
    x: number,
    y: number,
    options?: {
      font?: 'Helvetica' | 'Helvetica-Bold' | 'Helvetica-Oblique';
      size?: number;
      color?: [number, number, number]; // [r, g, b] 0..1
      align?: 'left' | 'right' | 'center';
    }
  ): void {
    const fontCode =
      options?.font === 'Helvetica-Bold'
        ? '/F2'
        : options?.font === 'Helvetica-Oblique'
        ? '/F3'
        : '/F1';
    const size = options?.size || 10;
    const color = options?.color || [0.1, 0.1, 0.1];

    let renderX = x;
    const cleanText = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    // Estimate text width for alignment (average character width ~ 0.5 * size)
    const estimatedWidth = cleanText.length * (size * 0.52);
    if (options?.align === 'right') {
      renderX = x - estimatedWidth;
    } else if (options?.align === 'center') {
      renderX = x - estimatedWidth / 2;
    }

    this.currentPageStream.push('BT');
    this.currentPageStream.push(`${fontCode} ${size} Tf`);
    this.currentPageStream.push(`${color[0]} ${color[1]} ${color[2]} rg`);
    this.currentPageStream.push(`1 0 0 1 ${renderX.toFixed(2)} ${y.toFixed(2)} Tm`);
    this.currentPageStream.push(`(${cleanText}) Tj`);
    this.currentPageStream.push('ET');
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: { lineWidth?: number; color?: [number, number, number] }
  ): void {
    const width = options?.lineWidth || 0.75;
    const color = options?.color || [0.7, 0.7, 0.7];

    this.currentPageStream.push('q');
    this.currentPageStream.push(`${color[0]} ${color[1]} ${color[2]} RG`);
    this.currentPageStream.push(`${width} w`);
    this.currentPageStream.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`);
    this.currentPageStream.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`);
    this.currentPageStream.push('S');
    this.currentPageStream.push('Q');
  }

  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      fillColor?: [number, number, number];
      strokeColor?: [number, number, number];
      lineWidth?: number;
    }
  ): void {
    this.currentPageStream.push('q');
    if (options?.fillColor) {
      this.currentPageStream.push(
        `${options.fillColor[0]} ${options.fillColor[1]} ${options.fillColor[2]} rg`
      );
    }
    if (options?.strokeColor) {
      this.currentPageStream.push(
        `${options.strokeColor[0]} ${options.strokeColor[1]} ${options.strokeColor[2]} RG`
      );
      this.currentPageStream.push(`${options.lineWidth || 1} w`);
    }

    this.currentPageStream.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);

    if (options?.fillColor && options?.strokeColor) {
      this.currentPageStream.push('B');
    } else if (options?.fillColor) {
      this.currentPageStream.push('f');
    } else if (options?.strokeColor) {
      this.currentPageStream.push('S');
    }
    this.currentPageStream.push('Q');
  }

  private drawWatermark(text: string): void {
    this.currentPageStream.push('q');
    this.currentPageStream.push('0.85 0.85 0.85 rg'); // Very light grey
    this.currentPageStream.push('/F2 32 Tf');
    // Rotate 45 degrees: cos(45) ~ 0.7071, sin(45) ~ 0.7071
    // Tm: [a b c d e f] -> [0.7071 0.7071 -0.7071 0.7071 x y]
    const centerX = this.pageSize.width / 2 - 180;
    const centerY = this.pageSize.height / 2 - 50;
    this.currentPageStream.push('BT');
    this.currentPageStream.push(`0.7071 0.7071 -0.7071 0.7071 ${centerX.toFixed(2)} ${centerY.toFixed(2)} Tm`);
    this.currentPageStream.push(`(${text}) Tj`);
    this.currentPageStream.push('ET');
    this.currentPageStream.push('Q');
  }

  public build(): Buffer {
    if (this.currentPageStream.length > 0) {
      this.finalizeCurrentPage();
    }

    const header = '%PDF-1.4\n%âãÏÓ\n';
    let output = header;
    const offsets: number[] = [];

    // Obj 1: Catalog
    // Obj 2: Pages Root
    // Obj 3: Font Helvetica
    // Obj 4: Font Helvetica-Bold
    // Obj 5: Font Helvetica-Oblique
    const rootPagesId = 2;
    const catalogId = 1;

    const baseObjects: { id: number; content: string }[] = [
      { id: catalogId, content: `<< /Type /Catalog /Pages ${rootPagesId} 0 R >>` },
      {
        id: rootPagesId,
        content: `<< /Type /Pages /Kids [${this.pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${this.pageObjectIds.length} >>`
      },
      { id: 3, content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
      { id: 4, content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>' },
      { id: 5, content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>' }
    ];

    // Renumber dynamic objects to start after base objects (6 onwards)
    const allObjects: { id: number; content: string }[] = [...baseObjects];
    const offsetMap = new Map<number, number>();
    let nextId = 6;

    for (const obj of this.objects) {
      offsetMap.set(obj.id, nextId);
      nextId++;
    }

    // Replace old IDs in page objects
    for (const obj of this.objects) {
      let content = obj.content;
      for (const [oldId, newId] of offsetMap.entries()) {
        const regex = new RegExp(`\\b${oldId} 0 R\\b`, 'g');
        content = content.replace(regex, `${newId} 0 R`);
      }
      allObjects.push({ id: offsetMap.get(obj.id)!, content });
    }

    // Update Kids in Pages object
    const pagesObj = allObjects[1];
    if (pagesObj) {
      pagesObj.content = `<< /Type /Pages /Kids [${this.pageObjectIds
        .map((oldId) => `${offsetMap.get(oldId)} 0 R`)
        .join(' ')}] /Count ${this.pageObjectIds.length} >>`;
    }

    // Sort objects by ID
    allObjects.sort((a, b) => a.id - b.id);

    // Build xref table
    const xrefOffsets: number[] = [];
    xrefOffsets.push(0); // 0th entry

    for (const obj of allObjects) {
      xrefOffsets[obj.id] = Buffer.byteLength(output, 'utf-8');
      output += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    }

    const xrefStart = Buffer.byteLength(output, 'utf-8');
    output += `xref\n0 ${allObjects.length + 1}\n`;
    output += '0000000000 65535 f \n';
    for (let i = 1; i <= allObjects.length; i++) {
      const offset = xrefOffsets[i] || 0;
      output += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    output += `trailer\n<< /Size ${allObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return Buffer.from(output, 'utf-8');
  }
}

