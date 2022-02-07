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
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Modules;
use WP_CLI;
use WP_CLI\Formatter;

/**
 * Manages Site Kit modules.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Module_CLI_Command extends CLI_Command {

	/**
	 * Modules instance.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		parent::__construct( $context );

		$this->modules = new Modules( $context );
	}

	/**
	 * Lists modules.
	 *
	 * ## OPTIONS
	 *
	 * [--field=<field>]
	 * : Prints the value of a single field for each module.
	 *
	 * [--fields=<fields>]
	 * : Limit the output to specific object fields.
	 *
	 * [--format=<format>]
	 * : Render output in a particular format.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - csv
	 *   - count
	 *   - json
	 *   - yaml
	 * ---
	 *
	 * [--status=<status>]
	 * : Filter the output by module status.
	 * ---
	 * options:
	 *   - active
	 *   - inactive
	 * ---
	 *
	 * ## AVAILABLE FIELDS
	 *
	 * These fields will be displayed by default for each module:
	 *
	 * * slug
	 * * status
	 *
	 * These fields are optionally available:
	 *
	 * * name
	 * * description
	 * * order
	 * * homepage
	 * * depends_on
	 * * force_active
	 * * internal
	 *
	 * @since n.e.x.t
	 *
	 * @subcommand list
	 */
	public function _list( $_, $assoc_args ) {
		$items = array_map(
			function ( Module $module ) {
				$row           = $module->get_info();
				$row['status'] = $this->get_status( $module );

				return $row;
			},
			$this->modules->get_available_modules()
		);

		if ( ! empty( $assoc_args['status'] ) ) {
			$items = array_filter(
				$items,
				function ( $item ) use ( $assoc_args ) {
					return $item['status'] === $assoc_args['status'];
				}
			);
		}

		$formatter  = new Formatter( $assoc_args, array( 'slug', 'status' ) );
		$formatter->display_items( $items );
	}

	/**
	 * Gets details about a module.
	 *
	 * ## OPTIONS
	 *
	 * <module>
	 * : The module to get.
	 *
	 * [--field=<field>]
	 * : Instead of returning the whole module, returns the value of a single field.
	 *
	 * [--fields=<fields>]
	 * : Limit the output to specific fields. Defaults to all fields.
	 *
	 * [--format=<format>]
	 * : Render output in a particular format.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - csv
	 *   - json
	 *   - yaml
	 * ---
	 */
	public function get( $args, $assoc_args ) {
		list( $slug )   = $args;
		list( $module ) = $this->get_modules_or_fail( array( $slug ) );

		$module_info           = $module->get_info();
		$module_info['status'] = $this->get_status( $module );

		if ( empty( $assoc_args['fields'] ) ) {
			$assoc_args['fields'] = array_keys( $module_info );
		}

		$formatter  = new Formatter( $assoc_args, array( 'slug', 'status' ) );
		$formatter->display_item( $module_info );
	}

	/**
	 * Activates one or more modules.
	 *
	 * ## OPTIONS
	 *
	 * <slug>...
	 * : One or more modules to activate.
	 *
	 * @throws WP_CLI\ExitException Thrown if there is an error.
	 */
	public function activate( $slugs ) {
		// Map slugs into modules first to validate them.
		$modules = $this->get_modules_or_fail( $slugs );

		foreach ( $modules as $module ) {
			if ( $this->modules->is_module_active( $module->slug ) ) {
				WP_CLI::warning( "$module->name is already active" );

				continue;
			}

			if ( $this->modules->activate_module( $module->slug ) ) {
				WP_CLI::success( "$module->name activated!" );
			} else {
				WP_CLI::error( "Failed to activate $module->name" );
			}
		}
	}

	/**
	 * Deactivates one or more modules.
	 *
	 * ## OPTIONS
	 *
	 * <slug>...
	 * : One or more modules to deactivate.
	 *
	 * @throws WP_CLI\ExitException
	 */
	public function deactivate( $slugs ) {
		// Map slugs into modules first to validate them.
		$modules = $this->get_modules_or_fail( $slugs );

		foreach ( $modules as $module ) {
			if ( ! $this->modules->is_module_active( $module->slug ) ) {
				WP_CLI::warning( "$module->name is already deactivated" );

				continue;
			}

			if ( $module->force_active ) {
				WP_CLI::warning( "$module->name cannot be deactivated" );

				continue;
			}

			if ( $this->modules->deactivate_module( $module->slug ) ) {
				WP_CLI::success( "$module->name deactivated!" );
			} else {
				WP_CLI::error( "Failed to deactivate $module->name" );
			}
		}
	}

	/**
	 * Maps the given module slugs into module instances or halts execution.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] $slugs Module slugs.
	 * @return Module[] Module instances.
	 * @throws WP_CLI\ExitException Thrown if no module exists for a given slug.
	 */
	protected function get_modules_or_fail( $slugs ) {
		try {
			$modules = array_map(
				function ( $slug ) {
					return $this->modules->get_module( $slug );
				},
				$slugs
			);
		} catch ( Exception $exception ) {
			WP_CLI::error( $exception->getMessage() );
		}

		return $modules;
	}

	/**
	 * Gets the active status of a given module.
	 *
	 * @since n.e.x.t
	 *
	 * @param Module $module Module instance to check status of.
	 * @return string
	 */
	protected function get_status( Module $module ) {
		if ( $this->modules->is_module_connected( $module->slug ) ) {
			return 'connected';
		}
		return $this->modules->is_module_active( $module->slug ) ? 'active' : 'inactive';
	}
}
