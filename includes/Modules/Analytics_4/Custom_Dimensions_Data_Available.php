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
 * @since 1.113.0
 * @access private
 * @ignore
 */
class Custom_Dimensions_Data_Available {

	/**
	 * List of valid custom dimension slugs.
	 *
	 * @since 1.113.0
	 * @var array
	 */
	const CUSTOM_DIMENSION_SLUGS = array(
		'googlesitekit_post_date',
		'googlesitekit_post_author',
		'googlesitekit_post_categories',
		'googlesitekit_post_type',
	);

	/**
	 * Transients instance.
	 *
	 * @since 1.113.0
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Constructor.
	 *
	 * @since 1.113.0
	 *
	 * @param Transients $transients Transients instance.
	 */
	public function __construct( Transients $transients ) {
		$this->transients = $transients;
	}

	/**
	 * Gets data available transient name for the custom dimension.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimension Custom dimension slug.
	 * @return string Data available transient name.
	 */
	protected function get_data_available_transient_name( $custom_dimension ) {
		return "googlesitekit_custom_dimension_{$custom_dimension}_data_available";
	}

	/**
	 * Gets data availability for all custom dimensions.
	 *
	 * @since 1.113.0
	 *
	 * @return array Associative array of custom dimension names and their data availability state.
	 */
	public function get_data_availability() {
		return array_reduce(
			self::CUSTOM_DIMENSION_SLUGS,
			function ( $data_availability, $custom_dimension ) {
				$data_availability[ $custom_dimension ] = $this->is_data_available( $custom_dimension );
				return $data_availability;
			},
			array()
		);
	}

	/**
	 * Checks whether the data is available for the custom dimension.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimension Custom dimension slug.
	 * @return bool True if data is available, false otherwise.
	 */
	protected function is_data_available( $custom_dimension ) {
		return (bool) $this->transients->get( $this->get_data_available_transient_name( $custom_dimension ) );
	}

	/**
	 * Sets the data available state for the custom dimension.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimension Custom dimension slug.
	 * @return bool True on success, false otherwise.
	 */
	public function set_data_available( $custom_dimension ) {
		return $this->transients->set( $this->get_data_available_transient_name( $custom_dimension ), true );
	}

	/**
	 * Resets the data available state for all custom dimensions.
	 *
	 * @since 1.113.0
	 */
	public function reset_data_available() {
		foreach ( self::CUSTOM_DIMENSION_SLUGS as $custom_dimension ) {
			$this->transients->delete( $this->get_data_available_transient_name( $custom_dimension ) );
		}
	}

	/**
	 * Checks whether the custom dimension is valid.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimension Custom dimension slug.
	 * @return bool True if valid, false otherwise.
	 */
	public function is_valid_custom_dimension( $custom_dimension ) {
		return in_array( $custom_dimension, self::CUSTOM_DIMENSION_SLUGS, true );
	}
}
