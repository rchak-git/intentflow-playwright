Feature: Angular Material Table Control Validation

  Scenario: Verify element details in Angular Material periodic table
    Given the user is on the Angular Material Table Overview page
    Then the weight for element "Lithium" should be "6.941"
    And the symbol for element position "1" should be "H"


  Scenario: Verify vehicle details in AG Grid div-based table
    Given the user is on the AG Grid JavaScript Data Grid demo page
    Then the model for vehicle make "Tesla" should be "Model Y"
    And the price for vehicle make "Tesla" should be "64950"
    And the model for vehicle make "Ford" should be "F-Series"


    Feature: State Selection via Custom Dropdown

  Scenario: Verify and interact with state custom select control
    Given I navigate to the user profile page
    
    # 1. Action subIntent: open (Expands panel explicitly without picking a value)
    When I open the state select dropdown
    
    # 2. Verify subIntent: optionsContains (Inspects presence of specific options in the overlay)
    Then I verify the state select dropdown options contain "Texas"
    And I verify the state select dropdown options contain "California"
    
    # 3. Action subIntent: close (Dismisses overlay using Escape/backdrop tap)
    When I close the state select dropdown
    
    # 4. Populate verb (Triggers click -> waits overlay -> selects option)
    And I select "Texas" from the state select dropdown
    
    # 5. Verify verb: equals / default (Asserts selected display text on trigger)
    Then I verify the state select dropdown displays "Texas"
    
    # 6. Verify subIntent: state (Asserts UI state of control)
    And I verify the state select dropdown is enabled