<?php

namespace Google\Site_Kit\Core\CLI;

use Exception;
use Google\Site_Kit\Core\Modules\Modules;
use ReflectionException;
use ReflectionMethod;
use WP_CLI;

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
	 * @param $args
	 * @param $assoc_args
	 * @throws WP_CLI\ExitException|ReflectionException
	 */
	public function _list( $args, $assoc_args ) {
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
				$defaults = array( 'service' => null, 'scopes' => null );
				return array_merge( $defaults, compact( 'datapoint' ), $definition );
			},
			$datapoint_definitions,
			array_keys( $datapoint_definitions )
		);

		$formatter = new WP_CLI\Formatter( $assoc_args, array( 'datapoint', 'service', 'scopes' ) );
		$formatter->display_items( $datapoints );
	}
}
