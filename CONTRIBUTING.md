# Contributing to tsdocs-builder

Thank you for your interest in contributing. Here's everything you need to know.

---

## Development Setup

```bash
git clone https://github.com/Bravo68Web/tsdocs-builder.git
cd tsdocs-builder
bun install
```

## Scripts

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `bun run dev`       | Run the CLI directly from source (fast iteration)    |
| `bun run build`     | Build both library (`dist/`) and binary (`bin/`)     |
| `bun run typecheck` | TypeScript type check                                |
| `bun run lint`      | Run ESLint + Oxlint                                  |
| `bun run fmt`       | Format code with Biome + Prettier                    |
| `bun run fmt:check` | Check formatting without writing                     |
| `bun run test`      | Run tests with Vitest                                |
| `bun run ci`        | Full pipeline: fmt → lint → typecheck → test → build |

## Branch Naming

| Prefix      | Use for                                  |
| ----------- | ---------------------------------------- |
| `feat/`     | New features                             |
| `fix/`      | Bug fixes                                |
| `refactor/` | Code restructure without behavior change |
| `perf/`     | Performance improvements                 |
| `docs/`     | Documentation only                       |
| `test/`     | Adding or updating tests                 |
| `chore/`    | Tooling, dependencies, config            |

**Example:** `feat/sidebar-mintlify`, `fix/jsdoc-param-parsing`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`
Scope: optional, use the module or feature affected

**Examples:**

```
feat(adapters): add Mintlify sidebar adapter
fix(parser): handle overloaded function signatures
docs(readme): add framework compatibility table
perf(extractor): avoid repeated ts-morph type lookups
```

## Pull Request Process

1. **Fork** the repo and create a branch from `main`.
2. **Develop** — make changes, add tests, follow the lint/format rules.
3. **Verify** — run `bun run ci` locally before opening a PR.
4. **Describe** — write a clear PR title and description explaining _why_, not just _what_.
5. **Review** — address feedback; rebase and force-push rather than merge commits.
6. **Merge** — squash-merge into `main`.

## Code Conventions

- TypeScript strict mode — no `any`, no implicit `any`
- Prefer named exports over default exports
- One export per line for grouped imports
- No `console.log` in library code (allowed in CLI entry)
- JSDoc on public API surface; inline comments only for non-obvious rationale

## Testing

Write unit tests for parsers, utilities, and adapters. Each adapter should have tests verifying:

1. It serializes `SidebarItem[]` correctly for its format
2. The filename matches the framework expectation
3. Nested items are handled properly

```bash
bun run test # run tests
bun run test:watch # watch mode (add via vitest.config.ts if needed)
```

## Reporting Issues

- Search existing issues before opening a new one
- Include: tsdocs-builder version, Node/Bun version, the command you ran, and a minimal reproduction
- Label bug reports with `bug`, feature requests with `enhancement`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
