Feature: MHE Course Dashboard Navigation

  Scenario: Navigate to Assignments page from Course Dashboard
    Given the user is on the Course Dashboard page
    When the user clicks the "Assignments" tab on the course navigation bar
    Then the "+ Create Assignment" button should be visible