import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { logServerError } from "../../../src/lib/log-server-error";

afterEach(() => vi.restoreAllMocks());

it("registra somente o evento e a operação, sem dados do erro ou da requisição", () => {
  const output = vi.spyOn(console, "error").mockImplementation(() => {});
  logServerError("profile.address");
  expect(output).toHaveBeenCalledOnce();
  expect(JSON.parse(output.mock.calls[0][0])).toEqual({
    level: "error",
    event: "server_operation_failed",
    operation: "profile.address",
  });
  expect(output.mock.calls[0]).toHaveLength(1);
});
