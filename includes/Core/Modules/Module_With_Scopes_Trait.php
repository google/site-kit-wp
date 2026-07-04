<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Trait for a module that requires Google OAuth scopes.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
trait Module_With_Scopes_Trait {

	/**
	 * Registers the hook to add required scopes.
	 *
	 * @since 1.0.0
	 */
	private function register_scopes_hook() {
		add_filter(
			'googlesitekit_auth_scopes',
			function ( array $scopes ) {
				return array_merge( $scopes, $this->get_scopes() );
			}
		);
	}
}
