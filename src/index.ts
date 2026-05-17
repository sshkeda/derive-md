import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function deriveMd(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    const prefill = process.env.DERIVE_MD_PREFILL_PROMPT ?? process.env.PAM_PREFILL_PROMPT;
    if (prefill && ctx.ui?.setEditorText && !(ctx.ui.getEditorText?.() ?? "").trim()) {
      ctx.ui.setEditorText(prefill);
      ctx.ui.setTitle?.(
        process.env.DERIVE_MD_PROFILE ? `derive-md:${process.env.DERIVE_MD_PROFILE}` : "derive-md",
      );
    }
  });
}
