# CLAUDE.md

## Code quality

After making code changes, always run `npx tsc --noEmit` to check for TypeScript errors and fix any issues before considering the task complete.

## Git workflow

When asked to commit, always:
1. Create a new branch from the current branch if currently on main, if not - use current
2. Commit the changes on the branch
3. Push the branch and create a pull request if not already created for current branch
