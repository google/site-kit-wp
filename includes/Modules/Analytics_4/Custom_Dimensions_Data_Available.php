<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\Transients;

/**
 * Class for updating Analytics 4 custom dimension data availability state.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Custom_Dimensions_Data_Available {

	// TODO: Flag that I've used parameterName over customDimensionName etc throughout.
	/**
	 * List of valid custom dimension parameter names.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const CUSTOM_DIMENSION_PARAMETER_NAMES = array(
		'googlesitekit_post_date',
		'googlesitekit_post_author',
		'googlesitekit_post_categories',
		'googlesitekit_post_type',
	);

	/**
	 * Transients instance.
	 *
	 * @since n.e.x.t
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Transients $transients Transients instance.
	 */
	public function __construct( Transients $transients ) {
		$this->transients = $transients;
	}

	/**
	 * Gets data available transient name for the custom dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $parameter_name Custom dimension parameter name.
	 * @return string Data available transient name.
	 */
	protected function get_data_available_transient_name( $parameter_name ) {
		return "googlesitekit_custom_dimension_{$parameter_name}_data_available";
	}

	/**
	 * Gets data availability for all custom dimensions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Associative array of custom dimension names and their data availability state.
	 */
	public function get_data_availability() {
		return array_reduce(
			self::CUSTOM_DIMENSION_PARAMETER_NAMES,
			function ( $data_availability, $parameter_name ) {
				$data_availability[ $parameter_name ] = $this->is_data_available( $parameter_name );
				return $data_availability;
			},
			array()
		);
	}

	/**
	 * Checks whether the data is available for the custom dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $parameter_name Custom dimension parameter name.
	 * @return bool True if data is available, false otherwise.
	 */
	protected function is_data_available( $parameter_name ) {
		return (bool) $this->transients->get( $this->get_data_available_transient_name( $parameter_name ) );
	}

	/**
	 * Sets the data available state for the custom dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $parameter_name Custom dimension parameter name.
	 * @return bool True on success, false otherwise.
	 */
	public function set_data_available( $parameter_name ) {
		return $this->transients->set( $this->get_data_available_transient_name( $parameter_name ), true );
	}

	/**
	 * Resets the data available state for all custom dimensions.
	 *
	 * @since n.e.x.t
	 */
	public function reset_data_available() {
		foreach ( self::CUSTOM_DIMENSION_PARAMETER_NAMES as $parameter_name ) {
			$this->transients->delete( $this->get_data_available_transient_name( $parameter_name ) );
		}
	}

	/**
	 * Checks whether the custom dimension is valid.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $parameter_name Custom dimension parameter name.
	 * @return bool True if valid, false otherwise.
	 */
	public function is_valid_custom_dimension( $parameter_name ) {
		return in_array( $parameter_name, self::CUSTOM_DIMENSION_PARAMETER_NAMES, true );
	}
}
