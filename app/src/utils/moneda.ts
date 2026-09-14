/**
 * Formatea un número como moneda colombiana (COP) sin decimales.
 * En Colombia el peso no utiliza centavos ni decimales.
 * Ejemplos: 25000 -> "$25.000", 1500 -> "$1.500", 0 -> "$0"
 */
export const formatearCOP = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(n)) return '$0';
  return '$' + Math.round(n).toLocaleString('es-CO');
};

/**
 * Formato numérico entero sin signo de pesos.
 */
export const formatearNumeroEntero = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('es-CO');
};
