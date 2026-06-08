# MMA User Story Template

```markdown
# Title: [Platform: APP, Backend, WEB, ENABLER] [Short action/result title]

### Goal
[Brief explanation of the goal and user value.]

### User Context

**Starting Point:**
- [Where the user begins this flow]

### Design
- **Design Reference**: [Link to Figma, screenshots, or design spec]

### Acceptance Criteria

**[Section: e.g. View Behavior, Map Interactions, Message Blocks]**
- If [condition], then [expected result].
- Show [UI element] with [behavior or rule].
- Display [logic] when [trigger].
- Hide/Disable [component] under [condition].

### Phrase Keys (Localization)
- [screen/component]_[element]_[type]
- general_[shared_element]_[type]
- accessibility_[component]_[action]

### Technical Briefing
- Endpoint references and logic: `GET /actions?location=...`
- Expected backend conditions: flags, timestamps, user states
- Frontend logic: scroll triggers, tab visibility, permissions, offline handling

### Accessibility Requirements
- Dynamic font support up to max system size
- Dark mode and landscape support by default unless overridden
- VoiceOver / TalkBack naming, order, visibility, and grouping
```

## Notes

- Keep acceptance criteria short.
- Use `TBD` when a design, endpoint, or Jira link is unknown.
- Avoid long background sections; put detailed discovery elsewhere.

