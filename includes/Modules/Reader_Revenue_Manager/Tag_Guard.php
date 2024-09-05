<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the Reader Revenue Manager tag guard.
 *
 * @since 1.132.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.132.0
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$settings = $this->settings->get();
		return ! empty( $settings['publicationID'] );
	}
}
