<?php
/**
 * Class Google\Site_Kit\Core\CLI\Module_Datapoint_CLI_Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Exception;
use Google\Site_Kit\Core\Modules\Modules;
use ReflectionException;
use ReflectionMethod;
use WP_CLI;

/**
 * Manages module data requests.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Module_Datapoint_CLI_Command extends CLI_Command {

	/**
	 * Lists module datapoints.
	 *
	 * ## OPTIONS
	 *
	 * <slug>
	 * : Module slug.
	 *
	 * @subcommand list
	 *
	 * @param array $args       Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 * @throws WP_CLI\ExitException Thrown if the given module is not available.
	 * @throws ReflectionException Thrown if there is a problem retrieving the module's datapoint definitions.
	 */
	public function _list( $args, $assoc_args ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		list( $slug ) = $args;

		$modules = new Modules( $this->context );

		try {
			$module = $modules->get_module( $slug );
		} catch ( Exception $exception ) {
			WP_CLI::error( $exception->getMessage() );
		}

		// Don't try this at home kids.
		$reflection_method = new ReflectionMethod( $module, 'get_datapoint_definitions' );
		$reflection_method->setAccessible( true );

		$datapoint_definitions = $reflection_method->invoke( $module );

		$datapoints = array_map(
			function ( $definition, $datapoint ) {
				$defaults = array(
					'service' => null,
					'scopes'  => null,
				);
				return array_merge( $defaults, compact( 'datapoint' ), $definition );
			},
			$datapoint_definitions,
			array_keys( $datapoint_definitions )
		);

		$formatter = new WP_CLI\Formatter( $assoc_args, array( 'datapoint', 'service', 'scopes' ) );
		$formatter->display_items( $datapoints );
	}
}
