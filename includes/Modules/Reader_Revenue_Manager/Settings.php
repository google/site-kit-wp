<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for RRM settings.
 *
 * @since 1.132.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface, Setting_With_ViewOnly_Keys_Interface {

	use Setting_With_Owned_Keys_Trait;
	use Method_Proxy_Trait;

	const OPTION = 'googlesitekit_reader-revenue-manager_settings';

	/**
	 * Various Reader Revenue Manager onboarding statuses.
	 */
	const ONBOARDING_STATE_UNSPECIFIED          = 'ONBOARDING_STATE_UNSPECIFIED';
	const ONBOARDING_STATE_ACTION_REQUIRED      = 'ONBOARDING_ACTION_REQUIRED';
	const ONBOARDING_STATE_PENDING_VERIFICATION = 'PENDING_VERIFICATION';
	const ONBOARDING_STATE_COMPLETE             = 'ONBOARDING_COMPLETE';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.132.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.132.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array( 'publicationID' );
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.132.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'                           => 0,
			'publicationID'                     => '',
			'publicationOnboardingState'        => '',
			'publicationOnboardingStateChanged' => false,
		);
	}

	/**
	 * Returns keys for view-only settings.
	 *
	 * @since 1.132.0
	 *
	 * @return array An array of keys for view-only settings.
	 */
	public function get_view_only_keys() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.132.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function ( $option ) {
			if ( isset( $option['publicationID'] ) ) {
				if ( ! preg_match( '/^[a-zA-Z0-9_-]+$/', $option['publicationID'] ) ) {
					$option['publicationID'] = '';
				}
			}

			if ( isset( $option['publicationOnboardingStateChanged'] ) ) {
				if ( ! is_bool( $option['publicationOnboardingStateChanged'] ) ) {
					$option['publicationOnboardingStateChanged'] = false;
				}
			}

			if ( isset( $option['publicationOnboardingState'] ) ) {
				$valid_onboarding_states = array(
					self::ONBOARDING_STATE_UNSPECIFIED,
					self::ONBOARDING_STATE_ACTION_REQUIRED,
					self::ONBOARDING_STATE_PENDING_VERIFICATION,
					self::ONBOARDING_STATE_COMPLETE,
				);

				if ( ! in_array( $option['publicationOnboardingState'], $valid_onboarding_states, true ) ) {
					$option['publicationOnboardingState'] = '';
				}
			}

			return $option;
		};
	}
}
