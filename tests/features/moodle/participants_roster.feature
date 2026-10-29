Feature: Moodle Participants Roster Verification
  As a course instructor or admin
  I want to view the course participants table
  So that I can verify user roles and enrollment details

  @moodle @roster
  Scenario: Verify Sam Student data integrity in participants table
    Given the user opens the participants page
    When the user inspects the participants table
    Then the user "Sam Student" should have email "student@moodle.a" in the table