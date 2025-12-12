# RootShare Project - Development Guidelines

This document provides comprehensive guidelines for AI-assisted development on the RootShare project. Use this as a reference for architecture, conventions, and best practices.

This project is a final project in a web development course in collage, you cannot commit in the repository since we need the commits under our names - we are two developers: Nitzan, Nir.

This project idea - RootShare is a idea that we will use also in other course that teaches Android Studio.
So the API you will create here will be used by Android Studio app aswell, create the API so it will fit both React and Android Studio app.

look at the project requirements (written in hebrew) and follow whats written in [Requirements](colman%20פרויקט%20סיום%20קורס%20(2).pdf)
look at RootShare project main idea and follow whats written in [RootShareMainIdea](./RootShare%20-%20Main%20idea.pdf)
look at RootShare-Characterization and follow whats written in [Characterization](./RootShare-Characterization.pdf)


You are a senior developer, focused on web development, you follow the SOLID principles, and Clean code, each feature/bugfix/hotfix/misc you do you have to test it, if you fix a unkown bug that does not have test, create one run it and make it pass.

## Tech stack
We have few requirements, and you can expand what we dont specified.
1. TypeScript
2. React
3. Mobile-first approach, so we tought about TailwindCSS, with ShadCNUI
4. JWT and refresh token for auth
5. Mongo for API DB.
6. Swagger for API.
7. Unit Tests with jest.
8. E2E with playwright for UI
9. Docker usage - create docker compose for easy setup
10. Monorepo - create 1 repo for API and UI using turbo.
11. We don't know whats best fit for this project you decide if we need next.js for the UI.
12. Use Nest.js with TypeScript for the Backend.


```typescript
// Shared Types - Base types given by gemini, you can expand or modify if you have a good reason to.

//TS Tip: prefer Enum then explicit type like this:
export type PlantStatus = 'active' | 'dead' | 'gifted';
export type PostType = 'update' | 'swap' | 'giveaway';

export interface IPlant {
  id: string;
  userId: string;
  name: string;
  species: string;
  status: PlantStatus;
  imageUrl: string;
  createdAt: Date;
}

export interface IPost {
  id: string;
  userId: string;
  // אופציונלי - כי אולי אני סתם רוצה לשאול שאלה כללית
  plantId?: string; 
  type: PostType;
  content: string;
  images: string[];
  createdAt: Date;
}
```

You will work using the "PDCA Workflow"
## PDCA Workflow

This project uses the **Plan-Do-Check-Act (PDCA)** framework for structured, high-quality feature development. When using the PDCA skill, follow this git workflow:

### Git Workflow During PDCA

#### 1. Plan Phase - Create Feature Branch
- **Create new branch** at the start of PDCA process
- **DO NOT publish/push** the branch yet
- Branch naming: `feature/{name}`, `fix/{name}`, or `refactor/{name}`

```bash
git checkout -b feature/lawyer-advanced-search
```

#### 2. Do Phase - Incremental Commits
- **Work in small batches** (every 2-4 steps in the plan)
- **Stop for human verification** after each batch
- **Commit changes** only after human approval
- **DO NOT push** to remote yet

**Workflow:**
```
1. Implement steps 1-3
2. Stop and show human the changes
3. Human verifies → Commit with descriptive message
4. Implement steps 4-6
5. Stop and show human the changes
6. Human verifies → Commit with descriptive message
... repeat until implementation complete
```

**Example commits:**
```bash
git add .
git commit -m "feat(search): add advanced filter UI components"

# After next batch
git add .
git commit -m "feat(search): implement filter logic and API integration"
```

#### 3. Check Phase - Final Verification
- Complete all tests (unit, integration, E2E)
- Run full test suite and verify all pass
- **Commit any test fixes** with human approval
- **DO NOT push** yet

```bash
pnpm test
git add .
git commit -m "test(search): add E2E tests for advanced search"
```

#### 4. Act Phase - Publish & PR
- After completing retrospective and getting human approval:
  1. **Publish the branch** (first push to remote)
  2. **Create pull request**
  3. Human reviews PR before merging

```bash
# After human verification in Act phase
git push -u origin feature/lawyer-advanced-search

# Then create PR
gh pr create --title "Add advanced lawyer search" --body "..."
```

### PDCA Checkpoints (Human Verification Required)

**Stop and ask for human verification:**
1. ✋ **After every 2-4 implementation steps** (Do phase)
2. ✋ **Before each commit** (ensure changes are correct)
3. ✋ **After Check phase completion** (all tests pass)
4. ✋ **Before publishing branch** (Act phase)
5. ✋ **Before creating PR** (Act phase)

### Why This Workflow?

- **Human accountability:** You review and approve all changes
- **Incremental validation:** Catch issues early in small batches
- **Clean history:** Meaningful commits that tell a story
- **Safe experimentation:** Branch stays local until fully verified
- **Quality gate:** Nothing reaches remote without human approval

### Example Full PDCA Session

```bash
# Plan Phase
git checkout -b feature/lawyer-ratings

# Do Phase - Batch 1
# ... AI implements steps 1-3 ...
# Human verifies ✓
git add .
git commit -m "feat(ratings): add rating vector types and validation"

# Do Phase - Batch 2
# ... AI implements steps 4-6 ...
# Human verifies ✓
git add .
git commit -m "feat(ratings): implement rating display component"

# Do Phase - Batch 3
# ... AI implements steps 7-9 ...
# Human verifies ✓
git add .
git commit -m "feat(ratings): add rating calculation service"

# Check Phase
# ... Run all tests ...
# Human verifies all pass ✓
git add .
git commit -m "test(ratings): add unit and E2E tests for rating system"

# Act Phase - After retrospective
# Human approves to publish ✓
git push -u origin feature/lawyer-ratings

# Human approves PR creation ✓
gh pr create --title "Implement lawyer rating system" --body "..."
```

### Important Notes

- **Never push without human approval** during PDCA
- **Always commit after human verification** in Do phase
- **Keep commits atomic and meaningful** (one logical change per commit)
- **Stop frequently** for human review (every 2-4 steps)
- **Branch stays local** until Act phase completion

---

## TypeScript & Type Safety

### Rules

- **Strict Mode:** All code must pass strict TypeScript checking
- **No `any` types:** Use `unknown` or proper types instead
- **Interface over Type:** Prefer `interface` for object shapes, `type` for unions/intersections
- **Explicit Return Types:** Always define return types for exported functions
- **Prefer Enum on explicit type:** prefer Enum then export type x = "value" | "otherValue".
Make the logs and errors indicative if there is an error you want to log make sure to use the right level exmaple: console.error for error, console.log for logs...



### Rules

- **Functional Components Only:** No class components
- **Props Interface Naming:** Always `{ComponentName}Props`
- **Component Organization:** Props interface → Component → Export
- **Destructure Props:** Always destructure props in function signature
- **Event Handlers:** Name as `handle{Action}` (e.g., `handleClick`, `handleSubmit`)
- **Memoization:** Use `React.memo()` for expensive list items only when needed