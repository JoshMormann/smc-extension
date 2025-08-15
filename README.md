# ⚠️ SMC Extension - DISCONTINUED PROJECT

## 🛑 **DO NOT USE THIS EXTENSION**

This Chrome extension project has been **permanently discontinued** and should **NOT** be used in its intended context.

### ❌ Why This Project Was Terminated

**Primary Reason: Terms of Service Violation**
- MidJourney's Terms of Service prohibit automation
- Using this extension could result in **account suspension**
- **Risk is not worth the convenience**

**Technical Challenges:**
- MidJourney uses dynamic React DOM that constantly recreates elements
- Complex state management required for simple data extraction
- Browser extension approach was overcomplicated for the core need

---

## 🎓 **Educational Value**

While this project failed in its intended purpose, it contains valuable learning material for:

### Chrome Extension Development
- Manifest V3 patterns and gotchas
- Content script architecture decisions
- Build system trade-offs (CRXJS vs TypeScript)
- DOM manipulation in dynamic React applications

### Key Technical Insights
- **DOM Attributes > JavaScript State** for dynamic apps
- **Simple Solutions > Complex Architecture** for data extraction
- **Platform Policy Research** is critical before building automation
- **MutationObserver throttling** for performance in dynamic DOMs

**👉 See [`LESSONS_LEARNED.md`](./LESSONS_LEARNED.md) for detailed technical insights**

---

## 📂 **Code Available for Reference**

Feel free to explore and adapt any code that might be useful for **legitimate, platform-approved projects**:

### Useful Components
- **Content Script Patterns** (`src/content-bundle.ts`)
- **Chrome Extension Manifest** (`manifest.json`) 
- **Simple TypeScript Build Setup** (`package.json`, `tsconfig.json`)
- **DOM Scanning Techniques** (educational purposes only)

### Working Features (Before Termination)
- ✅ SREF code extraction from button text
- ✅ DOM attribute-based state management  
- ✅ Viewport-based processing
- ✅ Mock data testing system

---

## ⚖️ **Legal and Ethical Notice**

### 🚫 **What NOT to Do**
- Do not use this code against MidJourney or similar platforms
- Do not ignore platform Terms of Service
- Do not assume automation is allowed without explicit permission

### ✅ **Acceptable Use**
- Study the code for educational purposes
- Adapt patterns for your own approved projects
- Learn from the architectural decisions and mistakes
- Use as reference for Chrome extension development

---

## 🏗️ **Project Structure**

```
├── src/
│   ├── content-bundle.ts    # Main content script (bundled approach)
│   ├── content.ts          # Modular content script (didn't work)
│   └── sref-scanner.ts     # SREF detection logic
├── dist/                   # Built extension files
├── icons/                  # Extension icons
├── manifest.json           # Chrome extension manifest
├── popup.html             # Extension popup UI
├── LESSONS_LEARNED.md     # Detailed technical insights
└── CLAUDE.md              # Development context and history
```

---

## 🔄 **Alternative Approaches**

Instead of browser automation, consider:

1. **Manual Collection**: Copy SREF codes by hand (safer, platform-compliant)
2. **Official APIs**: Use platform-provided APIs when available
3. **Different Platforms**: Find platforms that explicitly allow automation
4. **Simple Bookmarklets**: Less invasive than full extensions (still check ToS)

---

## 🤝 **Contributing**

This project is **not accepting contributions** as it's discontinued for policy reasons.

However, if you found value in the code patterns or want to discuss the technical approaches, feel free to:
- Reference the code in your own projects
- Share learnings with the community
- Improve upon the patterns for legitimate use cases

---

## 📜 **License**

This code is provided as-is for educational purposes. 

**USE AT YOUR OWN RISK** - The authors are not responsible for any policy violations, account suspensions, or other consequences of using this code.

---

## 🎯 **Key Takeaway**

> **Always research platform policies before building automation tools.** 
> 
> A perfectly working technical solution is worthless if it violates the platform's Terms of Service.

**Better to discover policy constraints early than after weeks of development.**