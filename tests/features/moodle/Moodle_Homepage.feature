Feature: Moodle Home Page User Interactions

  Scenario: Authenticated user logs out via User Menu
    Given the user performs successful login with valid student credentials
    When the user clicks the User menu button
    And the user clicks the Log out link
    Then the Log in button should be visible
    And the page header should display "Moodle 5.3 sandbox demo"

  Scenario: Navigate to My Courses page
    When the user clicks on the "My courses" navigation link
    Then the user should be redirected to the "My courses" page

  Scenario: Navigate to Grades page via User Menu
    When the user clicks on the User Menu button
    And the user clicks on the "Grades" menu item link
    Then the user should be redirected to the User Gradebook page