import { describe, expect, it } from "vitest";
import { inspirationDeleteConfirmMessage } from "../app/lib/inspiration-delete";
import { JA } from "../app/i18n/dictionary";

describe("inspiration delete copy", () => {
  it("builds a Japanese confirm that names the inspiration", () => {
    expect(inspirationDeleteConfirmMessage(JA, "面白い記事")).toBe(
      "「面白い記事」を削除します。この操作は取り消せません。",
    );
    expect(inspirationDeleteConfirmMessage(JA, "   ")).toBe(
      "「無題」を削除します。この操作は取り消せません。",
    );
  });
});
