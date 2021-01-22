<?php
/**
 * Data_Request
 *
 * @package   Google\Site_Kit\Core\REST_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API;

/**
 * Class Data_Request
 *
 * @since 1.0.0
 *
 * @property-read string $method     Request method.
 * @property-read string $type       Request type.
 * @property-read string $identifier Request identifier.
 * @property-read string $datapoint  Request datapoint.
 * @property-read array  $data       Request data parameters.
 * @property-read string $key        Request key.
 */
class Data_Request implements \ArrayAccess {

	/**
	 * Request method.
	 *
	 * @var string
	 */
	protected $method;

	/**
	 * Request type.
	 *
	 * @var string
	 */
	protected $type;

	/**
	 * Request identifier.
	 *
	 * @var string
	 */
	protected $identifier;

	/**
	 * Request datapoint.
	 *
	 * @var string
	 */
	protected $datapoint;

	/**
	 * Request data parameters.
	 *
	 * @var array
	 */
	protected $data;

	/**
	 * Request key.
	 *
	 * @var string
	 */
	protected $key;

	/**
	 * Data_Request constructor.
	 *
	 * @param string     $method Request method.
	 * @param string     $type Request type.
	 * @param string     $identifier Request identifier.
	 * @param string     $datapoint Request datapoint.
	 * @param array|self $data Request data parameters.
	 * @param string     $key Request cache key.
	 */
	public function __construct(
		$method = null,
		$type = null,
		$identifier = null,
		$datapoint = null,
		$data = array(),
		$key = null
	) {
		$this->method     = strtoupper( $method );
		$this->type       = $type;
		$this->identifier = $identifier;
		$this->datapoint  = $datapoint;
		$this->data       = $data instanceof self ? $data->data : (array) $data;
		$this->key        = $key;
	}

	/**
	 * Gets the accessed property by the given name.
	 *
	 * @param string $name Property name.
	 *
	 * @return mixed
	 */
	public function __get( $name ) {
		return isset( $this->$name ) ? $this->$name : null;
	}

	/**
	 * Checks whether or not the given magic property is set.
	 *
	 * @param string $name Property name.
	 *
	 * @return bool
	 */
	public function __isset( $name ) {
		return isset( $this->$name );
	}

	/**
	 * Checks whether the given key exists.
	 *
	 * @param string|int $key Key to check.
	 *
	 * @return bool
	 */
	public function offsetExists( $key ) {
		return array_key_exists( $key, $this->data );
	}

	/**
	 * Gets the value at the given key.
	 *
	 * @param string|int $key Key to return the value for.
	 *
	 * @return mixed
	 */
	public function offsetGet( $key ) {
		if ( $this->offsetExists( $key ) ) {
			return $this->data[ $key ];
		}

		return null;
	}

	/**
	 * Sets the given key to the given value.
	 *
	 * @param string|int $key Key to set the value for.
	 * @param mixed      $value New value for the given key.
	 */
	public function offsetSet( $key, $value ) {
		// Data is immutable.
	}

	/**
	 * Unsets the given key.
	 *
	 * @param string|int $key Key to unset.
	 */
	public function offsetUnset( $key ) {
		// Data is immutable.
	}
}
