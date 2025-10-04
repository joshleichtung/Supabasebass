# BassBase Docs Index

This folder contains the authoritative plan for BassBase. Files are intentionally separated so an AI can follow a staged build.

- `PRD.md` — product requirements and user story framing.
- `MUST_HAVE.md` — the core feature set and acceptance criteria. Build this first.
- `BUILD_PLAN.md` — architecture, schema, APIs, and implementation order.
- `STRETCH_GOALS.md` — ranked enhancements. Do NOT implement until core is approved.
- `CODE_SUGGESTIONS.md` — key patterns and reference snippets.
- `README_FOR_AI.md` — guardrails and success criteria for AI-assisted implementation.

**Build order**: MUST_HAVE → request human approval → only then begin STRETCH_GOALS (in ranked order). The AI must halt after MUST_HAVE unless a file named `APPROVED_CORE.md` exists with the single word `APPROVED`.