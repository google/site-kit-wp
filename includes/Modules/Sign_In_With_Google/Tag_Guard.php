<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the Sign in with Google tag guard.
 *
 * @since 1.159.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {
	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.159.0
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$settings = $this->settings->get();

		// If there's no client ID available, don't render the button.
		if ( ! $settings['clientID'] ) {
			return false;
		}

		// If the site does not use https, don't render the button.
		if ( substr( wp_login_url(), 0, 5 ) !== 'https' ) {
			return false;
		}

		return true;
	}
}
