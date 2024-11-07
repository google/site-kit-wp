<?php
/**
 * Class Google\Site_Kit\Core\Site_Health\Tag_Placement
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
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * Class for integrating status tab information with Site Health.
 *
 * @since 1.119.0
 * @access private
 * @ignore
 */
class Tag_Placement {

	use Method_Proxy_Trait;

	/**
	 * Modules instance.
	 *
	 * @since 1.119.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Tag_Environment_Type_Guard instance.
	 *
	 * @since 1.119.0
	 * @var Tag_Environment_Type_Guard
	 */
	private $environment_tag_guard;

	/**
	 * Constructor.
	 *
	 * @since 1.119.0
	 *
	 * @param Modules $modules Modules instance.
	 */
	public function __construct( Modules $modules ) {
		$this->modules               = $modules;
		$this->environment_tag_guard = new Tag_Environment_Type_Guard();
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.119.0
	 */
	public function register() {
		add_filter(
			'site_status_tests',
			function ( $tests ) {
				global $wp_version;

				if ( version_compare( $wp_version, '5.6', '<' ) ) {
					$tests['direct']['tag_placement'] = array(
						'label' => __( 'Tag Placement', 'google-site-kit' ),
						'test'  => $this->get_method_proxy( 'tag_placement_test' ),
					);

					return $tests;
				}

				$tests['async']['tag_placement'] = array(
					'label'             => __( 'Tag Placement', 'google-site-kit' ),
					'test'              => rest_url( '/' . REST_Routes::REST_ROOT . '/core/site/data/site-health-tag-placement-test' ),
					'has_rest'          => true,
					'async_direct_test' => $this->get_method_proxy( 'tag_placement_test' ),
				);

				return $tests;
			}
		);
	}

	/**
	 * Checks if the modules tags are placed on the website.
	 *
	 * @since 1.119.0
	 *
	 * @return array Site health status results.
	 */
	public function tag_placement_test() {
		global $wp_version;

		$result = array(
			'label'   => __( 'Tag Placement', 'google-site-kit' ),
			'status'  => 'good',
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

		if ( ! $this->environment_tag_guard->can_activate() ) {
			$result['description'] = sprintf(
				'<p>%s</p>',
				__( 'Tags are not output in the current environment.', 'google-site-kit' )
			);

			return $result;
		}

		$active_modules = $this->get_active_modules_with_tags();
		if ( empty( $active_modules ) ) {
			$result['description'] = sprintf(
				'<p>%s</p>',
				__( 'Tag status not available: no modules that place tags are connected.', 'google-site-kit' )
			);

			return $result;
		}

		$descriptions = array();
		foreach ( $active_modules as $module ) {
			$settings    = $module->get_settings()->get();
			$module_name = $module->name;

			// If module has `canUseSnippet` setting, check if it is disabled.
			if ( isset( $settings['canUseSnippet'] ) && empty( $settings['useSnippet'] ) ) {
				$descriptions[] = sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_name,
					__( 'Tag placement disabled in settings.', 'google-site-kit' )
				);
			} else {
				$content_url = $module->get_content_url();
				if ( is_string( $content_url ) ) {
					$content_url = array( $content_url );
				}

				foreach ( $content_url as $label => $c_url ) {
					$url          = add_query_arg( 'timestamp', time(), $c_url );
					$response     = wp_remote_get( $url ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get
					$module_label = is_numeric( $label ) ? $module_name : $module_name . ' (' . $label . ')';

					if ( is_wp_error( $response ) ) {
						$descriptions[] = sprintf(
							'<li><strong>%s</strong>: %s</li>',
							$module_label,
							__( 'There was an error while trying to get the status, please try again later.', 'google-site-kit' )
						);
						continue;
					}

					$response  = wp_remote_retrieve_body( $response );
					$tag_found = $this->check_if_tag_exists( $module, $response, $module_label );

					if ( $tag_found ) {
						$descriptions[] = $tag_found;
					}
				}
			}
		}

		if ( ! empty( $descriptions ) ) {
			$result['description'] = '<ul>' . join( "\n", $descriptions ) . '</ul>';
		}

		return $result;
	}

	/**
	 * Filters active modules to only those which are instances of Module_With_Tag.
	 *
	 * @since 1.119.0
	 *
	 * @return array Filtered active modules instances.
	 */
	protected function get_active_modules_with_tags() {
		$active_modules = $this->modules->get_active_modules();

		$active_modules = array_filter(
			$active_modules,
			function ( $module ) {
				return $module instanceof Module_With_Tag;
			}
		);

		return $active_modules;
	}

	/**
	 * Checks if tag exists.
	 *
	 * @since 1.119.0
	 *
	 * @param Module_With_Tag $module  Module instance.
	 * @param string          $content Content to search for the tags.
	 * @param string          $module_label Content URL page name appended to the module name to identify multiple tags for a module.
	 *
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	protected function check_if_tag_exists( $module, $content, $module_label = null ) {
		$check_tag    = $module->has_placed_tag_in_content( $content );
		$module_label = $module_label ? $module_label : $module->name;

		switch ( $check_tag ) {
			case Module_Tag_Matchers::TAG_EXISTS_WITH_COMMENTS:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_label,
					__( 'Tag detected and placed by Site Kit.', 'google-site-kit' )
				);

			case Module_Tag_Matchers::TAG_EXISTS:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_label,
					__( 'Tag detected but could not verify that Site Kit placed the tag.', 'google-site-kit' )
				);

			case Module_Tag_Matchers::NO_TAG_FOUND:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_label,
					__( 'No tag detected.', 'google-site-kit' )
				);

			default:
				return sprintf(
					'<li><strong>%s</strong>: %s</li>',
					$module_label,
					__( 'No tag detected.', 'google-site-kit' )
				);
		}
	}
}
