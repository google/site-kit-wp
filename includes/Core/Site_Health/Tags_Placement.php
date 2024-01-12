<?php
/**
 * Class Google\Site_Kit\Core\Site_Health\Tags_Placement
 *
 * @package   Google\Site_Kit\Core\Site_Health
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Site_Health;

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use WP_REST_Server;

/**
 * Class for integrating status tab information with Site Health.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Tags_Placement {

	use Method_Proxy_Trait;

	/**
	 * Modules instance.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Modules $modules Modules instance.
	 */
	public function __construct( Modules $modules ) {
		$this->modules = $modules;
	}

	/**
	 * Registers functionality through WordPress hooks.
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
						'label' => __( 'Tags Placement', 'google-site-kit' ),
						'test'  => $this->get_method_proxy( 'tags_placement_test' ),
					);

					return $tests;
				}

				$tests['async']['tag_placement'] = array(
					'label'             => __( 'Tags Placement', 'google-site-kit' ),
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
						'callback'            => $this->get_method_proxy( 'tags_placement_test' ),
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

		$active_modules = $this->get_active_modules();
		if ( empty( $active_modules ) ) {
			$result['description'] = sprintf(
				'<p>%s</p>',
				__( 'Tag status not available: AdSense, Tag Manager, and Analytics modules are not connected.', 'google-site-kit' )
			);

			return $result;
		}

		// Generate random page name that will result in 404 page, to prevent receiving
		// cached page and target page with smaller content.
		$random_page = substr(
			str_shuffle( '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' ),
			0,
			10
		);
		$response    = wp_remote_get( site_url( $random_page ) ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get

		if ( is_wp_error( $response ) ) {
			$result['description'] = sprintf(
				'<p>%s</p>',
				__( 'There was an error while trying to get the status, please try again later.', 'google-site-kit' )
			);

			return $result;
		}

		$response = wp_remote_retrieve_body( $response );

		$description = array();
		foreach ( $active_modules as $module ) {
			$tag_found = $this->check_if_tag_exists( $module, $response );

			if ( $tag_found ) {
				$description[] = $tag_found;
			}
		}

		if ( ! empty( $description ) ) {
			$result['description'] = '<ul>' . join( "\n", $description ) . '</ul>';
		}

		return $result;
	}

	/**
	 * Gets active modules filtered to account only for
	 * Analytics, AdSense and Tag Manager.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Filtered active modules instances.
	 */
	protected function get_active_modules() {
		$active_modules = $this->modules->get_active_modules();

		$active_modules = array_filter(
			$active_modules,
			function( $module ) {
				return $module instanceof Module_With_Tag;
			}
		);

		return $active_modules;
	}

	/**
	 * Checks if tag exists.
	 *
	 * @since n.e.x.t
	 *
	 * @param Module_With_Tag $module  Module instance.
	 * @param string          $content Content to search for the tags.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	protected function check_if_tag_exists( $module, $content ) {
		$check_tag   = $module->has_tag( $content );
		$module_name = $module->get_module_name_from_slug();

		switch ( $check_tag ) {
			case Module_Tag_Matchers::TAG_EXISTS_WITH_COMMENTS:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_name,
					__( 'Tag detected and placed by Site Kit.', 'google-site-kit' )
				);

			case Module_Tag_Matchers::TAG_EXISTS:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_name,
					__( 'Tag detected but could not verify that Site Kit placed the tag.', 'google-site-kit' )
				);

			case Module_Tag_Matchers::NO_TAG_FOUND:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_name,
					__( 'No tag detected.', 'google-site-kit' )
				);

			default:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_name,
					__( 'No tag detected.', 'google-site-kit' )
				);
		}
	}
}
