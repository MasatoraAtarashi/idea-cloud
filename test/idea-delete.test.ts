import { describe, expect, it } from "vitest";
import { ideaDeleteConfirmMessage } from "../app/lib/idea-delete";

describe("idea delete copy", () => {
  it("builds a Japanese confirm that names the idea", () => {
    expect(ideaDeleteConfirmMessage("通勤メモ")).toBe(
      "「通勤メモ」を削除します。この操作は取り消せません。",
    );
    expect(ideaDeleteConfirmMessage("   ")).toBe(
      "「無題」を削除します。この操作は取り消せません。",
    );
  });
});
