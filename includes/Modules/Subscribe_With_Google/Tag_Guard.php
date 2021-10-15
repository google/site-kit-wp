<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the Subscribe_With_Google tag guard.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		// Do not allow Subscribe_With_Google tags on 404 pages.
		if ( is_404() ) {
			return false;
		}

		// Only allow Subscribe_With_Google tags on single Post pages.
		if ( ! is_single() ) {
			return false;
		}

		// Only allow Subscribe_With_Google tags if product ID is defined.
		$settings = $this->settings->get();
		return ! empty( $settings['publicationID'] );
	}

}
