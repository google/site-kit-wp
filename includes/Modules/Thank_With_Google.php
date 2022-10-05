<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Modules\Thank_With_Google\Settings;
use Google\Site_Kit\Modules\Thank_With_Google\Supporter_Wall_Widget;
use Google\Site_Kit\Modules\Thank_With_Google\Web_Tag;
use Google\Site_Kit_Dependencies\Google_Service_SubscribewithGoogle;
use Google\Site_Kit_Dependencies\Google_Service_SubscribewithGoogle_ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google_Service_SubscribewithGoogle_Publication;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Thank with Google module.
 *
 * @since 1.78.0
 * @access private
 * @ignore
 */
final class Thank_With_Google extends Module
	implements Module_With_Assets, Module_With_Deactivation, Module_With_Owner, Module_With_Scopes, Module_With_Settings {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'thank-with-google';

	/**
	 * Transient created on module activation.
	 */
	const TRANSIENT_SETUP_TIMER = 'googlesitekit_thank_with_google_setup';

	/**
	 * Transients instance.
	 *
	 * @since 1.85.0
	 * @var Transients
	 */
	private $transients;

	/**
	 * Internal flag for whether the module is connected before saving/updating its settings.
	 *
	 * @since 1.85.0
	 * @var bool
	 */
	private $pre_update_is_connected;

	/**
	 * Constructor.
	 *
	 * @since 1.85.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets         Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );

		$this->transients = new Transients( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.78.0
	 */
	public function register() {
		$this->register_scopes_hook();

		add_action(
			'googlesitekit_pre_save_settings_' . self::MODULE_SLUG,
			function() {
				$this->pre_update_is_connected = $this->is_connected();
			}
		);

		add_action(
			'googlesitekit_save_settings_' . self::MODULE_SLUG,
			function() {
				if ( ! $this->pre_update_is_connected && $this->is_connected() ) {
					$this->transients->set( self::TRANSIENT_SETUP_TIMER, time(), WEEK_IN_SECONDS );
				}
			}
		);

		if ( ! $this->is_connected() ) {
			return;
		}

		add_action( 'template_redirect', $this->get_method_proxy( 'register_tag' ) );

		add_action(
			'widgets_init',
			function() {
				register_widget( Supporter_Wall_Widget::class );
			}
		);

		add_action(
			'admin_init',
			function() {
				if (
					! empty( $_GET['legacy-widget-preview']['idBase'] ) && // phpcs:ignore WordPress.Security.NonceVerification.Recommended
					Supporter_Wall_Widget::WIDGET_ID !== $_GET['legacy-widget-preview']['idBase'] // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				) {
					$this->register_tag();
				}
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/modules/thank-with-google/data/supporter-wall-prompt',
					)
				);
			}
		);

		add_filter(
			'rest_pre_dispatch',
			function( $result, $server, $request ) {
				$needle = sprintf( 'widget-types/%s/render', Supporter_Wall_Widget::WIDGET_ID );
				if ( stripos( $request->get_route(), $needle ) > 0 ) {
					$this->register_tag();
				}
				return $result;
			},
			10,
			3
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.78.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = $this->get_settings()->get();

		if ( ! $settings ) {
			return false;
		}

		if ( ! $settings['publicationID'] ) {
			return false;
		}

		if ( ! $settings['colorTheme'] ) {
			return false;
		}

		if ( ! $settings['ctaPlacement'] ) {
			return false;
		}

		if ( ! $settings['ctaPostTypes'] ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.78.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.81.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
		);
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.78.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'thank-with-google',
			'name'        => _x( 'Thank with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Let your supporters show appreciation of your work through virtual stickers and personal messages', 'google-site-kit' ),
			'order'       => 7,
			'homepage'    => __( 'https://publishercenter.google.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.78.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.78.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-thank-with-google',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-thank-with-google.js',
					'dependencies' => array(
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-modules',
						'googlesitekit-vendor',
					),
				)
			),
		);
	}

	/**
	 * Gets the supporter wall sidebars.
	 *
	 * @since 1.85.0
	 *
	 * @return array list of supporter wall sidebars, otherwise an empty list.
	 */
	protected function get_supporter_wall_sidebars() {
		$sidebars      = array();
		$all_sidebars  = wp_get_sidebars_widgets();
		$block_widgets = get_option( 'widget_block' );

		$pattern = sprintf( '/^%s[0-9]+$/i', preg_quote( Supporter_Wall_Widget::WIDGET_ID . '-', '/' ) );
		$substr  = sprintf( '"idBase":"%s"', Supporter_Wall_Widget::WIDGET_ID );

		$actual_sidebars_count = 0;
		foreach ( $all_sidebars as $sidebar_id => $widgets ) {
			// Skip the inactive widgets sidebar because it is not an actual sidebar.
			if ( 'wp_inactive_widgets' === $sidebar_id ) {
				continue;
			}

			$actual_sidebars_count++;

			$sidebar = wp_get_sidebar( $sidebar_id );
			foreach ( $widgets as $widget ) {
				$block_match = array();
				if ( preg_match( $pattern, $widget ) ) {
					$sidebars[ $sidebar_id ] = $sidebar['name'];
					break;
				} elseif (
					preg_match( '/block-(\d+)/', $widget, $block_match ) &&
					stripos( $block_widgets[ $block_match[1] ]['content'], $substr ) > 0
				) {
					$sidebars[ $sidebar_id ] = ucfirst( $sidebar['name'] );
					break;
				}
			}
		}

		if (
				// Only show the "All sidebars" text if there is more
				// than one sidebar.
				$actual_sidebars_count > 1 &&
				count( $sidebars ) === $actual_sidebars_count
			) {
			return array( __( 'All sidebars', 'google-site-kit' ) );
		}

		return array_values( $sidebars );

	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.79.0
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:publications'            => array( 'service' => 'subscribewithgoogle' ),
			'GET:supporter-wall-sidebars' => array( 'service' => '' ),
			'GET:supporter-wall-prompt'   => array( 'service' => '' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.79.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				$service = $this->get_service( 'subscribewithgoogle' );
				/* @var $service Google_Service_SubscribewithGoogle phpcs:ignore Squiz.PHP.CommentedOutCode.Found */

				$sc_settings    = $this->options->get( Search_Console_Settings::OPTION );
				$sc_property_id = $sc_settings['propertyID'];
				$raw_url        = str_replace(
					array( 'sc-domain:', 'https://', 'http://', 'www.' ),
					'',
					$sc_property_id
				);

				if ( 0 === strpos( $sc_property_id, 'sc-domain:' ) ) { // Domain property.
					$filter = join(
						' OR ',
						array_map(
							function ( $host ) {
								return sprintf( 'domain = "%s"', $host );
							},
							$this->permute_site_hosts( $raw_url )
						)
					);
				} else { // URL property.
					$filter = join(
						' OR ',
						array_map(
							function ( $host ) {
								return sprintf( 'site_url = "%s"', $host );
							},
							$this->permute_site_url( $raw_url )
						)
					);
				}

				return $service->publications->listPublications(
					array( 'filter' => $filter )
				);
			case 'GET:supporter-wall-sidebars':
				return function() {
					return $this->get_supporter_wall_sidebars();
				};
			case 'GET:supporter-wall-prompt':
				return function() {
					$supporter_wall_sidebars = $this->get_supporter_wall_sidebars();
					$setup_transient         = $this->transients->get( self::TRANSIENT_SETUP_TIMER );
					if ( empty( $supporter_wall_sidebars ) && ! $setup_transient ) {
						return array( 'supporterWallPrompt' => true );
					}
					return array( 'supporterWallPrompt' => false );
				};
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.81.0
	 *
	 * @param Data_Request $data Data request object.
	 * @param mixed        $response Request response.
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				/* @var $response Google_Service_SubscribewithGoogle_ListPublicationsResponse phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
				$publications = array_filter(
					(array) $response->getPublications(),
					function ( Google_Service_SubscribewithGoogle_Publication $publication ) {
						// Require only TwG-enabled publications.
						if ( empty( $publication['paymentOptions']['thankStickers'] ) ) {
							return false;
						}
						// If onboarding isn't completed, other criteria won't be available.
						if ( 'ONBOARDING_COMPLETE' !== $publication->getOnboardingState() ) {
							return true;
						}

						// This is left as array access as it is not guaranteed to be set.
						return ! empty( $publication['publicationPredicates']['businessPredicates']['supportsSiteKit'] );
					}
				);
				return array_values( $publications );
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.81.0
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'subscribewithgoogle' => new Google_Service_SubscribewithGoogle( $client ),
		);
	}

	/**
	 * Registers the Thank with Google tag.
	 *
	 * @since 1.80.0
	 */
	private function register_tag() {
		if ( $this->context->is_amp() ) {
			return;
		}

		$settings = $this->get_settings()->get();

		$tag = new Web_Tag( $settings['publicationID'], self::MODULE_SLUG );
		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( $tag->can_register() ) {
			$tag->set_cta_placement( $settings['ctaPlacement'] );
			$tag->set_cta_post_types( $settings['ctaPostTypes'] );
			$tag->set_color_theme( $settings['colorTheme'] );

			$tag->register();
		}
	}
}
