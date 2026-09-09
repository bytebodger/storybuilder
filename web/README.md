# web

React + TypeScript (Vite) console for Storybuilder. Pick a world, pick a skill, fill in its
arguments, submit, and review the output — including the proposed canon diff when a skill writes.

```bash
npm install
npm run dev
```

The app is static. Everything that touches the working tree goes through the [bridge](../bridge)
service on port 8787; Vite proxies `/api` to it in development.

Current state: the shell works against the bridge's endpoints. The skill catalog is still served
from the bridge's hardcoded list rather than read from `.claude/skills/`.
