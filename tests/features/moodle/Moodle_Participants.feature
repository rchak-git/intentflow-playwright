Feature: Moodle Course Participant Table Verification


  Background:
    Given the user is logged into Moodle
    And the user navigates to the Course Participants page for "My first course"

  Scenario: Authenticated user verifies course participants list
    Given the user performs successful login with valid student credentials
    When the user clicks on the "My courses" navigation link
    And the user clicks on the "My first course" link
    And the user clicks the Participants tab
    Then the Participants table should be visible
    And the Participants table should contain "Sam Student"
    And the Participants table should contain "Terri Teacher"

    Scenario: Authenticated user verifies course participants list
    Given the user performs successful login with valid admin credentials
    When the user clicks on the "My courses" navigation link
    And the user clicks on the "My first course" link
    And the user clicks the Participants tab
    Then the Participants table should be visible
    And the Participants table should contain "Sam Student"
    And the Participants table should contain "Terri Teacher"


    Paradigm 1: Full-Table Summary
  Scenario: Verify participants table visibility, row count, and global content
    Then the Participants table should be visible
    And the Participants table should display 2 rows
    And the Participants table should contain "Sam Student"
    And the Participants table should contain "Terri Teacher"

  # Paradigm 2: Cell Text Verification
  Scenario: Assert column values anchored to a specific row
    Then in the Participants table, the row where "First name / Last name" is "Sam Student" should display:
      | Column | Expected Value |
      | Roles  | Student        |
      | Groups | No groups      |
    And in the Participants table, the row where "First name / Last name" is "Terri Teacher" should display:
      | Column | Expected Value |
      | Roles  | Teacher        |
      | Groups | No groups      |

  # Paradigm 3: In-Row Direct Actions
  Scenario: Select a specific participant checkbox and trigger bulk action
    When in the Participants table, the user selects the checkbox for row "Sam Student"
    And the user selects "Send a message" from the "With selected users..." action dropdown
    Then the bulk action confirmation modal should be visible

  # Paradigm 4: Row Data Extraction
  Scenario: Extract row values and store dynamic table state for validation
    When the user captures all row data from the Participants table as "enrolledParticipants"
    Then the captured dataset "enrolledParticipants" should match:
      | First name / Last name | Roles   | Groups    |
      | Sam Student            | Student | No groups |
      | Terri Teacher          | Teacher | No groups |


  # Paradigm 5: Header Select-All & Bulk Action
  Scenario: Select all participants via header checkbox and trigger bulk action
    When in the Participants table, the user selects the header checkbox to select all rows
    And the user selects "Send a message" from the "With selected users..." action dropdown
    Then the bulk action confirmation modal should be visible