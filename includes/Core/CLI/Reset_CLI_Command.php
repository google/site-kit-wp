<?php
/**
 * Site Kit Cache CLI Commands
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Util\Reset;
use Google\Site_Kit\Core\Util\Reset_Persistent;
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
	 * [--persistent]
	 * : Additionally deletes persistent options.
	 *
	 * ## EXAMPLES
	 *
	 *     wp google-site-kit reset
	 *     wp google-site-kit reset --persistent
	 *
	 * @since 1.11.0
	 * @since 1.27.0 Added --persistent flag to delete persistent options.
	 *
	 * @param array $args       Positional args.
	 * @param array $assoc_args Additional flags.
	 */
	public function __invoke( $args, $assoc_args ) {
		$reset = new Reset( $this->context );
		$reset->all();

		if ( isset( $assoc_args['persistent'] ) && true === $assoc_args['persistent'] ) {
			$reset_persistent = new Reset_Persistent( $this->context );
			$reset_persistent->all();
		}

		WP_CLI::success( 'Settings successfully reset.' );
	}
}
