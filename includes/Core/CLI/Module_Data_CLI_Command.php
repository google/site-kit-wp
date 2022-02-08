<?php
/**
 * Class Google\Site_Kit\Core\CLI\Module_CLI_Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Exception;
use Google\Site_Kit\Core\Authentication\Exception\Insufficient_Scopes_Exception;
use Google\Site_Kit\Core\CLI\Traits\CLI_Auth;
use Google\Site_Kit\Core\Modules\Modules;
use WP_CLI;
use function Local\CLI\get_flag_value;

/**
 * Manages Site Kit module data.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Module_Data_CLI_Command extends CLI_Command {
	use CLI_Auth;

	/**
	 * Gets module data as JSON.
	 *
	 * ## OPTIONS
	 *
	 * <slug>
	 * : Module slug to get data for.
	 *
	 * <datapoint>
	 * : Module datapoint to get data from.
	 *
	 * [--pretty]
	 * : Pretty-print JSON output.
	 *
	 * [--<field>=<value>]
	 * : Data request options.
	 *
	 * @param $args
	 * @param $assoc_args
	 * @throws WP_CLI\ExitException
	 */
	public function get( $args, $assoc_args ) {
		list( $slug, $datapoint ) = $args;

		$this->require_auth_or_fail();

		$modules = new Modules( $this->context );

		if ( ! $modules->is_module_connected( $slug ) ) {
			WP_CLI::error( 'Module must be connected to get data.' );
		}

		$json_flags = 0;
		if ( get_flag_value( $assoc_args, 'pretty' ) ) {
			$json_flags = JSON_PRETTY_PRINT;
		}
		unset( $assoc_args['pretty'] );

		try {
			$module   = $modules->get_module( $slug );
			$response = $module->get_data( $datapoint, $assoc_args );
		} catch ( Insufficient_Scopes_Exception $scopes_exception ) {
			WP_CLI::error( $scopes_exception->to_wp_error() );
		} catch ( Exception $exception ) {
			WP_CLI::error( "Exception thrown while fetching module data: {$exception->getMessage()}" );
		}

		if ( is_wp_error( $response ) ) {
			WP_CLI::error( $response );
		}

		echo json_encode( $response, $json_flags );
	}
}
