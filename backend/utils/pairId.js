/**
 * Deterministic, order-independent id for a 1:1 conversation between two users.
 * Same two ids always produce the same pairId, regardless of who calls it or in
 * which order the ids are supplied.
 */
export function getPairId(idA, idB) {
  return [String(idA), String(idB)].sort().join('_');
}
