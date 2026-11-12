Feature: Moodle User Authentication
  As a registered Moodle student or educator
  I want to log in using valid credentials or guest access
  So that I can access my online courses and dashboard

  Background:
    Given the user navigates to the Moodle Login page

  # ---------------------------------------------------------------------------
  # POSITIVE AUTHENTICATION
  # ---------------------------------------------------------------------------

  Scenario: Successful login with valid student credentials
  When the user enters "student" into the Username field
  And the user enters "sandbox24" into the Password field
  And the user clicks the Log in button
  Then the current page URL should contain "moodledemo"
  And the page header should display "Moodle 5.3 sandbox demo"


  
  Scenario: Successful login using Guest Access
    When the user clicks the Log in as guest button
    Then the user should be logged in as a guest
    And the user navigation bar should display "sandbox"

  # ---------------------------------------------------------------------------
  # NEGATIVE & VALIDATION CASES
  # ---------------------------------------------------------------------------

  Scenario: Unsuccessful login with invalid password
    When the user enters "student" into the Username field
    And the user enters "WrongPassword123!" into the Password field
    And the user clicks the Log in button
    Then an error notification "Your login info may be incorrect. Please try again." should be displayed
    And the user should remain on the Moodle Login page

  Scenario: Unsuccessful login with non-existent username
    When the user enters "fake_user_99" into the Username field
    And the user enters "sandbox24" into the Password field
    And the user clicks the Log in button
    Then an error notification "Invalid login, please try again" should be displayed

  Scenario: Validation error when submitting empty login form
    When the user clicks the Log in button
    Then the Username input field should show validation error "Required"
    And the user should remain on the Moodle Login page

  # ---------------------------------------------------------------------------
  # INTERACTIVE UI CONTROLS & NAVIGATION
  # ---------------------------------------------------------------------------

  Scenario: Toggle password mask visibility
    When the user enters "secret_pass_123" into the Password field
    Then the Password field input type should be "password"
    When the user clicks the Toggle sensitive button
    Then the Password field input type should be "text"
    When the user clicks the Toggle sensitive button
    Then the Password field input type should be "password"

  Scenario: Navigate to Password Recovery page
    When the user clicks the Forgot password? link
    Then the user should be redirected to the Forgot Password recovery page
    And the page header should display "Reset password"

    Invalid Scenario :
    Scenario: Remember me login preferences
     When the user enters "student" into the Username field
     And the user enters "sandbox24" into the Password field
     And the user checks the "Remember username" checkbox
     And the user clicks the Log in button
     Then the user should be logged in as a student