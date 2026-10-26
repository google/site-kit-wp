<?php
/**
 * Trait Google\Site_Kit\Core\Util\Active_Modules_Option_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Modules\PageSpeed_Insights;

/**
 * Trait for reading the active modules option in migrations.
 *
 * Classes using it need an `$options` property with an `Options` instance.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Active_Modules_Option_Trait {

	/**
	 * Gets the active modules option the same way as `Modules`.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of active module slugs.
	 */
	protected function get_active_modules_option() {
		$option = $this->options->get( Modules::OPTION_ACTIVE_MODULES );

		// Check legacy option.
		if ( ! is_array( $option ) ) {
			$option = $this->options->get( 'googlesitekit-active-modules' );
		}

		// If both options are not arrays, use the default value.
		if ( ! is_array( $option ) ) {
			$option = array( PageSpeed_Insights::MODULE_SLUG );
		}

		return $option;
	}
}
