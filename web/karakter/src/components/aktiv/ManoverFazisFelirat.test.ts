import { describe, it, expect } from 'vitest';
import { getFázisFelirat, fázisCselekvő } from './manover-dobas-calc';

describe('fázisCselekvő', () => {
  it('default: M → ellenfél, V/E → én', () => {
    expect(fázisCselekvő('M', undefined)).toBe('ellenfél');
    expect(fázisCselekvő('V', undefined)).toBe('én');
    expect(fázisCselekvő('E', undefined)).toBe('én');
  });
  it('override: Távoltartás M → én', () => {
    expect(fázisCselekvő('M', { M: 'én' })).toBe('én');
  });
});

describe('getFázisFelirat (cselekvő + mód)', () => {
  it('M ellenfél akaszt, aktív: siker = elhibázta', () => {
    expect(getFázisFelirat('M', 'aktív', 'ellenfél')).toEqual({ siker: 'Elhibázta', kudarc: 'Eltalált' });
  });
  it('M ellenfél akaszt, passzív: én dobom → elhibáztam', () => {
    expect(getFázisFelirat('M', 'passzív', 'ellenfél')).toEqual({ siker: 'Elhibáztam', kudarc: 'Eltaláltam' });
  });
  it('M én akasztok (Távoltartás), aktív: siker = talált', () => {
    expect(getFázisFelirat('M', 'aktív', 'én')).toEqual({ siker: 'Talált', kudarc: 'Nem talált' });
  });
  it('V én, aktív: talált', () => {
    expect(getFázisFelirat('V', 'aktív', 'én')).toEqual({ siker: 'Talált', kudarc: 'Nem talált' });
  });
  it('V én, passzív: az ellenfél támad → eltalált', () => {
    expect(getFázisFelirat('V', 'passzív', 'én')).toEqual({ siker: 'Eltalált', kudarc: 'Nem talált' });
  });
  it('E én, aktív: elértem', () => {
    expect(getFázisFelirat('E', 'aktív', 'én')).toEqual({ siker: 'Elértem', kudarc: 'Nem értem el' });
  });
  it('E én, passzív: az ellenfél dob → elérte', () => {
    expect(getFázisFelirat('E', 'passzív', 'én')).toEqual({ siker: 'Elérte', kudarc: 'Nem érte el' });
  });
});
