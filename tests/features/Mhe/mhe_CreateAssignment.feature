Feature: MHE Assignment Creation Lifecycle
  As an MHE Course Administrator
  I want to create and publish a new assignment from the Assignments Directory
  So that students can access and complete the assignment in the course

  Background:
    Given the admin user is logged into the MHE platform
    And the user opens the course "Project Assignment flow" from the Home Directory
    And the user navigates to the "Assignments" tab on the Course Dashboard

  @smoke @assignment-creation
  Scenario Outline: Create and verify a new assignment in the Assignments Directory
    When the user clicks the "Create Assignment" button on the Assignments Directory
    And the user selects "<assignmentType>" as the assignment type
    And the user enters "<assignmentTitle>" as the assignment title
    And the user configures the assignment settings with "<maxPoints>" points and due date "<dueDate>"
    And the user adds content or questions to the assignment if required
    And the user clicks the "Assign" or "Save & Publish" button
    Then the user should be redirected back to the Assignments Directory
    And the newly created assignment "<assignmentTitle>" should be visible in the assignments list with status "<expectedStatus>"

    Examples:
      | assignmentType | assignmentTitle              | maxPoints | dueDate    | expectedStatus |
      | Question Bank  | Auto_Assignment_QB_001       | 100       | 12/31/2026 | Assigned       |


     Background:
    Given the Instructor has logged into MHE and navigated to the Course Dashboard

  Scenario: Instructor creates assignments inside and outside the 7-day upcoming window
    Given the Instructor is on the Course Dashboard page
    When the Instructor clicks the "Assignments" tab on the course navigation bar
    Then the "+ Create Assignment" button should be visible
    When the Instructor creates and publishes an assignment "Upcoming_Within_7Days" due in 3 days
    And the Instructor creates and publishes an assignment "Future_Beyond_7Days" due in 14 days
    Then both assignments should be listed on the Instructor Assignments page

  Scenario: Student views only assignments due within the next 7 days on the Dashboard
    Given the Student launches the MHE Delivery Player from Canvas
    When the Student navigates to the Course Dashboard page
    Then the "Upcoming Assignments" section should be visible
    And the "Upcoming Assignments" list should contain "Upcoming_Within_7Days"
    And the "Upcoming Assignments" list should not contain "Future_Beyond_7Days" 