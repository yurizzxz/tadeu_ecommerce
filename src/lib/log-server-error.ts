import "server-only";

type ServerOperation = "profile.name" | "profile.address" | "cart.add" | "cart.update" | "cart.remove" | "checkout.confirm" | "order.cancel" | "catalog.home" | "catalog.list";

export function logServerError(operation: ServerOperation) {
  console.error(JSON.stringify({ level: "error", event: "server_operation_failed", operation }));
}
