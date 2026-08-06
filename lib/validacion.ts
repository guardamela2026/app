/** Valida un email de forma pragmática (algo@algo.dominio). */
export function emailValido(s: string): boolean {
  const v = s.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Valida un teléfono flexible: acepta +, espacios, guiones y paréntesis, y
 * exige entre 7 y 15 dígitos (rango razonable, sin atarse a un país).
 */
export function telefonoValido(s: string): boolean {
  const v = s.trim();
  if (!/^[+\d][\d\s()-]*$/.test(v)) return false;
  const digitos = v.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}
