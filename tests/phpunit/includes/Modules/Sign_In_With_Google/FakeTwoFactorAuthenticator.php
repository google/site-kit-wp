<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\FakeTwoFactorAuthenticator
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;

/**
 * Authenticator test double that fakes the Two-Factor plugin state, since the
 * plugin isn't installed in the test environment.
 */
class FakeTwoFactorAuthenticator extends Authenticator {

	/**
	 * Whether the Two-Factor plugin counts as active.
	 *
	 * @var bool
	 */
	public $is_two_factor_plugin_active = false;

	/**
	 * IDs of users treated as having two-factor authentication enabled, or
	 * null to defer to the parent implementation.
	 *
	 * @var int[]|null
	 */
	public $user_ids_with_two_factor;

	/**
	 * @inheritDoc
	 */
	protected function is_two_factor_plugin_active(): bool {
		return $this->is_two_factor_plugin_active;
	}

	/**
	 * @inheritDoc
	 */
	protected function user_has_two_factor( int $user_id ): bool {
		if ( ! is_array( $this->user_ids_with_two_factor ) ) {
			return parent::user_has_two_factor( $user_id );
		}

		return in_array( $user_id, $this->user_ids_with_two_factor, true );
	}
}
