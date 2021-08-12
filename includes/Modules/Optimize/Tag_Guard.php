<?php
/**
 * Class Google\Site_Kit\Modules\Optimize\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Optimize
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Optimize;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Tag guard class for the Optimize module that blocks the tag placement if it is disabled.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.39.0
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE.
	 */
	public function can_activate() {
		$settings = $this->settings->get();

		if ( ! isset( $settings['placeAntiFlickerSnippet'] ) ) {
			return false;
		}

		return $settings['placeAntiFlickerSnippet'];
	}

}
