<?php
/**
 * Class Google\Site_Kit\Core\DI\DI_Container
 *
 * @package   Google\Site_Kit\Core\DI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\DI;

use ArrayAccess;
use Google\Site_Kit_Dependencies\Psr\Container\ContainerInterface;

/**
 * DI container class.
 *
 * @since n.e.x.t
 */
class DI_Container implements ContainerInterface, ArrayAccess {

	/**
	 * Definitions list.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $definitions = array();

	/**
	 * Returns true if the container can return an entry for the given identifier.
	 * Returns false otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry to look for.
	 * @return bool TRUE if the container can return an entry, otherwise FALSE.
	 */
	public function offsetExists( $id ) {
		return $this->has( $id );
	}

	/**
	 * Finds an entry of the container by its identifier and returns it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry to look for.
	 * @return mixed Entry.
	 */
	public function offsetGet( $id ) {
		return $this->get( $id );
	}

	/**
	 * Sets the entry definition.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry.
	 * @param mixed  $entry Entry.
	 */
	public function offsetSet( $id, $entry ) {
		$this->set( $id, $entry );
	}

	/**
	 * Removes the entry.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry to remove.
	 */
	public function offsetUnset( $id ) {
		unset( $this->definitions[ $id ] );
	}

	/**
	 * Sets the entry definition.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry.
	 * @param mixed  $entry Entry.
	 * @return bool TRUE if the entry is added, otherwise FALSE.
	 */
	public function set( $id, $entry ) {
		if ( ! empty( $this->definitions[ $id ]['is_protected'] ) ) {
			return false;
		}

		$this->definitions[ $id ] = array(
			'is_factory'   => false,
			'is_protected' => false,
			'is_service'   => is_callable( $entry ),
			'entry'        => $entry,
		);

		return true;
	}

	/**
	 * Sets the entry to be protected.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry.
	 */
	public function set_is_protected( $id ) {
		if ( $this->has( $id ) ) {
			$this->definitions[ $id ]['is_protected'] = true;
		}
	}

	/**
	 * Sets the entry to be factory.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry.
	 */
	public function set_factory( $id ) {
		if ( $this->has( $id ) ) {
			$this->definitions[ $id ]['is_factory'] = true;
		}
	}

	/**
	 * Sets services.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definitions Service definitions.
	 */
	public function set_services( array $definitions ) {
		foreach ( $definitions as $service_name => $service_class ) {
			$service_class_key = sprintf(
				'%s_CLASS',
				strtoupper( $service_name )
			);

			$this->set( $service_class_key, $service_class );
			$this->set(
				$service_name,
				function( $di ) use ( $service_class_key ) {
					return new $di[ $service_class_key ]();
				}
			);
		}
	}

	/**
	 * Finds an entry of the container by its identifier and returns it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry to look for.
	 * @return mixed Entry.
	 */
	public function get( $id ) {
		if ( ! isset( $this->definitions[ $id ] ) ) {
			return null;
		}

		$definition = $this->definitions[ $id ];
		if ( $definition['is_service'] ) {
			if ( empty( $definition['instance'] ) || $definition['is_factory'] ) {
				$instance = call_user_func( $definition['entry'], $this );
				if ( $instance instanceof DI_Aware_Interface ) {
					$instance->set_di( $this );
				}

				$this->definitions[ $id ]['instance'] = $instance;
			}

			return $this->definitions[ $id ]['instance'];
		}

		return $definition['entry'];
	}

	/**
	 * Returns true if the container can return an entry for the given identifier.
	 * Returns false otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Identifier of the entry to look for.
	 * @return bool TRUE if the container can return an entry, otherwise FALSE.
	 */
	public function has( $id ) {
		return ! empty( $this->definitions[ $id ] );
	}

}
