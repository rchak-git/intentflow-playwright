Feature: MHE Application Login
  As an authorized user of the MHE Delivery Player
  I want to log into the application using valid credentials
  So that I can access my course directory and dashboard

  @mhe @login @smoke
  Scenario: Successfully log into MHE Delivery Player with valid credentials
    Given the user opens the MHE Delivery Player login page
    When the user enters the username "admin_one" into the username field
    And the user enters the password "P@ssw0rd" into the password field
    And the user clicks the login button
    Then the user should be redirected to the Home directory page