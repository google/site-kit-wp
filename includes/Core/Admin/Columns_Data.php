<?php
/**
 * Class Google\Site_Kit\Core\Admin\Columns_Data
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;
use Google\Site_Kit\Core\Storage\Transients;
use WP_Query;


/**
 * Class to handle all wp-admin Dashboard related functionality.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Columns_Data {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Module instance.
	 *
	 * @since n.e.x.t
	 * @var Module
	 */
	protected $module;

	/**
	 * Transients instance.
	 *
	 * @since n.e.x.t
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Allowed post types array.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $allowed_post_types;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context    $context      Plugin context.
	 * @param Module     $module       Module instance.
	 * @param Transients $transients   Optional. Transient API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Module $module,
		Transients $transients = null
	) {
		$this->context    = $context;
		$this->module     = $module;
		$this->transients = $transients ?: new Transients( $this->context );

		/**
		 * Allowed post types for which to show column data.
		 *
		 * Filters the array of allowed post types on which column data will be included.
		 *
		 * @since n.e.x.t
		 *
		 * @param array $allowed_post_types Array of allowed post types.
		 */
		$this->allowed_post_types = apply_filters( "googlesitekit_{$this->module->slug}_column_data_allowed_post_types", array( 'post', 'page' ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		if ( ! $this->module->is_connected() || ! is_admin() ) {
			return;
		}

		add_action(
			'pre_get_posts',
			function( WP_Query $query ) {
				if ( ! $query->is_main_query() || ! function_exists( 'get_current_screen' ) ) {
					return;
				}

				$screen               = get_current_screen();
				$allowed_edit_screens = array_map(
					function( $post_type ) {
						return 'edit-' . $post_type;
					},
					$this->allowed_post_types
				);

				// Check if this post type is allowed.
				if ( $screen && ! in_array( $screen->id, $allowed_edit_screens, true ) ) {
					return;
				}

				add_action(
					'posts_selection',
					function( $selection ) use ( $query ) {
						$this->maybe_request_columns_data( $query );
					}
				);
			}
		);
	}

	/**
	 * Makes a report request if transient is not present, or mismatches current
	 * posts in admin posts list page.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Query $query WP_Query instance.
	 */
	protected function maybe_request_columns_data( $query ) {
		$current_posts_data = array();
		$current_post_type  = $query->get( 'post_type' );
		$columns_definition = $this->extract_columns_definition();

		if ( $query->posts ) {
			foreach ( $query->posts as $post ) {
				$this->prepare_posts_data( $post, $current_posts_data, $columns_definition['columns'] );
			}
		}

		// If there is no posts yet, bail early.
		if ( empty( $current_posts_data ) ) {
			return;
		}

		// If module is in gathering data state, bail early.
		if ( $this->module instanceof Module_With_Data_Available_State && ! $this->module->is_data_available() ) {
			return;
		}

		$transient_key    = $this->get_transient_key( $current_post_type );
		$stored_data      = $this->transients->get( $transient_key );
		$make_new_request = empty( $existing_data ) ? true : false;

		// If current posts in the admin posts view have changed from the the ones
		// previously stored requesting new data is needed.
		if ( ! empty( $stored_data ) && array_diff( array_keys( $current_posts_data ), array_keys( $stored_data ) ) ) {
			$make_new_request = true;
		}

		if ( $make_new_request ) {
			$paths = wp_list_pluck( $current_posts_data, 'path' );
			$data  = $this->get_report_data( $paths, $columns_definition['metrics'] );

			$this->process_report_data( $data, $columns_definition['columns'] );
		}
	}

	/**
	 * Prepares data for each post by setting the path and initializing columns with zero values.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $paths   array holding the post url paths.
	 * @param array $metrics array holding the report metrics.
	 * @return mixed Data on success, or WP_Error on failure.
	 */
	protected function get_report_data( $paths, $metrics ) {
		$queried_metrics = array_combine(
			array_map(
				function( $item ) {
					return 'name';
				},
				$metrics
			),
			$metrics
		);

		$options = array(
			'metrics'          => array( $queried_metrics ),
			'dimensions'       => array(
				array(
					'name' => 'pagePath',
				),
			),
			'startDate'        => gmdate( 'Y-m-d' ),
			'endDate'          => gmdate( 'Y-m-d', strtotime( '-28 days' ) ),
			'dimensionFilters' => array(
				'pagePath' => array(
					'filterType' => 'inListFilter',
					'value'      => $paths,
				),
			),
			'limit'            => '20',
		);

		return $this->module->get_data( 'report', $options );
	}

	/**
	 * Process the report data and save in transient if response is no WP_Error.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $data    Data if response is successful, or WP_Error if it failed.
	 * @param array $columns The columns that are included in the post's data.
	 */
	protected function process_report_data( $data, $columns ) {
		if ( is_wp_error( $data ) || ! is_wp_error( $data ) && empty( $data->rowCount ) ) { // phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			return;
		}

		$data->rows;
	}

	/**
	 * Prepares data for each post by setting the path and initializing columns with zero values.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post $post                The current post object.
	 * @param array   $current_posts_data  Reference to the array holding the data for all posts.
	 * @param array   $columns             The columns to be included in the post's data.
	 */
	protected function prepare_posts_data( $post, &$current_posts_data, $columns ) {
		$permalink  = get_permalink( $post );
		$parsed_url = wp_parse_url( $permalink );
		$path       = $parsed_url['path'];

		$base_data = array(
			'path' => $path,
		);

		$current_posts_data[ $post->ID ] = array_merge(
			$base_data,
			array_combine(
				$columns,
				array_map(
					function( $column ) {
						return 0;
					},
					$columns
				)
			)
		);
	}

	/**
	 * Get the transient key.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post $post_type The current post type.
	 * @return string Transient key.
	 */
	protected function get_transient_key( $post_type ) {
		return "googlesitekit_{$this->module->slug}_{$post_type}_columns_data";
	}

	/**
	 * Get the columns and metrics from the modules column definition.
	 *
	 * @since n.e.x.t
	 *
	 * @return array An associative array with two keys:
	 *               - 'columns': An array of column names.
	 *               - 'metrics': An array of metric names.
	 */
	protected function extract_columns_definition() {
		$definition = $this->module->get_columns_definition();

		$columns = array_keys( $definition );
		$metrics = wp_list_pluck( $definition, 'metric' );

		return array(
			'columns' => $columns,
			'metrics' => $metrics,
		);
	}
}
