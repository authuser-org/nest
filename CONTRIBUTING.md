# Contributing

Use a focused branch and keep changes compatible with the API stability policy.

Before opening a pull request, run:

```bash
npm ci
npm run check
npm run test:coverage
npm run test:package
npm ci --prefix example
npm run smoke --prefix example
```

Add tests for behavior changes and update the changelog or migration guide when a
consumer can observe the difference. Never include credentials, production data or
private vulnerability details in an issue or pull request.

Security reports follow [SECURITY.md](./SECURITY.md), not the public issue tracker.
