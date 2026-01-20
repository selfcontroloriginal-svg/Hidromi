import jsPDF from 'jspdf';

interface QuotationData {
  id: string;
  client: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total_value: number;
  valid_until: string;
  notes: string;
  company: {
    name: string;
    cnpj: string;
    phone: string;
    address: string;
  };
}

export async function generateQuotationPDF(quotationData: QuotationData): Promise<Blob> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors - BLUE THEME
  const primaryColor = [14, 165, 233]; // blue-500
  const lightBlue = [239, 246, 255]; // blue-50
  const darkText = [30, 41, 59]; // slate-800
  const grayText = [100, 116, 139]; // slate-500
  
  let yPosition = 20;
  
  // Header with gradient effect - COMPACT HEIGHT
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 70, 'F');
  
  // Try to load and add the HidroMineral logo - MUCH SMALLER SIZE
  try {
    const logoPath = '/Imagem do WhatsApp de 2025-06-07 à(s) 14.47.51_4a694503 (1).png';
    
    // Create a promise to load the image
    const loadImage = (): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load logo'));
        img.src = logoPath;
      });
    };

    try {
      const logoImg = await loadImage();
      
      // Convert image to canvas and then to base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Calculate proper proportions to avoid stretching
        const originalWidth = logoImg.width;
        const originalHeight = logoImg.height;
        const aspectRatio = originalWidth / originalHeight;
        
        // MUCH SMALLER LOGO SIZE - reduced from 30 to 20
        const logoHeight = 20; // Much smaller size
        const logoWidth = logoHeight * aspectRatio;
        
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        ctx.drawImage(logoImg, 0, 0);
        
        const logoDataUrl = canvas.toDataURL('image/png');
        
        // Add logo to PDF - LEFT POSITIONED with proper spacing
        pdf.addImage(logoDataUrl, 'PNG', 15, 25, logoWidth, logoHeight);
      } else {
        throw new Error('Canvas context not available');
      }
    } catch (logoError) {
      console.warn('Could not load HidroMineral logo, using placeholder:', logoError);
      
      // Fallback: Create a styled placeholder for HidroMineral - MUCH SMALLER
      const logoWidth = 40; // Reduced from 60
      const logoHeight = 20; // Reduced from 30
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, 25, logoWidth, logoHeight, 'F');
      pdf.setDrawColor(14, 165, 233); // Blue border
      pdf.setLineWidth(1);
      pdf.rect(15, 25, logoWidth, logoHeight);
      
      // HidroMineral text placeholder
      pdf.setTextColor(14, 165, 233); // Blue text
      pdf.setFontSize(8); // Smaller font
      pdf.setFont('helvetica', 'bold');
      pdf.text('HidroMineral', 15 + logoWidth/2, 32, { align: 'center' });
      pdf.setFontSize(6); // Much smaller font
      pdf.text('Mineralizador', 15 + logoWidth/2, 40, { align: 'center' });
    }
  } catch (error) {
    console.warn('Error handling logo:', error);
    
    // Final fallback with proper proportions - MUCH SMALLER
    const logoWidth = 40; // Reduced from 60
    const logoHeight = 20; // Reduced from 30
    
    pdf.setFillColor(255, 255, 255);
    pdf.rect(15, 25, logoWidth, logoHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(15, 25, logoWidth, logoHeight);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(7); // Smaller font
    pdf.setFont('helvetica', 'bold');
    pdf.text('LOGO', 15 + logoWidth/2, 37, { align: 'center' });
  }
  
  // QUOTATION TITLE - POSITIONED WHERE COMPANY INFO STARTS
  const quotationStartX = 105; // Same position as company info
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ORÇAMENTO', quotationStartX, 25);
  
  // COMPANY INFORMATION - POSITIONED IN THE MIDDLE
  const companyStartX = 105; // Same X as quotation title for alignment
  
  // Company details - COMPACT AND IN THE MIDDLE
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CNPJ: 24.395.398/0001-70', companyStartX, 37);
  pdf.text('Tel: (66) 2102-5000', companyStartX, 45);
  
  // Address in two lines for better space usage
  pdf.text('Rua dos Cajueiros, 1366', companyStartX, 53);
  pdf.text('Setor Residencial Norte - Sinop-MT', companyStartX, 61);
  
  // QUOTATION DETAILS - TOTALLY IN THE RIGHT CORNER
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  // Using pageWidth - 15 to position at the very right edge with small margin
  pdf.text(`Nº ${quotationData.id.substring(0, 8)}`, pageWidth - 15, 30, { align: 'right' });
  pdf.text(`Emitido: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 15, 38, { align: 'right' });
  pdf.text(`Válido até: ${new Date(quotationData.valid_until).toLocaleDateString('pt-BR')}`, pageWidth - 15, 46, { align: 'right' });
  
  yPosition = 85; // Adjusted for compact header
  
  // Client information section
  pdf.setFillColor(...lightBlue);
  pdf.rect(15, yPosition, pageWidth - 30, 35, 'F');
  
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.rect(15, yPosition, pageWidth - 30, 35);
  
  pdf.setTextColor(...darkText);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DO CLIENTE', 20, yPosition + 10);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${quotationData.client.name}`, 20, yPosition + 22);
  
  // Client details
  let clientDetailsY = yPosition + 29;
  if (quotationData.client.email) {
    pdf.setFontSize(10);
    pdf.setTextColor(...grayText);
    pdf.text(`Email: ${quotationData.client.email}`, 20, clientDetailsY);
  }
  
  if (quotationData.client.phone) {
    pdf.setFontSize(10);
    pdf.setTextColor(...grayText);
    pdf.text(`Telefone: ${quotationData.client.phone}`, pageWidth / 2, clientDetailsY);
  }
  
  yPosition += 55;
  
  // Items section title
  pdf.setTextColor(...darkText);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITENS DO ORÇAMENTO', 20, yPosition);
  
  yPosition += 15;
  
  // Table header
  pdf.setFillColor(...primaryColor);
  pdf.rect(15, yPosition, pageWidth - 30, 15, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIÇÃO', 20, yPosition + 10);
  pdf.text('QTD', pageWidth - 130, yPosition + 10, { align: 'center' });
  pdf.text('VALOR UNIT.', pageWidth - 90, yPosition + 10, { align: 'center' });
  pdf.text('TOTAL', pageWidth - 30, yPosition + 10, { align: 'right' });
  
  yPosition += 15;
  
  // Items
  pdf.setTextColor(...darkText);
  pdf.setFont('helvetica', 'normal');
  
  quotationData.items.forEach((item, index) => {
    const rowHeight = 12;
    
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(15, yPosition, pageWidth - 30, rowHeight, 'F');
    }
    
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.1);
    pdf.line(15, yPosition + rowHeight, pageWidth - 15, yPosition + rowHeight);
    
    pdf.setFontSize(10);
    pdf.text(item.name, 20, yPosition + 8);
    pdf.text(item.quantity.toString(), pageWidth - 130, yPosition + 8, { align: 'center' });
    pdf.text(`R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 90, yPosition + 8, { align: 'center' });
    pdf.text(`R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 30, yPosition + 8, { align: 'right' });
    
    yPosition += rowHeight;
  });
  
  // Total section
  yPosition += 10;
  
  pdf.setFillColor(241, 245, 249);
  pdf.rect(pageWidth - 120, yPosition, 105, 20, 'F');
  
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(1);
  pdf.rect(pageWidth - 120, yPosition, 105, 20);
  
  pdf.setTextColor(...darkText);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VALOR TOTAL', pageWidth - 115, yPosition + 8);
  
  pdf.setFontSize(16);
  pdf.setTextColor(...primaryColor);
  pdf.text(`R$ ${quotationData.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, yPosition + 15, { align: 'right' });
  
  yPosition += 40;
  
  // Notes section
  if (quotationData.notes && quotationData.notes.trim()) {
    pdf.setTextColor(...darkText);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES', 20, yPosition);
    
    yPosition += 10;
    
    const notesHeight = Math.max(25, Math.ceil(quotationData.notes.length / 80) * 5 + 10);
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPosition, pageWidth - 30, notesHeight, 'F');
    
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPosition, pageWidth - 30, notesHeight);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...grayText);
    
    const noteLines = pdf.splitTextToSize(quotationData.notes, pageWidth - 40);
    let noteY = yPosition + 8;
    noteLines.forEach((line: string) => {
      pdf.text(line, 20, noteY);
      noteY += 5;
    });
    
    yPosition += notesHeight + 15;
  }
  
  // SIGNATURE SECTION - CLEAN AND WELL POSITIONED
  const signatureY = pageHeight - 50;
  
  // Client signature section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASSINATURA DO CLIENTE', 20, signatureY);
  
  // Client signature line
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.5);
  pdf.line(20, signatureY + 15, 120, signatureY + 15);
  
  // Company signature section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASSINATURA DA EMPRESA', pageWidth - 120, signatureY);
  
  // Company signature line
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth - 120, signatureY + 15, pageWidth - 20, signatureY + 15);
  
  // Footer message
  const footerY = pageHeight - 25;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...primaryColor);
  pdf.text('Obrigado pela confiança!', pageWidth / 2, footerY, { align: 'center' });
  
  // Terms and conditions
  const termsY = footerY + 8;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...grayText);
  pdf.text('Este orçamento tem validade conforme data especificada acima.', pageWidth / 2, termsY, { align: 'center' });
  pdf.text('Valores sujeitos a alteração sem aviso prévio.', pageWidth / 2, termsY + 5, { align: 'center' });
  
  // Convert to blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}