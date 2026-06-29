import type { Session } from './types';
import type { Context, StringContext } from './reactive';

export interface FeltételEvaluator {
  getFeltételÉrték(forrás: string): number | boolean | string | undefined;
  feltételTeljesül(feltétel: unknown): boolean;
}

/**
 * Creates a reusable feltétel evaluator from the given context components.
 * Pure factory — no side effects, no hooks.
 */
export function createFeltételEvaluator(
  aktívFeltételek: Set<string>,
  session: Session,
  computed: Map<string, number>,
  ctx: Context,
  stringCtx: StringContext,
): FeltételEvaluator {

  function getFeltételÉrték(forrás: string): number | boolean | string | undefined {
    if (aktívFeltételek.has(forrás)) return true;
    if (forrás in session) return (session as unknown as Record<string, unknown>)[forrás] as number | boolean;
    if (computed.has(forrás)) return computed.get(forrás)!;
    if (ctx.has(forrás)) return ctx.get(forrás)!;
    if (stringCtx.has(forrás)) return stringCtx.get(forrás)!;
    if (forrás.includes(':')) return false;
    return undefined;
  }

  function feltételTeljesül(feltétel: unknown): boolean {
    if (!feltétel || feltétel === '') return true;
    if (typeof feltétel === 'string') return aktívFeltételek.has(feltétel);
    if (Array.isArray(feltétel)) {
      return feltétel.every((pred: { forrás: string; operátor: string; érték: unknown }) => {
        const val = getFeltételÉrték(pred.forrás);
        if (val === undefined) return false;
        const normVal = typeof val === 'boolean' ? (val ? 1 : 0) : val;
        const normExp = typeof pred.érték === 'boolean' ? (pred.érték ? 1 : 0) : pred.érték;
        switch (pred.operátor) {
          case '==': return normVal === normExp;
          case '!=': return normVal !== normExp;
          case '>=': return (normVal as number) >= (normExp as number);
          case '<=': return (normVal as number) <= (normExp as number);
          case '>': return (normVal as number) > (normExp as number);
          case '<': return (normVal as number) < (normExp as number);
          default: return false;
        }
      });
    }
    return false;
  }

  return { getFeltételÉrték, feltételTeljesül };
}
