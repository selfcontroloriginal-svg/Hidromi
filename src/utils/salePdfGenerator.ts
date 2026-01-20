import jsPDF from 'jspdf';

interface SaleData {
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
    type: 'product' | 'service';
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  installments: number;
  observations: string;
  vendor: string;
  company: {
    name: string;
    cnpj: string;
    phone: string;
    address: string;
  };
  date: string;
}

export async function generateSalePDF(saleData: SaleData): Promise<Blob> {
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
  
  // SALE TITLE - POSITIONED WHERE COMPANY INFO STARTS
  const saleStartX = 105; // Same position as company info
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPROVANTE DE VENDA', saleStartX, 25);
  
  // COMPANY INFORMATION - POSITIONED IN THE MIDDLE
  const companyStartX = 105; // Same X as sale title for alignment
  
  // Company details - COMPACT AND IN THE MIDDLE
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CNPJ: 24.395.398/0001-70', companyStartX, 37);
  pdf.text('Tel: (66) 2102-5000', companyStartX, 45);
  
  // Address in two lines for better space usage
  pdf.text('Rua dos Cajueiros, 1366', companyStartX, 53);
  pdf.text('Setor Residencial Norte - Sinop-MT', companyStartX, 61);
  
  // SALE DETAILS - TOTALLY IN THE RIGHT CORNER
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  // Using pageWidth - 15 to position at the very right edge with small margin
  pdf.text(`Nº ${saleData.id.substring(0, 8)}`, pageWidth - 15, 30, { align: 'right' });
  pdf.text(`Data: ${new Date(saleData.date).toLocaleDateString('pt-BR')}`, pageWidth - 15, 38, { align: 'right' });
  pdf.text(`Vendedor: ${saleData.vendor}`, pageWidth - 15, 46, { align: 'right' });
  
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
  pdf.text(`${saleData.client.name}`, 20, yPosition + 22);
  
  // Client details
  let clientDetailsY = yPosition + 29;
  if (saleData.client.email) {
    pdf.setFontSize(10);
    pdf.setTextColor(...grayText);
    pdf.text(`Email: ${saleData.client.email}`, 20, clientDetailsY);
  }
  
  if (saleData.client.phone) {
    pdf.setFontSize(10);
    pdf.setTextColor(...grayText);
    pdf.text(`Telefone: ${saleData.client.phone}`, pageWidth / 2, clientDetailsY);
  }
  
  yPosition += 55;
  
  // Items section title
  pdf.setTextColor(...darkText);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITENS VENDIDOS', 20, yPosition);
  
  yPosition += 15;
  
  // Table header
  pdf.setFillColor(...primaryColor);
  pdf.rect(15, yPosition, pageWidth - 30, 15, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIÇÃO', 20, yPosition + 10);
  pdf.text('TIPO', pageWidth - 150, yPosition + 10, { align: 'center' });
  pdf.text('QTD', pageWidth - 110, yPosition + 10, { align: 'center' });
  pdf.text('VALOR UNIT.', pageWidth - 70, yPosition + 10, { align: 'center' });
  pdf.text('TOTAL', pageWidth - 20, yPosition + 10, { align: 'right' });
  
  yPosition += 15;
  
  // Items
  pdf.setTextColor(...darkText);
  pdf.setFont('helvetica', 'normal');
  
  saleData.items.forEach((item, index) => {
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
    pdf.text(item.type === 'product' ? 'Produto' : 'Serviço', pageWidth - 150, yPosition + 8, { align: 'center' });
    pdf.text(item.quantity.toString(), pageWidth - 110, yPosition + 8, { align: 'center' });
    pdf.text(`R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 70, yPosition + 8, { align: 'center' });
    pdf.text(`R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, yPosition + 8, { align: 'right' });
    
    yPosition += rowHeight;
  });
  
  // Totals section
  yPosition += 10;
  
  const totalsStartY = yPosition;
  const totalsHeight = saleData.discount > 0 ? 45 : 30;
  
  pdf.setFillColor(241, 245, 249);
  pdf.rect(pageWidth - 150, totalsStartY, 135, totalsHeight, 'F');
  
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(1);
  pdf.rect(pageWidth - 150, totalsStartY, 135, totalsHeight);
  
  pdf.setTextColor(...darkText);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  let totalY = totalsStartY + 12;
  pdf.text('Subtotal:', pageWidth - 145, totalY);
  pdf.text(`R$ ${saleData.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, totalY, { align: 'right' });
  
  if (saleData.discount > 0) {
    totalY += 12;
    pdf.setTextColor(220, 38, 38); // red-600
    pdf.text('Desconto:', pageWidth - 145, totalY);
    pdf.text(`- R$ ${saleData.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, totalY, { align: 'right' });
  }
  
  totalY += 12;
  pdf.setTextColor(...darkText);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('TOTAL:', pageWidth - 145, totalY);
  pdf.setTextColor(...primaryColor);
  pdf.text(`R$ ${saleData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, totalY, { align: 'right' });
  
  yPosition += totalsHeight + 20;
  
  // Observations section
  if (saleData.observations && saleData.observations.trim()) {
    pdf.setTextColor(...darkText);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES', 20, yPosition);
    
    yPosition += 10;
    
    const notesHeight = Math.max(25, Math.ceil(saleData.observations.length / 80) * 5 + 10);
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPosition, pageWidth - 30, notesHeight, 'F');
    
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPosition, pageWidth - 30, notesHeight);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...grayText);
    
    const noteLines = pdf.splitTextToSize(saleData.observations, pageWidth - 40);
    let noteY = yPosition + 8;
    noteLines.forEach((line: string) => {
      pdf.text(line, 20, noteY);
      noteY += 5;
    });
    
    yPosition += notesHeight + 20;
  }
  
  // Payment information - MOVED ABOVE "Obrigado pela confiança!"
  const getPaymentMethodText = (method: string) => {
    const methods = {
      money: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque'
    };
    return methods[method] || method;
  };
  
  const paymentHeight = saleData.paymentMethod === 'credit' && saleData.installments > 1 ? 35 : 25;
  pdf.setFillColor(249, 250, 251);
  pdf.rect(15, yPosition, pageWidth - 30, paymentHeight, 'F');
  
  pdf.setDrawColor(209, 213, 219);
  pdf.setLineWidth(0.5);
  pdf.rect(15, yPosition, pageWidth - 30, paymentHeight);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...darkText);
  
  // ONLY "Forma de Pagamento: [método]" - NO TITLE ABOVE
  pdf.text(`Forma de Pagamento: ${getPaymentMethodText(saleData.paymentMethod)}`, 20, yPosition + 15);
  
  // INSTALLMENT INFO BELOW IF APPLICABLE
  if (saleData.paymentMethod === 'credit' && saleData.installments > 1) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...grayText);
    pdf.text(`Parcelamento: ${saleData.installments}x de R$ ${(saleData.total / saleData.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition + 25);
    
    // Additional payment details
    pdf.text(`Valor total parcelado: R$ ${saleData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition + 32);
  }
  
  yPosition += paymentHeight + 20;
  
  // Footer message - "Obrigado pela confiança!" MOVED BELOW PAYMENT INFO
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text('Obrigado pela confiança!', pageWidth / 2, yPosition, { align: 'center' });
  
  // Terms and conditions - MOVED BELOW "Obrigado pela confiança!"
  const termsY = yPosition + 10;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...grayText);
  pdf.text('Este documento comprova a realização da venda.', pageWidth / 2, termsY, { align: 'center' });
  pdf.text('Valores sujeitos a alteração sem aviso prévio.', pageWidth / 2, termsY + 5, { align: 'center' });
  
  // Additional footer info
  const additionalFooterY = termsY + 15;
  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  pdf.text('HidroMineral - Mineralizador de Água', pageWidth / 2, additionalFooterY, { align: 'center' });
  pdf.text('Rua dos Cajueiros, 1366 - Setor Residencial Norte - Sinop-MT', pageWidth / 2, additionalFooterY + 5, { align: 'center' });
  
  // Convert to blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}