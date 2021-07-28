<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Auto_Ad_Guard
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the AdSense tag guard.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Auto_Ad_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$settings = $this->settings->get();

		if (
			( isset( $settings['autoAdsDisabled'] ) && in_array( 'loggedinUsers', $settings['autoAdsDisabled'], true ) && is_user_logged_in() ) ||
			( isset( $settings['autoAdsDisabled'] ) && in_array( 'contentCreators', $settings['autoAdsDisabled'], true ) && current_user_can( 'edit_posts' ) )
		) {
			return false;
		}

		return true;
	}

}
