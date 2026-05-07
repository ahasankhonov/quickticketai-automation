# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin/projects.negative.spec.ts >> Admin Projects — Negative & Edge Cases >> should keep the project row after cancelling a delete
- Location: tests/admin/projects.negative.spec.ts:98:7

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
        - img "coxav22257" [ref=e14]
        - generic [ref=e15]:
          - paragraph [ref=e16]: coxav22257's Team
          - paragraph [ref=e17]: 20 members
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
        - paragraph [ref=e106]: Projects
        - generic [ref=e107]:
          - img [ref=e110] [cursor=pointer]
          - button "English US English US" [ref=e113] [cursor=pointer]:
            - img "English US" [ref=e115]
            - generic [ref=e116]: English US
      - generic [ref=e118]:
        - generic [ref=e119]:
          - generic [ref=e120]:
            - generic [ref=e122]:
              - generic [ref=e124]: Total Projects
              - img "total_projects_icon" [ref=e126]
            - generic [ref=e127]: "0"
          - generic [ref=e128]:
            - generic [ref=e130]:
              - generic [ref=e132]: Draft Projects
              - img "draft_projects_icon" [ref=e134]
            - generic [ref=e135]: "0"
          - generic [ref=e136]:
            - generic [ref=e138]:
              - generic [ref=e140]: Submitted Projects
              - img "submitted_projects_icon" [ref=e142]
            - generic [ref=e143]: "0"
        - generic [ref=e146]:
          - generic [ref=e147]:
            - generic [ref=e149]:
              - img [ref=e150] [cursor=pointer]
              - textbox "Search..." [ref=e154]
            - generic [ref=e156]:
              - group [ref=e157]:
                - radio "Table view" [checked] [ref=e158]:
                  - img
                - radio "Card view" [ref=e159]:
                  - img
              - button "Add project" [ref=e160] [cursor=pointer]:
                - img [ref=e162]
                - generic [ref=e164]: Add project
          - table [ref=e167]:
            - rowgroup [ref=e168]:
              - row "Project code Project name Created On Created By" [ref=e169]:
                - columnheader "Project code" [ref=e170]
                - columnheader "Project name" [ref=e171]
                - columnheader "Created On" [ref=e172]
                - columnheader "Created By" [ref=e173]
                - columnheader [ref=e174]
            - rowgroup [ref=e175]:
              - row "No projects found" [ref=e176]:
                - cell "No projects found" [ref=e177]
  - region "Notifications (F8)":
    - list
```