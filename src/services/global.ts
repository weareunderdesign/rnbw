/**
 * it returns the match count of the reg in str
 * @param str 
 * @param reg 
 * @returns 
 */
export const getMatchCount = (str: string, reg: RegExp): number => {
  return ((str || '').match(reg) || []).length
}