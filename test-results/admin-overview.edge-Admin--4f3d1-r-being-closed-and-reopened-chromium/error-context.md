# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin/overview.edge.spec.ts >> Admin Overview — Edge Cases >> Filters panel should open correctly after being closed and reopened
- Location: tests/admin/overview.edge.spec.ts:106:7

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e7]:
      - heading "QuickTicketAI" [level=1] [ref=e10]
      - generic [ref=e12]:
        - img "Team" [ref=e14]
        - generic [ref=e15]:
          - paragraph [ref=e16]: Team
          - paragraph [ref=e17]: 1 members
      - generic [ref=e20]: MAIN MENU
      - list [ref=e24]:
        - listitem [ref=e25]:
          - button "Overview" [ref=e26] [cursor=pointer]:
            - generic [ref=e27]:
              - img [ref=e28]
              - generic [ref=e31]: Overview
        - listitem [ref=e32]:
          - button "QuickClerk" [ref=e33] [cursor=pointer]:
            - generic [ref=e34]:
              - img [ref=e35]
              - generic [ref=e39]: QuickClerk
        - listitem [ref=e40]:
          - button "Projects" [ref=e41] [cursor=pointer]:
            - generic [ref=e42]:
              - img [ref=e43]
              - generic [ref=e47]: Projects
        - listitem [ref=e48]:
          - button "Invoices" [ref=e49] [cursor=pointer]:
            - generic [ref=e50]:
              - img [ref=e51]
              - generic [ref=e54]: Invoices
        - listitem [ref=e55]:
          - button "Job Tickets" [ref=e56] [cursor=pointer]:
            - generic [ref=e57]:
              - img [ref=e58]
              - generic [ref=e62]: Job Tickets
        - listitem [ref=e63]:
          - button "Customers" [ref=e64] [cursor=pointer]:
            - generic [ref=e65]:
              - img [ref=e66]
              - generic [ref=e70]: Customers
        - listitem [ref=e71]:
          - button "Inventory" [ref=e72] [cursor=pointer]:
            - generic [ref=e73]:
              - img [ref=e74]
              - generic [ref=e79]: Inventory
        - listitem [ref=e80]:
          - button "Templates" [ref=e81] [cursor=pointer]:
            - generic [ref=e82]:
              - img [ref=e83]
              - generic [ref=e86]: Templates
        - listitem [ref=e87]:
          - button "Company Info" [ref=e88] [cursor=pointer]:
            - generic [ref=e89]:
              - img [ref=e90]
              - generic [ref=e93]: Company Info
      - generic [ref=e96] [cursor=pointer]:
        - generic [ref=e98]:
          - paragraph [ref=e99]: coxav22257
          - paragraph [ref=e100]: ADMIN
        - img [ref=e101]
    - main [ref=e103]:
      - generic [ref=e104]:
        - tablist [ref=e107]:
          - tab "Overview" [active] [selected] [ref=e108] [cursor=pointer]
          - tab "Executive" [ref=e109] [cursor=pointer]
          - tab "Operations" [ref=e110] [cursor=pointer]
          - tab "Customer Metrics" [ref=e111] [cursor=pointer]
        - generic [ref=e112]:
          - img [ref=e115] [cursor=pointer]
          - button "English US English US" [ref=e118] [cursor=pointer]:
            - img "English US" [ref=e120]
            - generic [ref=e121]: English US
      - generic [ref=e124]: Failed to load overview statistics
  - region "Notifications (F8)":
    - list
```