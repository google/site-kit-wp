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
 * Tag guard class for the AdSense module that blocks the tag placement if it is disabled for a certain user group.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
class Auto_Ad_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.39.0
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE.
	 */
	public function can_activate() {
		$settings = $this->settings->get();
		if ( ! isset( $settings['autoAdsDisabled'] ) ) {
			return true;
		}

		if (
			( in_array( 'loggedinUsers', $settings['autoAdsDisabled'], true ) && is_user_logged_in() ) ||
			( in_array( 'contentCreators', $settings['autoAdsDisabled'], true ) && current_user_can( 'edit_posts' ) )
		) {
			return false;
		}

		return true;
	}
}
