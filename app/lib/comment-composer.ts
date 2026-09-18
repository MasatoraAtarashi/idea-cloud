export type CommentComposerSnapshot = {
  body: string;
  formKey: number;
  lastSubmitted: string;
};

export type CommentComposerResult = {
  ok?: true;
  error?: string;
};

/** After fetcher has captured FormData (`submitting`), empty the field and remount. */
export function commentComposerResetOnSubmit(
  state: CommentComposerSnapshot,
  submittedBody: string,
): CommentComposerSnapshot {
  return {
    body: "",
    formKey: state.formKey + 1,
    lastSubmitted: submittedBody,
  };
}

/** Keep empty on success; restore the draft if create failed. */
export function commentComposerAfterSettle(
  state: CommentComposerSnapshot,
  result: CommentComposerResult | undefined,
): CommentComposerSnapshot {
  if (result?.ok) {
    return { body: "", formKey: state.formKey, lastSubmitted: "" };
  }
  if (result?.error) {
    return { ...state, body: state.lastSubmitted };
  }
  return state;
}
