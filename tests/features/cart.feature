Feature: Shopping Cart
  As a user (guest or registered)
  I want to manage items in my shopping cart
  So that I can proceed to checkout with my chosen pizzas

  Background:
    Given the product catalog is seeded with pizzas and ingredients

  Scenario: Guest user adds a pizza to the cart
    Given I am an anonymous user with a cart token
    When I add "Pepperoni" size "Large" type "Traditional" to the cart
    Then the cart should contain 1 item
    And the cart total should be greater than 0

  Scenario: Adding the same pizza twice increments quantity
    Given I am an anonymous user with a cart token
    And I have "Margherita" size "Medium" type "Traditional" in my cart
    When I add "Margherita" size "Medium" type "Traditional" to the cart again
    Then the cart should contain 1 item with quantity 2

  Scenario: Removing an item empties the cart
    Given I am an anonymous user with a cart token
    And I have 1 item in my cart
    When I remove the item from the cart
    Then the cart should be empty

  Scenario: Cart persists across page navigations (cookie token)
    Given I am an anonymous user with a cart token
    And I have "Pepperoni" in my cart
    When I navigate away and return to the cart
    Then the cart should still contain "Pepperoni"

  Scenario: Mobile client uses x-cart-token header
    Given I am a mobile client with a cart token in the header
    When I fetch my cart
    Then the response should return my cart items

  Scenario Outline: Price calculation with ingredients
    Given a product item priced at <base_price> cents
    And I add <ingredient_count> ingredient(s) each costing <ingredient_price>
    And quantity is <quantity>
    Then the item total should be <expected_total>

    Examples:
      | base_price | ingredient_price | ingredient_count | quantity | expected_total |
      | 599        | 100              | 1                | 1        | 699            |
      | 899        | 0                | 0                | 2        | 1798           |
      | 1199       | 80               | 2                | 1        | 1359           |
      | 599        | 100              | 2                | 3        | 2397           |
