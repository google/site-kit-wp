<?php
/**
 * Class Google\Site_Kit\Core\Dismissals\REST_Key_Metrics_Controller
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling rest routes for Key Metrics settings.
 *
 * @since 1.93.0
 * @access private
 * @ignore
 */
class REST_Key_Metrics_Controller {

	/**
	 * Key_Metrics_Settings instance.
	 *
	 * @since 1.93.0
	 * @var Key_Metrics_Settings
	 */
	protected $settings;

	/**
	 * Key_Metrics_Setup_Completed_By instance.
	 *
	 * @since 1.113.0
	 * @var Key_Metrics_Setup_Completed_By
	 */
	protected $key_metrics_setup_completed_by;

	/**
	 * Constructor.
	 *
	 * @since 1.93.0
	 *
	 * @param Key_Metrics_Settings           $settings                       Key Metrics settings.
	 * @param Key_Metrics_Setup_Completed_By $key_metrics_setup_completed_by Site-wide option to check if key metrics set up is complete.
	 */
	public function __construct(
		Key_Metrics_Settings $settings,
		Key_Metrics_Setup_Completed_By $key_metrics_setup_completed_by
	) {
		$this->settings                       = $settings;
		$this->key_metrics_setup_completed_by = $key_metrics_setup_completed_by;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.93.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.93.0
	 * @since n.e.x.t Declares the argument and resource schemas of each route.
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$has_capabilities = function () {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/user/data/key-metrics',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => function () {
						return new WP_REST_Response( $this->settings->get() );
					},
					'permission_callback' => $has_capabilities,
				),
				array(
					'schema' => function () {
						return $this->get_key_metrics_settings_schema();
					},
				)
			),
			// WordPress merges this endpoint into the route above, and keeps that route's schema.
			new REST_Route(
				'core/user/data/key-metrics',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						// Data is already validated because we've defined the detailed schema.
						// If the incoming data param doesn't match the schema, then WordPress
						// will automatically return the rest_invalid_param error and we will
						// never get to here.
						$data     = $request->get_param( 'data' );
						$settings = $data['settings'];

						if ( isset( $settings['widgetSlugs'] ) ) {
							$key_metrics_setup_already_done_by_user = $this->key_metrics_setup_completed_by->get();
							if ( empty( $key_metrics_setup_already_done_by_user ) ) {
								$current_user_id = get_current_user_id();

								$this->key_metrics_setup_completed_by->set( $current_user_id );
							}
						}

						$this->settings->merge( $data['settings'] );

						return new WP_REST_Response( $this->settings->get() );
					},
					'permission_callback' => $has_capabilities,
					'args'                => array(
						'data' => array(
							'type'        => 'object',
							'description' => __( 'Key metrics settings to save.', 'google-site-kit' ),
							'required'    => true,
							'properties'  => array(
								'settings' => array(
									'type'        => 'object',
									'description' => __( 'Key metrics settings of the current user.', 'google-site-kit' ),
									'required'    => true,
									'properties'  => array(
										'isWidgetHidden' => array(
											'type'        => 'boolean',
											'description' => __( 'Whether to hide the key metrics section of the dashboard.', 'google-site-kit' ),
											'required'    => true,
										),
										'widgetSlugs'    => array(
											'type'        => 'array',
											'description' => __( 'Slugs of the key metric widgets to show.', 'google-site-kit' ),
											'required'    => false,
											'minItems'    => 1,
											'maxItems'    => 8,
											'items'       => array(
												'type' => 'string',
											),
										),
									),
								),
							),
						),
					),
				)
			),
		);
	}

	/**
	 * Gets the REST schema of the key metrics settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array REST schema.
	 */
	private function get_key_metrics_settings_schema() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'key-metrics',
			'description' => __( 'Key metrics settings of the current user.', 'google-site-kit' ),
			'type'        => 'object',
			'properties'  => array(
				'widgetSlugs'    => array(
					'type'        => 'array',
					'description' => __( 'Slugs of the key metric widgets the current user picked.', 'google-site-kit' ),
					'items'       => array(
						'type' => 'string',
					),
				),
				'isWidgetHidden' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the current user hid the key metrics section of the dashboard.', 'google-site-kit' ),
				),
			),
		);
	}
}
