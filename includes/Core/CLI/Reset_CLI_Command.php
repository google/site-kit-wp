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
use WP_CLI;

/**
 * Resets Site Kit Settings and Data.
 *
 * @since 1.11.0
 * @access private
 * @ignore
 */
class Reset_CLI_Command extends CLI_Command {

	/**
	 * Deletes options, user stored options, transients and clears object cache for stored options.
	 *
	 * ## OPTIONS
	 *
	 * ## EXAMPLES
	 *
	 *     wp google-site-kit reset
	 *
	 * @since 1.11.0
	 */
	public function __invoke() {
		$reset = new Reset( $this->context );
		$reset->all();

		WP_CLI::success( 'Settings successfully reset.' );
	}

}
