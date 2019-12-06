<?php
/**
 * Class Google\Site_Kit\Core\Util\Input
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class for input superglobal access.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Input {
	/**
	 * Map of input type to superglobal array.
	 *
	 * For use as fallback only.
	 *
	 * @var array
	 */
	protected $map;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 */
	public function __construct() {
		$this->map = array(
			INPUT_ENV    => $_ENV,
			INPUT_SERVER => $_SERVER,
		);
	}

	/**
	 * Gets a specific external variable by name and optionally filters it.
	 *
	 * @since n.e.x.t
	 *
	 * @link https://php.net/manual/en/function.filter-input.php
	 *
	 * @param int    $type               One of INPUT_GET, INPUT_POST, INPUT_COOKIE, INPUT_SERVER, or INPUT_ENV.
	 * @param string $variable_name      Name of a variable to get.
	 * @param int    $filter [optional]  The ID of the filter to apply. The manual page lists the available filters.
	 * @param mixed  $options [optional] Associative array of options or bitwise disjunction of flags.
	 *                                   If filter accepts options, flags can be provided in "flags" field of array.
	 * @return mixed                     Value of the requested variable on success,
	 *                                      FALSE if the filter fails,
	 *                                      NULL if the $variable_name variable is not set.
	 *
	 *                                      If the flag FILTER_NULL_ON_FAILURE is used, it returns FALSE if the variable is not set
	 *                                      and NULL if the filter fails.
	 */
	public function filter( $type, $variable_name, $filter = FILTER_DEFAULT, $options = null ) {
		$value = filter_input( $type, $variable_name, $filter, $options );

		// Fallback for environments where filter_input may not work with SERVER or ENV types.
		if (
			// Only use this fallback for affected input types.
			in_array( $type, array( INPUT_SERVER, INPUT_ENV ), true )
			// Only use the fallback if the value is not-set (could be either depending on FILTER_NULL_ON_FAILURE).
			&& in_array( $value, array( null, false ), true )
			// Only use the fallback if the key exists in the input map.
			&& array_key_exists( $variable_name, $this->map[ $type ] )
		) {
			return filter_var( $this->map[ $type ][ $variable_name ], $filter, $options );
		}

		return $value;
	}
}
