import { describe, expect, it } from "vitest";
import { inspirationDeleteConfirmMessage } from "../app/lib/inspiration-delete";

describe("inspiration delete copy", () => {
  it("builds a Japanese confirm that names the inspiration", () => {
    expect(inspirationDeleteConfirmMessage("面白い記事")).toBe(
      "「面白い記事」を削除します。この操作は取り消せません。",
    );
    expect(inspirationDeleteConfirmMessage("   ")).toBe(
      "「無題」を削除します。この操作は取り消せません。",
    );
  });
});
