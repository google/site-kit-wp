<?php
/**
 * Class Google\Site_Kit\Core\CLI\Feature_Flags_CLI_Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Util\Feature_Flags;
use WP_CLI\Formatter;

/**
 * Manages feature flags.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Feature_Flags_CLI_Command extends CLI_Command {

	/**
	 * Gets all feature flags.
	 *
	 * @subcommand list
	 *
	 * @param array $args Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 */
	public function _list( $args, $assoc_args ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$features = array_map(
			function ( $feature ) {
				return array(
					'name'   => $feature,
					'status' => Feature_Flags::enabled( $feature ) ? 'active' : 'inactive',
				);
			},
			Feature_Flags::get_available_features()
		);

		$formatter = new Formatter( $assoc_args, array( 'name', 'status' ) );
		$formatter->display_items( $features );
	}
}
