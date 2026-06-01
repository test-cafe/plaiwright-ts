Feature: User Authentication
  As a visitor
  I want to register and sign in
  So that I can place orders and manage my account

  Scenario: Successful user registration
    Given no user exists with email "newuser@test.com"
    When I register with email "newuser@test.com" and password "ValidPass123!" and name "New User"
    Then a new user should be created in the database
    And a verification email should be sent

  Scenario Outline: Registration validation
    When I register with email "<email>" and password "<password>" and name "<name>"
    Then registration should fail with error containing "<error>"

    Examples:
      | email         | password      | name      | error        |
      | bad-email     | ValidPass123! | Test User | email        |
      | a@test.com    | 123           | Test User | password     |
      | dup@test.com  | ValidPass123! | Test User | already      |

  Scenario: Email verification with valid code
    Given a user exists with a valid verification code
    When I submit the correct verification code
    Then the user should be marked as verified

  Scenario: Email verification with expired code
    Given a user exists with an expired verification code
    When I submit the verification code
    Then verification should fail

  Scenario: Login with valid credentials
    Given a verified user exists with email "user@test.com" and password "ValidPass123!"
    When I sign in with email "user@test.com" and password "ValidPass123!"
    Then I should receive a valid session

  Scenario: Login with wrong password
    Given a verified user exists with email "user@test.com" and password "ValidPass123!"
    When I sign in with email "user@test.com" and password "WrongPassword!"
    Then authentication should fail

  Scenario: OAuth creates new user on first login
    Given no user exists with email "oauth@gmail.com"
    When I sign in with Google as "oauth@gmail.com"
    Then a new user should be created with provider "google"

  Scenario: OAuth updates provider on existing user
    Given a user exists with email "oauth@gmail.com" without a provider
    When I sign in with Google as "oauth@gmail.com"
    Then the user's provider should be updated to "google"
