import { describe, it, expect } from 'vitest';
import { getFázisFelirat } from './ManoverDobasPopup';

describe('getFázisFelirat (fázis+mód gomb-feliratok)', () => {
  it('M aktív: az ellenfél akaszt — siker = elhibázta', () => {
    expect(getFázisFelirat('M', 'aktív')).toEqual({ siker: 'Elhibázta', kudarc: 'Eltalált' });
  });
  it('M passzív: én (védő) akasztok — siker = elhibáztam', () => {
    expect(getFázisFelirat('M', 'passzív')).toEqual({ siker: 'Elhibáztam', kudarc: 'Eltaláltam' });
  });
  it('V aktív: én támadok — siker = talált', () => {
    expect(getFázisFelirat('V', 'aktív')).toEqual({ siker: 'Talált', kudarc: 'Nem talált' });
  });
  it('V passzív: ellenfél támad — siker = eltalált', () => {
    expect(getFázisFelirat('V', 'passzív')).toEqual({ siker: 'Eltalált', kudarc: 'Nem talált' });
  });
  it('E aktív: én dobok', () => {
    expect(getFázisFelirat('E', 'aktív')).toEqual({ siker: 'Elértem', kudarc: 'Nem értem el' });
  });
  it('E passzív: ellenfél dob', () => {
    expect(getFázisFelirat('E', 'passzív')).toEqual({ siker: 'Elérte', kudarc: 'Nem érte el' });
  });
});
