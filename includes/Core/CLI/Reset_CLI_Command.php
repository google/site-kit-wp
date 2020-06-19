<?php
/**
 * Site Kit Cache CLI Commands
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Util\Reset;

/**
 * Resets Site Kit Settings and Data 
 *
 * @since n.e.x.t
 */
class Reset_CLI_Command extends CLI_Command {

	/**
	 * Resets Site Kit Settings and Data
	 *
	 * ## OPTIONS
	 *
	 * ## EXAMPLES
	 *
	 *     wp google-site-kit reset
	 *
	 * @since n.e.x.t
	 * 
	 * @access public
	 */
	public function __invoke() {
		$reset = new Reset( $this->context );
		$reset->all();
	
		\WP_CLI::success( 'Settings successfully reset.' );
	}

}
