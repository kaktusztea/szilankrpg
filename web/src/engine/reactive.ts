/**
 * Reactive rule engine — evaluates declarative formulas from rules.json
 * against a context of named values (scalars and arrays).
 */

export interface Rule {
  id: string;
  formula: string;
  inputs: string[];
}

export interface RulesFile {
  version: number;
  rules: Rule[];
}

export type Context = Map<string, number>;
export type ArrayContext = Map<string, Record<string, number>[]>;

/**
 * Evaluate all rules in topological order.
 */
export function evaluate(rules: Rule[], ctx: Context, arrays?: ArrayContext): Map<string, number> {
  const results = new Map<string, number>();
  const arrCtx = arrays ?? new Map();

  const pending = [...rules];
  const maxIterations = pending.length * 2;
  let iterations = 0;

  while (pending.length > 0 && iterations < maxIterations) {
    iterations++;
    const idx = pending.findIndex(r =>
      r.inputs.every(inp => ctx.has(inp) || results.has(inp) || arrCtx.has(inp))
    );
    if (idx === -1) break;

    const rule = pending.splice(idx, 1)[0];
    const value = evalFormula(rule.formula, ctx, results, arrCtx);
    results.set(rule.id, value);
    ctx.set(rule.id, value);
  }

  return results;
}

/**
 * Evaluate a formula string.
 * Supports: arithmetic, floor/ceil/min/max/abs, and aggregate functions:
 *   sum_lookup(arrayName, field, lookupTable, lookupKey, lookupValue)
 *   sum(arrayName, field)
 *   sum_where(arrayName, sumField, filterField, filterValue)
 *   count(arrayName)
 *   lookup(arrayName, keyField, keyValue, valueField)
 *   if(condition, thenValue, elseValue)
 */
function evalFormula(formula: string, ctx: Context, results: Map<string, number>, arrays: ArrayContext): number {
  // Process aggregate functions first
  let processed = formula;

  // sum_lookup(arrayName, field, lookupTableName, lookupKeyField, lookupValueField)
  processed = processed.replace(
    /sum_lookup\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName, field, tableName, keyField, valueField) => {
      const arr = arrays.get(arrayName) ?? [];
      const table = arrays.get(tableName) ?? [];
      let sum = 0;
      for (const item of arr) {
        const key = item[field] ?? 0;
        const row = table.find(r => r[keyField] === key);
        sum += row ? (row[valueField] ?? 0) : 0;
      }
      return String(sum);
    }
  );

  // sum_where(arrayName, sumField, filterField, filterValue)
  processed = processed.replace(
    /sum_where\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_0-9.]+)\)/g,
    (_match, arrayName, sumField, filterField, filterValue) => {
      const arr = arrays.get(arrayName) ?? [];
      const fv = Number(filterValue);
      const filtered = arr.filter(item => item[filterField] === fv);
      return String(filtered.reduce((s, item) => s + (item[sumField] ?? 0), 0));
    }
  );

  // sum(arrayName, field)
  processed = processed.replace(
    /sum\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName, field) => {
      const arr = arrays.get(arrayName) ?? [];
      return String(arr.reduce((s, item) => s + (item[field] ?? 0), 0));
    }
  );

  // count(arrayName)
  processed = processed.replace(
    /count\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName) => {
      return String((arrays.get(arrayName) ?? []).length);
    }
  );

  // lookup(arrayName, keyField, keyValue, valueField)
  processed = processed.replace(
    /lookup\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_0-9.]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+)\)/g,
    (_match, arrayName, keyField, keyValue, valueField) => {
      const arr = arrays.get(arrayName) ?? [];
      const kv = Number(keyValue) || 0;
      const row = arr.find(r => r[keyField] === kv);
      return String(row ? (row[valueField] ?? 0) : 0);
    }
  );

  // Replace remaining identifiers with their values (before if() processing)
  const resolved = processed.replace(/[a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ_][a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ0-9_.]*/g, (match) => {
    if (match === 'floor' || match === 'ceil' || match === 'min' || match === 'max' || match === 'abs') return match;
    const val = results.get(match) ?? ctx.get(match) ?? 0;
    return String(val);
  });

  try {
    // Support if(cond, then, else) as ternary
    const withIf = resolved.replace(
      /if\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
      '(($1) ? ($2) : ($3))'
    );
    const fn = new Function('floor', 'ceil', 'min', 'max', 'abs', `return (${withIf});`);
    return fn(Math.floor, Math.ceil, Math.min, Math.max, Math.abs);
  } catch {
    return 0;
  }
}

/**
 * Build a flat context map from the character state and konstansok.
 */
export function buildContext(
  tulajdonságok: Record<string, number> | object,
  tsz: number,
  konstansok: { harcérték_alap: Record<string, number>; kp: Record<string, number>; arányok: Record<string, number> },
  extras?: Record<string, number>,
): Context {
  const ctx: Context = new Map();

  for (const [key, val] of Object.entries(tulajdonságok)) {
    ctx.set(`tulajdonságok.${key}`, val);
  }

  ctx.set('tsz', tsz);

  for (const [key, val] of Object.entries(konstansok.harcérték_alap)) {
    ctx.set(`konstansok.harcérték_alap.${key}`, val as number);
  }
  for (const [key, val] of Object.entries(konstansok.kp)) {
    ctx.set(`konstansok.kp.${key}`, val as number);
  }
  for (const [key, val] of Object.entries(konstansok.arányok)) {
    ctx.set(`konstansok.arányok.${key}`, val as number);
  }

  if (extras) {
    for (const [key, val] of Object.entries(extras)) {
      ctx.set(key, val);
    }
  }

  return ctx;
}

/**
 * Build array context from character data (képzettségek, fortélyok, etc.)
 */
export function buildArrayContext(
  képzettségek: { név: string; szint: number }[],
  fortélyok: readonly { név: string; fok: number }[],
  kepzettsegKpTable: { szint: number; kp: number }[],
  fortelyKpMap?: Map<string, number>,
  harciFortelyNevek?: Set<string>,
): ArrayContext {
  const arrays: ArrayContext = new Map();

  arrays.set('képzettségek', képzettségek.map(k => ({ szint: k.szint })));

  // Only include fortélyok that cost KP (kp_perfok > 0), using base name lookup
  const kpFortélyok = fortélyok.filter(f => {
    if (!fortelyKpMap) return true;
    const perFok = fortelyKpMap.get(f.név) ?? 6;
    return perFok > 0;
  });
  arrays.set('fortélyok', kpFortélyok.map(f => ({ fok: f.fok })));

  arrays.set('kp_tábla', kepzettsegKpTable.map(e => ({ szint: e.szint, kp: e.kp })));

  // harci_fortélyok: for max_HM calculation (is_mesterfegyver: 1 if Mesterfegyver, 0 otherwise)
  if (harciFortelyNevek) {
    const harci = fortélyok.filter(f => harciFortelyNevek.has(f.név));
    arrays.set('harci_fortélyok', harci.map(f => ({ fok: f.fok, is_mesterfegyver: f.név === 'Mesterfegyver' ? 1 : 0 })));
  }

  return arrays;
}
