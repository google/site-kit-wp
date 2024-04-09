<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Resource_Data_Availability_Date
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\Transients;

/**
 * Class for managing Analytics 4 resource data availability date.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Resource_Data_Availability_Date {

	/**
	 * List of valid custom dimension slugs.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const CUSTOM_DIMENSION_SLUGS = array(
		'googlesitekit_post_date',
		'googlesitekit_post_author',
		'googlesitekit_post_categories',
		'googlesitekit_post_type',
	);

	/**
	 * List of valid audience slugs.
	 *
	 * TODO: This should use the actual cached audiences from Database once they are available.
	 * See: https://github.com/google/site-kit-wp/issues/8486
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const AUDIENCE_SLUGS = array(
		// Default audiences.
		'all-users',
		'purchasers',
		// Site Kit audiences.
		'new-visitors',
		'returning-visitors',

	);

	const RESOURCE_TYPE_AUDIENCE         = 'audience';
	const RESOURCE_TYPE_CUSTOM_DIMENSION = 'custom_dimension';
	const RESOURCE_TYPE_PROPERTY         = 'property';

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
	 * Gets data available date transient name for the given resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $resource_slug Resource slug.
	 * @param string $resource_type Resource type.
	 * @return string Data available date transient name.
	 */
	protected function get_resource_transient_name( $resource_slug, $resource_type ) {
		return "googlesitekit_{$resource_type}_{$resource_slug}_data_availability_date";
	}

	/**
	 * Gets data availability dates for all resources.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Associative array of resource names and their data availability state.
	 */
	public function get_resource_dates() {
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
	 * Returns the data availability date for the given resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $resource_slug Resource slug.
	 * @param string $resource_type Resource type.
	 * @return string|false Data availability date on success, false otherwise.
	 */
	public function get_resource_date( $resource_slug, $resource_type ) {
		return $this->transients->get( $this->get_resource_transient_name( $resource_slug, $resource_type ) );
	}

	/**
	 * Sets the data availability date for the given resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $resource_slug Resource slug.
	 * @param string $resource_type Resource type.
	 * @param string $date Data availability date.
	 * @return bool True on success, false otherwise.
	 */
	public function set_resource_date( $resource_slug, $resource_type, $date ) {
		return $this->transients->set( $this->get_resource_transient_name( $resource_slug, $resource_type ), $date );
	}

	/**
	 * Resets the data availability date for given resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $resource_slug Resource slug.
	 * @param string $resource_type Resource type.
	 * @return bool True on success, false otherwise.
	 */
	public function reset_resource_date( $resource_slug, $resource_type ) {
		return $this->transients->delete( $this->get_resource_transient_name( $resource_slug, $resource_type ) );
	}

	/**
	 * Resets the data availability date for all resources.
	 *
	 * @since n.e.x.t
	 */
	public function reset_all_resource_dates() {
		foreach ( self::CUSTOM_DIMENSION_SLUGS as $custom_dimension ) {
			$this->reset_resource_date( $custom_dimension, self::RESOURCE_TYPE_CUSTOM_DIMENSION );
		}

		foreach ( self::AUDIENCE_SLUGS as $audience_slug ) {
			$this->reset_resource_date( $audience_slug, self::RESOURCE_TYPE_AUDIENCE );
		}

		// TODO: Add property data availability reset logic.
	}
}
