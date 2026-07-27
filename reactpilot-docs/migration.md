# React 19 / Next.js Migration Assistant (`reactpilot migrate`)

ReactPilot automates codebase upgrades to React 19 and Next.js App Router schemas.

## Commands

```bash
# Check upgrade status and framework versions
reactpilot migrate status

# Run React 19 migration checks without applying edits
reactpilot migrate react19 --dry-run

# Run Next.js migration and save markdown change log
reactpilot migrate nextjs --report ./migration-summary.md

# Revert the latest applied migration
reactpilot migrate rollback
```

## Migration Steps

1. **Context Simplification:** Replaces deprecated `<Context.Provider>` elements with `<Context>`.
2. **Ref Refactoring:** Unwraps redundant `forwardRef` function wrappers.
3. **Hook Renaming:** Transforms `useFormState` to `useActionState`.
4. **Next.js Upgrades:** Refactors dynamic imports, legacy Image components, and page Metadata APIs.
