# JQL Snippets

## NEXT Scope

```jql
project = LMSMMA AND fixVersion = "NEXT"
```

## Ready For Release From NEXT

```jql
project = LMSMMA AND status = "Ready for Release" AND fixVersion = "NEXT"
```

## Version Scope

```jql
project = LMSMMA AND fixVersion = "VERSION_NAME" ORDER BY issuetype, key
```

## Open Bugs For Version

```jql
project = LMSMMA AND issuetype = Bug AND fixVersion = "VERSION_NAME" AND statusCategory != Done ORDER BY priority DESC, key
```

## Recently Released

```jql
project = LMSMMA AND fixVersion = "VERSION_NAME" AND status = Released ORDER BY key
```

