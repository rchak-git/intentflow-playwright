Feature: Moodle student online-text assignment submission
  # These scenarios are sequential phases of one workflow, not independent tests.
  # Saving should submit directly; verify this with the configured assignment.
  # Cleanup should be attempted even if the workflow fails, and must only affect
  # resources created by the current run.

  Scenario: Teacher creates a temporary assignment
    Given the teacher and student are logged in using separate sessions
    And both have access to the sandbox course
    When the teacher creates a uniquely named online-text assignment
    And sets "Require students to click the submit button" to "No"
    And the assignment is open for submissions
    Then the assignment should be available to the student

  Scenario: Student submits online text
    Given the student opens the assignment created in this workflow
    And no submission exists for the student
    When the student enters and saves "IntentFlow pilot test submission"
    Then the submitted text should be visible
    And the submission status should be "Submitted for grading"
    When the test submission is removed
    Then no submission should exist for the student
