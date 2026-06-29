/**
 * Formula parser and aggregate resolvers for the reactive rule engine.
 */
import type { Context, ArrayContext, StringContext } from './reactive';

/**
 * Evaluate a formula string.
 * Supports: arithmetic, floor/ceil/min/max/abs, and aggregate functions:
 *   sum_lookup, sum, sum_where, count, lookup, if
 */
export function evalFormula(formula: string, ctx: Context, results: Map<string, number>, arrays: ArrayContext, stringCtx: StringContext): number {
  let processed = formula;
  processed = resolveSumLookup(processed, arrays);
  processed = resolveSumWhere(processed, arrays);
  processed = resolveSum(processed, arrays);
  processed = resolveCount(processed, arrays);
  processed = resolveLookup(processed, ctx, results, arrays, stringCtx);

  const resolved = processed.replace(/[a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ_][a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ0-9_.]*/g, (match) => {
    if (match === 'floor' || match === 'ceil' || match === 'min' || match === 'max' || match === 'abs' || match === 'if') return match;
    return String(results.get(match) ?? ctx.get(match) ?? 0);
  });

  try {
    const withIf = resolveIf(resolved);
    const fn = new Function('floor', 'ceil', 'min', 'max', 'abs', `return (${withIf});`);
    return fn(Math.floor, Math.ceil, Math.min, Math.max, Math.abs);
  } catch {
    return 0;
  }
}

// --- Aggregate resolvers ---

export function resolveSumLookup(formula: string, arrays: ArrayContext): string {
  return formula.replace(
    /sum_lookup\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName, field, tableName, keyField, valueField) => {
      const arr = arrays.get(arrayName) ?? [];
      const table = arrays.get(tableName) ?? [];
      let sum = 0;
      for (const item of arr) {
        const key = item[field] ?? 0;
        const row = table.find(r => r[keyField] === key);
        sum += Number(row ? (row[valueField] ?? 0) : 0);
      }
      return String(sum);
    }
  );
}

export function resolveSumWhere(formula: string, arrays: ArrayContext): string {
  return formula.replace(
    /sum_where\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_0-9.]+)\)/g,
    (_match, arrayName, sumField, filterField, filterValue) => {
      const arr = arrays.get(arrayName) ?? [];
      const fv = Number(filterValue);
      const filtered = arr.filter(item => item[filterField] === fv);
      return String(filtered.reduce((s, item) => s + Number(item[sumField] ?? 0), 0));
    }
  );
}

export function resolveSum(formula: string, arrays: ArrayContext): string {
  return formula.replace(
    /sum\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName, field) => {
      const arr = arrays.get(arrayName) ?? [];
      return String(arr.reduce((s, item) => s + Number(item[field] ?? 0), 0));
    }
  );
}

export function resolveCount(formula: string, arrays: ArrayContext): string {
  return formula.replace(
    /count\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName) => String((arrays.get(arrayName) ?? []).length)
  );
}

export function resolveLookup(formula: string, ctx: Context, results: Map<string, number>, arrays: ArrayContext, stringCtx: StringContext): string {
  return formula.replace(
    /lookup\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_0-9.]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+)\)/g,
    (_match, arrayName, keyField, keyValue, valueField) => {
      const arr = arrays.get(arrayName) ?? [];
      const strCtxVal = stringCtx.get(keyValue);
      if (strCtxVal !== undefined) {
        const row = arr.find(r => r[keyField] === strCtxVal);
        return String(Number(row ? (row[valueField] ?? 0) : 0));
      }
      const ctxVal = ctx.get(keyValue) ?? results.get(keyValue);
      const kv = ctxVal !== undefined ? ctxVal : (Number(keyValue) || 0);
      const row = arr.find(r => r[keyField] === kv);
      return String(Number(row ? (row[valueField] ?? 0) : 0));
    }
  );
}

/** Resolve if(cond, then, else) expressions iteratively, innermost first. */
export function resolveIf(str: string): string {
  let s = str;
  // Repeatedly resolve the innermost if() (one with no nested if inside its args)
  const MAX = 20;
  for (let i = 0; i < MAX; i++) {
    const idx = s.lastIndexOf('if(');
    if (idx === -1) break;
    // Find matching closing paren with balanced counting
    let depth = 0;
    let end = -1;
    for (let j = idx + 2; j < s.length; j++) {
      if (s[j] === '(') depth++;
      else if (s[j] === ')') { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end === -1) break;
    // Split args at top-level commas within the parens
    const inner = s.slice(idx + 3, end);
    const args = splitTopLevel(inner);
    if (args.length === 3) {
      s = s.slice(0, idx) + `((${args[0].trim()}) ? (${args[1].trim()}) : (${args[2].trim()}))` + s.slice(end + 1);
    } else {
      break; // malformed
    }
  }
  return s;
}

/** Split string by commas that are not inside parentheses. */
function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts;
}
