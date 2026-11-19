import { sqltag, type Sql } from "@prisma/client/runtime/client";

// A origem do instante é fornecida pelo banco; o parâmetro permite testar a fronteira exata.
export function cancellationWindow(now: Sql): Sql {
  return sqltag`created_at + interval '5 minutes' >= ${now}`;
}
