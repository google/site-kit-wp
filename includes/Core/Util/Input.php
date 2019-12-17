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
 * @since 1.1.2
 * @access private
 * @ignore
 */
class Input {
	/**
	 * Map of input type to superglobal array.
	 *
	 * For use as fallback only.
	 *
	 * @since 1.1.4
	 * @var array
	 */
	protected $fallback_map;

	/**
	 * Constructor.
	 *
	 * @since 1.1.4
	 */
	public function __construct() {
		// Fallback map for environments where filter_input may not work with ENV or SERVER types.
		$this->fallback_map = array(
			INPUT_ENV    => $_ENV,
			INPUT_SERVER => $_SERVER, // phpcs:ignore WordPress.VIP.SuperGlobalInputUsage
		);
	}

	/**
	 * Gets a specific external variable by name and optionally filters it.
	 *
	 * @since 1.1.2
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

		// Fallback for environments where filter_input may not work with specific types.
		if (
			// Only use this fallback for affected input types.
			isset( $this->fallback_map[ $type ] )
			// Only use the fallback if the value is not-set (could be either depending on FILTER_NULL_ON_FAILURE).
			&& in_array( $value, array( null, false ), true )
			// Only use the fallback if the key exists in the input map.
			&& array_key_exists( $variable_name, $this->fallback_map[ $type ] )
		) {
			return filter_var( $this->fallback_map[ $type ][ $variable_name ], $filter, $options );
		}

		return $value;
	}
}
