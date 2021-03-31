<?php
/**
 * Class Google\Site_Kit\Core\Modules\Module_Registry
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use InvalidArgumentException;

/**
 * Class for managing module registration.
 *
 * @since 1.21.0
 * @access private
 * @ignore
 */
class Module_Registry {
	/**
	 * Registered modules.
	 *
	 * @since 1.21.0
	 * @var array
	 */
	private $registry = array();

	/**
	 * Registers a module class on the registry.
	 *
	 * @since 1.21.0
	 *
	 * @param string $module_classname Fully-qualified module class name to register.
	 * @throws InvalidArgumentException Thrown if an invalid module class name is provided.
	 */
	public function register( $module_classname ) {
		if ( ! is_string( $module_classname ) || ! $module_classname ) {
			throw new InvalidArgumentException( 'A module class name is required to register a module.' );
		}

		if ( ! class_exists( $module_classname ) ) {
			throw new InvalidArgumentException( "No class exists for '$module_classname'" );
		}

		if ( ! is_subclass_of( $module_classname, Module::class ) ) {
			throw new InvalidArgumentException(
				sprintf( 'All module classes must extend the base module class: %s', Module::class )
			);
		}

		$this->registry[ $module_classname ] = $module_classname;
	}

	/**
	 * Gets all registered module class names.
	 *
	 * @since 1.21.0
	 *
	 * @return string[] Registered module class names.
	 */
	public function get_all() {
		return array_keys( $this->registry );
	}
}
