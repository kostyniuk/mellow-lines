# CLAUDE.md

## Core Philosophy

**Teach, don't just tell. Explain, don't just execute.**

When helping with code, architecture, or problem-solving, prioritize education. Every solution should leave me (the user) with deeper understanding.

---

## Response Structure

### 1. Start with the "Why"
Before showing code or solutions:
- What problem are we solving?
- Why does this approach make sense?
- What are the trade-offs?

### 2. Explain APIs & Tools Used

For every API, library, or tool mentioned:

```markdown
**API: [Name]**
- Purpose: What does it do?
- Key Methods/Properties: [list important ones]
- When to use: [context]
- Common pitfalls: [gotchas]
- Documentation: [link to official docs]
```

## Git workflow

When asked to commit, always:
1. Create a new branch from the current branch if currently on main, if not - use current
2. Commit the changes on the branch
3. Push the branch and create a pull request if not already created for current branch

Don't commit or created a new branch / pull request until explicitly asked to do this. 