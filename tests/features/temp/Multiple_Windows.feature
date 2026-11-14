Feature: Herokuapp Multiple Windows Multi-Tab Navigation

  Scenario: Open a new browser tab, verify its content, and return to the main tab
    Given I navigate to "https://the-internet.herokuapp.com/windows"
    Then I verify "Opening a new window" header is visible on the parent window
    When I click the "Click Here" link to open a new browser tab
    And I switch to the newly opened browser tab
    Then I verify "New Window" header is visible on the child tab
    When I switch back to the "main" browser tab
    Then I verify "Opening a new window" header is visible on the parent window