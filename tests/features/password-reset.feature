Feature: Password Reset
  As a user who forgot their password
  I want to reset it via email
  So that I can regain access to my account

  Scenario: Request password reset for existing email
    Given a user exists with email "user@test.com"
    When I request a password reset for "user@test.com"
    Then a password reset token should be created
    And a reset email should be sent to "user@test.com"

  Scenario: Request password reset for unknown email
    Given no user exists with email "unknown@test.com"
    When I request a password reset for "unknown@test.com"
    Then no email should be sent
    And the response should not reveal whether the email exists

  Scenario: Reset password with valid token
    Given a valid password reset token exists for "user@test.com"
    When I reset the password using the token with new password "NewPass456!"
    Then the user's password should be updated
    And the reset token should be deleted (single-use)

  Scenario: Reset password with expired token
    Given an expired password reset token exists for "user@test.com"
    When I attempt to reset the password
    Then the reset should fail with an expiry error

  Scenario: Token cannot be used twice
    Given a valid password reset token exists for "user@test.com"
    And I have already used the token to reset the password
    When I try to use the same token again
    Then the reset should fail
