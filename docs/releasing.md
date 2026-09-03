# Release process

## Preparation

1. Ensure `main` is green and the worktree is clean.
2. Update `CHANGELOG.md` and the package version using Semantic Versioning.
3. Run `npm run check`, `npm run test:coverage`, `npm run test:package`, and
   `npm run smoke --prefix example`.
4. Commit the release and create an annotated `vX.Y.Z` tag at that commit.
5. Push the commit and tag.

## Trusted publishing

Configure npm trusted publishing for:

- Organization/user: `authuser-org`
- Repository: `nest`
- Workflow: `.github/workflows/release.yml`
- Environment: `npm`

Create a GitHub Release from the version tag. The release workflow verifies that the
tag equals `package.json`, repeats all release checks, and publishes with npm
provenance through GitHub OIDC. No long-lived npm token should be stored in GitHub.

## Verification

Confirm the npm version and provenance, install it into a clean project, and verify
that the GitHub tag resolves to the same commit used by the release workflow.
