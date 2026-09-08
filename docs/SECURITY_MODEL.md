# Security Model

The extension is being built for Chrome Web Store publication readiness.

M0 baseline constraints:

- Manifest V3 only,
- content-script execution in the isolated world by default,
- Facebook-only host access,
- minimal permissions,
- no remote JavaScript or WebAssembly,
- no `eval` or dynamic code execution,
- no hidden or unnecessary network behavior.

Security assertions are re-audited in M0-18 after the runnable extension exists.
