<?php
/**
 * Class Google\Site_Kit\Core\Util\Debug_Data
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Tag_Manager;
use WP_REST_Server;

/**
 * Class for integrating debug information with Site Health.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Health_Status {


	/**
	 * Registers information with Site Health Status tab.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $rest_routes ) {
				$health_check_routes = $this->get_rest_routes();

				return array_merge( $rest_routes, $health_check_routes );
			}
		);

		add_filter(
			'site_status_tests',
			function ( $tests ) {
				global $wp_version;

				if ( version_compare( $wp_version, '5.6', '<' ) ) {
					$tests['direct']['tag_placement'] = array(
						'label' => __( 'Tag Placement', 'google-site-kit' ),
						'test'  => $this->get_method_proxy( 'tags_placement_test' ),
					);

					return $tests;
				}

				$tests['async']['tag_placement'] = array(
					'label'             => __( 'Tag Placement', 'google-site-kit' ),
					'test'              => rest_url( 'google-site-kit/v1/core/site/data/tags-placement-test' ),
					'has_rest'          => true,
					'async_direct_test' => $this->get_method_proxy( 'tags_placement_test' ),
				);

				return $tests;
			}
		);
	}

	/**
	 * Gets all REST routes.
	 *
	 * @since n.e.x.t
	 *
	 * @return REST_Route[]
	 */
	private function get_rest_routes() {
		return array(
			new REST_Route(
				'core/site/data/tags-placement-test',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function() {
							return $this->tags_placement_test();
						},
						'permission_callback' => function () {
							return current_user_can( Permissions::SETUP );
						},
					),
				)
			),
		);
	}

	/**
	 * Checks if the modules tags are placed on the website.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	protected function tags_placement_test() {
		global $wp_version;

		$result = array(
			'label'   => __( 'Tags Placement', 'google-site-kit' ),
			'status'  => 'recommended',
			'badge'   => array(
				'label' => __( 'Site Kit', 'google-site-kit' ),
				'color' => 'blue',
			),
			'actions' => '',
			'test'    => 'tag_placement',
		);

		if ( version_compare( $wp_version, '5.6', '<' ) ) {
			$result['description'] = sprintf(
				'<p>%s</p>',
				__( 'This feature requires WordPress version 5.6 or higher', 'google-site-kit' )
			);

			return $result;
		}

		$response = wp_remote_get( site_url() ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response = wp_remote_retrieve_body( $response );

		$active_modules = $this->modules->get_active_modules();
		$active_modules = array_filter(
			$active_modules,
			function( $module ) {
				return in_array(
					$module->slug,
					array(
						Analytics_4::MODULE_SLUG,
						AdSense::MODULE_SLUG,
						Tag_Manager::MODULE_SLUG,
					),
					true
				);
			}
		);

		if ( empty( $active_modules ) ) {
			$result['description'] = sprintf(
				'<p>%s</p>',
				__( 'Tag status not available: AdSense, Tag Manager, and Analytics modules are not connected.', 'google-site-kit' )
			);

			return $result;
		}

		$description = array();

		foreach ( $active_modules as $module ) {
			$module_name = $module->slug;
			if ( 'adsense' === $module_name ) {
				$module_name = 'AdSense';
			}
			if ( 'analytics-4' === $module_name ) {
				$module_name = 'Analytics';
			}
			if ( 'tagmanager' === $module_name ) {
				$module_name = 'Tag Manager';
			}

			$search_string = 'Google ' . $module_name . ' snippet added by Site Kit';
			if ( strpos( $response, $search_string ) !== false ) {
				$description[] = "<li>{$module_name}: Tag detected and placed by Site Kit.</li>";
			}
		}

		if ( ! empty( $description ) ) {
			$result['description'] = '<ul>' . join( "\n", $description ) . '</ul>';
		}

		return $result;
	}

}
