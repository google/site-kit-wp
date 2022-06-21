<?php
/**
 * Class Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard
 *
 * @package   Google\Site_Kit\Core\Tags\Guards
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Guards;

use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Guard that verifies if we're in a production environment.
 *
 * @since 1.38.0
 * @access private
 * @ignore
 */
class Tag_Environment_Type_Guard implements Guard_Interface {
	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.38.0
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE.
	 */
	public function can_activate() {
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			return true;
		}

		$allowed_environments = apply_filters(
			'googlesitekit_allowed_tag_environment_types',
			array( 'production' )
		);

		if ( ! is_array( $allowed_environments ) ) {
			$allowed_environments = array( 'production' );
		}

		return in_array( wp_get_environment_type(), $allowed_environments, true );
	}
}
