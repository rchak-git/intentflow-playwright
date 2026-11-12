Feature: MHE Home Directory Navigation

Scenario: Search and navigate to course dashboard from Home Directory
  Given the user is on the MHE Home Directory page
  When the user searches for course "Project Assignment flow"
  And the user opens the course card "Project Assignment flow"
  Then the Course Dashboard page should be displayed for "Project Assignment flow"