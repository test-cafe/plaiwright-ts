Feature: Admin Dashboard
  As an admin user
  I want to manage products, categories, and users
  So that the storefront stays up to date

  Background:
    Given I am logged in as an admin user

  Scenario: Admin creates a new product
    When I create a product named "New Test Pizza" in category "Pizza"
    Then the product should appear in the storefront

  Scenario: Admin updates a product
    Given a product "Old Name" exists
    When I update the product name to "New Name"
    Then the product should display as "New Name"

  Scenario: Admin deletes a product
    Given a product "Temp Pizza" exists
    When I delete the product
    Then "Temp Pizza" should no longer appear in the catalog

  Scenario: Non-admin user cannot access dashboard
    Given I am logged in as a regular user
    When I navigate to "/dashboard"
    Then I should be redirected or see a 403 error

  Scenario: Unauthenticated user cannot access dashboard
    Given I am not logged in
    When I navigate to "/dashboard"
    Then I should be redirected to the login page

  Scenario Outline: Admin CRUD for catalog entities
    When I create a <entity> named "<name>"
    Then it should appear in the <entity> list

    Examples:
      | entity     | name            |
      | category   | Test Category   |
      | ingredient | Test Ingredient |
      | product    | Test Product    |
