Feature: Checkout and Payment
  As a registered user
  I want to complete a purchase
  So that my order is placed and I receive confirmation

  Background:
    Given I am logged in as a registered user
    And I have items in my cart

  Scenario: Successful checkout creates an order
    When I fill in the checkout form with valid details
    And I submit the order
    Then an order should be created with status "PENDING"
    And I should be redirected to the Stripe payment page

  Scenario: Stripe webhook marks order as succeeded
    Given an order exists with status "PENDING"
    When Stripe sends a "checkout.session.completed" webhook for that order
    Then the order status should be updated to "SUCCEEDED"
    And a confirmation email should be sent to the user

  Scenario: Invalid Stripe webhook signature is rejected
    When an invalid webhook request is received
    Then the response status should be 400

  Scenario: Duplicate webhook for same order is handled safely
    Given an order has already been marked as "SUCCEEDED"
    When Stripe sends another "checkout.session.completed" webhook for the same order
    Then no error should occur
    And the order status remains "SUCCEEDED"

  Scenario: Cart is cleared after successful order creation
    Given I have 2 items in my cart
    When I successfully create an order
    Then my cart should be empty
