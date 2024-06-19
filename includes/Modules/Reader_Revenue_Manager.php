<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;

/**
 * Class representing the Reader Revenue Manager module.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Reader_Revenue_Manager extends Module implements Module_With_Scopes {
	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'reader-revenue-manager';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// TODO: Implement the register() method here in the future.
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
		);
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Reader Revenue Manager', 'Service name', 'google-site-kit' ),
			'description' => __( 'Reader Revenue Manager helps publishers grow, retain, and engage their audiences, creating new revenue opportunities', 'google-site-kit' ),
			'order'       => 5,
			'homepage'    => __( 'https://readerrevenue.withgoogle.com/', 'google-site-kit' ),
		);
	}
}
