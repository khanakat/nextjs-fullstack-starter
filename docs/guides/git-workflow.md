# 🌿 Git Workflow & Conventions

Comprehensive guide for **Git best practices**, **branch management**, and **collaboration workflows** for the Next.js Fullstack Starter project.

## 🎯 Overview

This document establishes consistent Git practices to ensure:
- **Clean commit history** and meaningful messages  
- **Organized branch management** for parallel development
- **Efficient collaboration** with clear workflows
- **Safe deployments** with proper testing and reviews

---

## 📋 Commit Message Conventions

We follow **Conventional Commits** specification for consistent, automated changelog generation.

### **Format**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### **Types**

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OAuth integration` |
| `fix` | Bug fix | `fix(api): resolve user validation error` |
| `docs` | Documentation | `docs(readme): update installation guide` |
| `style` | Code formatting | `style(components): fix indentation` |
| `refactor` | Code refactoring | `refactor(utils): optimize database queries` |
| `perf` | Performance improvement | `perf(images): implement lazy loading` |
| `test` | Adding/updating tests | `test(auth): add login validation tests` |
| `build` | Build system changes | `build(docker): update node version` |
| `ci` | CI/CD changes | `ci(github): add automated testing` |
| `chore` | Maintenance | `chore(deps): update dependencies` |

### **Scopes (Optional)**
Common scopes for this project:
- `auth` - Authentication system
- `api` - API routes and endpoints  
- `ui` - UI components and styling
- `db` - Database and schema changes
- `email` - Email system and templates
- `upload` - File upload functionality
- `payment` - Payment/subscription system
- `seo` - SEO and metadata
- `docs` - Documentation

### **Examples**
```bash
# Good commit messages
feat(auth): implement social login with Google OAuth
fix(api/posts): resolve pagination offset calculation
docs(guides): add Git workflow documentation
refactor(components): extract reusable card component
perf(db): add database indexing for user queries

