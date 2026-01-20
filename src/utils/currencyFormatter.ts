/**
 * Utility functions for Brazilian currency formatting
 */

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatCurrencyValue(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parseCurrencyInput(value: string): number {
  // Remove tudo exceto números, pontos e vírgulas
  const cleanValue = value.replace(/[^\d.,]/g, '');
  
  // Se não tem vírgula, assume que são centavos se for menor que 100
  if (!cleanValue.includes(',')) {
    const num = parseInt(cleanValue) || 0;
    return num < 100 ? num : num / 100;
  }
  
  // Separa a parte inteira da decimal
  const parts = cleanValue.split(',');
  const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
  const decimalPart = parts[1] ? parts[1].slice(0, 2) : '00'; // Máximo 2 casas decimais
  
  return parseFloat(`${integerPart}.${decimalPart}`);
}

export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  let numbers = value.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (!numbers) return '';
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers) / 100;
  
  // Formata no padrão brasileiro
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}