# Bad commit messages  
fix stuff
update files
WIP
minor changes
```

---

## 🌳 Branching Strategy

We use **GitHub Flow** with feature branches for simplicity and continuous deployment.

### **Branch Types**

#### **Main Branch (`main`)**
- **Always deployable** production-ready code
- **Protected** - requires PR reviews
- **Auto-deploys** to production (Vercel)
- **No direct commits** allowed

#### **Feature Branches (`feature/*`)**
```bash
feature/auth-oauth-integration
feature/user-dashboard-redesign  
feature/email-template-system
```

#### **Bug Fix Branches (`fix/*`)**
```bash
fix/user-validation-error
fix/payment-webhook-timeout
fix/mobile-responsive-navbar
```

#### **Documentation Branches (`docs/*`)**
```bash
docs/api-documentation
docs/deployment-guide
docs/git-workflow-guide
```

#### **Chore Branches (`chore/*`)**
```bash
chore/dependency-updates
chore/github-actions-setup
chore/docker-configuration
```

### **Branch Naming Conventions**
- Use **lowercase with hyphens**
- Include **type prefix** (`feature/`, `fix/`, `docs/`, `chore/`)
- Be **descriptive but concise**
- Use **present tense verbs**

---

## 🔄 Development Workflow

### **1. Starting New Work**

```bash
# 1. Sync with latest main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/user-profile-settings

# 3. Work on your feature
# ... make changes ...

# 4. Stage and commit changes
git add .
git commit -m "feat(profile): add user settings page with form validation"
```

### **2. During Development**

```bash
# Make atomic commits with clear messages
git add src/components/ProfileForm.tsx
git commit -m "feat(profile): create profile form component"

git add src/lib/validations.ts  
git commit -m "feat(profile): add profile validation schema"

git add src/app/profile/page.tsx
git commit -m "feat(profile): implement profile settings page"

# Sync with main regularly to avoid conflicts
git fetch origin
git rebase origin/main
```

### **3. Preparing for Review**

```bash
# 1. Ensure your branch is up to date
git fetch origin
git rebase origin/main

# 2. Run tests and linting
npm run test
npm run lint
npm run type-check

# 3. Push your branch
git push origin feature/user-profile-settings

# 4. Create Pull Request on GitHub
```

### **4. Code Review Process**

#### **Pull Request Requirements**
- [ ] **Descriptive title** following commit conventions
- [ ] **Clear description** of changes and motivation
- [ ] **Screenshots** for UI changes
- [ ] **Test coverage** for new features
- [ ] **Documentation** updates if needed
- [ ] **Breaking changes** clearly marked

#### **Review Checklist**
- [ ] Code follows project conventions
- [ ] Tests pass and cover new functionality  
- [ ] No console errors or warnings
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Documentation updated

### **5. Merging Strategy**

```bash
# Use "Squash and Merge" for clean history
# GitHub will combine commits into single commit
# Maintain conventional commit format in merge message

# Example merge commit:
feat(profile): implement user profile settings (#123)

* Add profile form component with validation
* Create profile settings page  
* Add profile update API endpoint
* Update navigation to include profile link
```

---

## 🔒 Branch Protection Rules

### **Main Branch Protection**
- ✅ **Require pull request reviews** (min 1 reviewer)
- ✅ **Dismiss stale reviews** when new commits pushed
- ✅ **Require status checks** (CI/CD pipeline)
- ✅ **Require branches to be up to date**
- ✅ **Restrict pushes** that create merge commits
- ✅ **Require linear history** (squash merges only)

### **Required Status Checks**
- ✅ **Build success** (`npm run build`)
- ✅ **Tests pass** (`npm run test`)
- ✅ **Linting pass** (`npm run lint`)
- ✅ **Type checking** (`npm run type-check`)

---

## 🚀 Release Management

### **Semantic Versioning**
We follow [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR** (`1.0.0 → 2.0.0`): Breaking changes
- **MINOR** (`1.0.0 → 1.1.0`): New features (backward compatible)  
- **PATCH** (`1.0.0 → 1.0.1`): Bug fixes (backward compatible)

### **Release Process**

```bash
# 1. Create release branch from main
git checkout -b release/v1.2.0

# 2. Update version in package.json
npm version minor --no-git-tag-version

# 3. Update CHANGELOG.md with release notes
# 4. Commit version changes
git add .
git commit -m "chore(release): bump version to 1.2.0"

# 5. Create PR to main
# 6. After merge, create GitHub release with tag
```

### **Changelog Generation**
Use conventional commits to auto-generate changelogs:

```bash
# Install conventional changelog
npm install -g conventional-changelog-cli

# Generate changelog
conventional-changelog -p angular -i CHANGELOG.md -s
```

---

## 🔧 Git Configuration

### **Required Git Setup**
```bash
# Set user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Enable autoCRLF handling (Windows)
git config --global core.autocrlf input

# Set default branch name
git config --global init.defaultBranch main

# Enable rerere (reuse recorded resolution)
git config --global rerere.enabled true
```

### **Recommended Aliases**
```bash
# Add useful aliases
git config --global alias.co checkout
git config --global alias.br branch  
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# Advanced aliases
git config --global alias.lg "log --oneline --decorate --graph --all"
git config --global alias.cleanup "branch --merged main | grep -v main | xargs -n 1 git branch -d"
```

---

## 🛠️ Development Tools Integration

### **VS Code Extensions**
Recommended extensions for Git workflow:
- **GitLens** - Enhanced Git capabilities
- **Git Graph** - Visualize branch history
- **Conventional Commits** - Commit message help
- **GitHub Pull Requests** - PR management

### **Pre-commit Hooks**
Setup Husky for automated checks:

```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# Setup commit-msg hook for conventional commits
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### **Commitlint Configuration**
Add to `commitlint.config.js`:
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'auth', 'api', 'ui', 'db', 'email', 
      'upload', 'payment', 'seo', 'docs'
    ]]
  }
};
```

---

## 🚨 Common Issues & Solutions

### **Merge Conflicts**
```bash
# 1. Fetch latest changes
git fetch origin

# 2. Rebase your branch
git rebase origin/main

# 3. Resolve conflicts in files
# Edit conflicted files manually

# 4. Stage resolved files  
git add .

# 5. Continue rebase
git rebase --continue

# 6. Force push (if already pushed)
git push --force-with-lease origin your-branch
```

### **Accidental Commits to Main**
```bash
# 1. Create branch from current position
git branch feature/accidental-work

# 2. Reset main to origin
git reset --hard origin/main

# 3. Switch to feature branch
git checkout feature/accidental-work

# 4. Continue work and create PR
```

### **Large Files**
Use Git LFS for files > 50MB:
```bash
# Install Git LFS
git lfs install

# Track large file types
git lfs track "*.pdf"
git lfs track "*.zip"

# Add .gitattributes  
git add .gitattributes
git commit -m "chore(git): setup Git LFS for large files"
```

---

## 📊 Monitoring & Analytics

### **Branch Health Metrics**
Monitor these indicators:
- **Average PR review time** (target: < 24 hours)
- **Time to merge** (target: < 3 days)
- **Failed builds** (target: < 5%)
- **Open PR count** (target: < 10)

### **Code Quality Gates**
Automated checks for each PR:
- ✅ **Test coverage** > 80%
- ✅ **No ESLint errors**
- ✅ **No TypeScript errors**  
- ✅ **Build succeeds**
- ✅ **Bundle size** within limits

---

## 🎯 Best Practices Summary

### **✅ Do's**
- ✅ Write **clear, descriptive** commit messages
- ✅ Make **atomic commits** (one logical change per commit)
- ✅ **Rebase frequently** to stay current with main
- ✅ **Test thoroughly** before creating PRs
- ✅ **Review others' code** constructively and promptly
- ✅ **Keep PRs small** and focused (< 400 lines)
- ✅ **Update documentation** with code changes

### **❌ Don'ts**
- ❌ **Never commit** directly to main
- ❌ **Don't push** untested code
- ❌ **Avoid large PRs** (> 1000 lines)
- ❌ **Don't ignore** CI/CD failures
- ❌ **Never force push** to shared branches (except with `--force-with-lease`)
- ❌ **Don't commit** sensitive data (API keys, passwords)
- ❌ **Avoid generic** commit messages ("fix", "update")

---

## 🔗 Additional Resources

- **[Conventional Commits](https://www.conventionalcommits.org/)** - Commit message specification
- **[GitHub Flow](https://guides.github.com/introduction/flow/)** - Branching strategy guide  
- **[Semantic Versioning](https://semver.org/)** - Version numbering guide
- **[Git Best Practices](https://git-scm.com/book)** - Official Git documentation
- **[GitLens Documentation](https://gitlens.amod.io/)** - VS Code Git extension

---

**Next Steps**: [Authentication Guide →](./authentication.md)