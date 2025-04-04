<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Assets\Stylesheet;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Block_Support;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Admin_Post_List;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Contribute_With_Google_Block;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Subscribe_With_Google_Block;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Post_Product_ID;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronize_Publication;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Matchers;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Web_Tag;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle as Google_Service_SubscribewithGoogle;
use WP_Error;

/**
 * Class representing the Reader Revenue Manager module.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
final class Reader_Revenue_Manager extends Module implements Module_With_Scopes, Module_With_Assets, Module_With_Service_Entity, Module_With_Deactivation, Module_With_Owner, Module_With_Settings, Module_With_Tag, Module_With_Debug_Fields {
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;
	use Method_Proxy_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'reader-revenue-manager';

	/**
	 * Post_Product_ID instance.
	 *
	 * @since 1.148.0
	 *
	 * @var Post_Product_ID
	 */
	private $post_product_id;

	/**
	 * Contribute_With_Google_Block instance.
	 *
	 * @since 1.148.0
	 *
	 * @var Contribute_With_Google_Block
	 */
	private $contribute_with_google_block;

	/**
	 * Subscribe_With_Google_Block instance.
	 *
	 * @since 1.148.0
	 *
	 * @var Subscribe_With_Google_Block
	 */
	private $subscribe_with_google_block;

	/**
	 * Tag_Guard instance.
	 *
	 * @since 1.148.0
	 *
	 * @var Tag_Guard
	 */
	private $tag_guard;

	/**
	 * Constructor.
	 *
	 * @since 1.148.0
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

		$post_meta = new Post_Meta();
		$settings  = $this->get_settings();

		$this->post_product_id              = new Post_Product_ID( $post_meta, $settings );
		$this->tag_guard                    = new Tag_Guard( $settings, $this->post_product_id );
		$this->contribute_with_google_block = new Contribute_With_Google_Block( $this->context, $this->tag_guard, $settings );
		$this->subscribe_with_google_block  = new Subscribe_With_Google_Block( $this->context, $this->tag_guard, $settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.130.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$synchronize_publication = new Synchronize_Publication(
			$this,
			$this->user_options
		);
		$synchronize_publication->register();

		if ( $this->is_connected() ) {
			$this->post_product_id->register();

			$admin_post_list = new Admin_Post_List(
				$this->get_settings(),
				$this->post_product_id
			);
			$admin_post_list->register();

			if ( Block_Support::has_block_support() ) {
				$this->contribute_with_google_block->register();
				$this->subscribe_with_google_block->register();

				add_action(
					'enqueue_block_assets',
					$this->get_method_proxy(
						'enqueue_block_assets_for_non_sitekit_user'
					),
					40
				);

				add_action(
					'enqueue_block_editor_assets',
					$this->get_method_proxy(
						'enqueue_block_editor_assets_for_non_sitekit_user'
					),
					40
				);
			}
		}

		add_action( 'load-toplevel_page_googlesitekit-dashboard', array( $synchronize_publication, 'maybe_schedule_synchronize_publication' ) );
		add_action( 'load-toplevel_page_googlesitekit-settings', array( $synchronize_publication, 'maybe_schedule_synchronize_publication' ) );

		// Reader Revenue Manager tag placement logic.
		add_action( 'template_redirect', array( $this, 'register_tag' ) );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.130.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.131.0
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	public function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'subscribewithgoogle' => new Google_Service_SubscribewithGoogle( $client ),
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * @since 1.132.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();

		if ( ! empty( $options['publicationID'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.132.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.132.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.131.0
	 * @since 1.134.0 Checks if the user's publications includes the saved publication.
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access() {
		/**
		 * Get the SubscribewithGoogle service instance.
		 *
		 * @var Google_Service_SubscribewithGoogle
		 */
		$subscribewithgoogle = $this->get_service( 'subscribewithgoogle' );

		try {
			$response = $subscribewithgoogle->publications->listPublications();
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

		$publications   = array_values( $response->getPublications() );
		$settings       = $this->get_settings()->get();
		$publication_id = $settings['publicationID'];

		// Check if the $publications array contains a publication with the saved
		// publication ID.
		foreach ( $publications as $publication ) {
			if (
				isset( $publication['publicationId'] ) &&
				$publication_id === $publication['publicationId']
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.131.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:publications'                       => array(
				'service' => 'subscribewithgoogle',
			),
			'POST:sync-publication-onboarding-state' => array(
				'service' => 'subscribewithgoogle',
			),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.131.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception|Missing_Required_Param_Exception Thrown if the datapoint does not exist or parameters are missing.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				/**
				 * Get the SubscribewithGoogle service instance.
				 *
				 * @var Google_Service_SubscribewithGoogle
				 */
				$subscribewithgoogle = $this->get_service( 'subscribewithgoogle' );
				return $subscribewithgoogle->publications->listPublications( array( 'filter' => $this->get_publication_filter() ) );

			case 'POST:sync-publication-onboarding-state':
				if ( empty( $data['publicationID'] ) ) {
					throw new Missing_Required_Param_Exception( 'publicationID' );
				}

				if ( empty( $data['publicationOnboardingState'] ) ) {
					throw new Missing_Required_Param_Exception( 'publicationOnboardingState' );
				}

				$publications = $this->get_data( 'publications' );

				if ( is_wp_error( $publications ) ) {
					return $publications;
				}

				if ( empty( $publications ) ) {
					return new WP_Error(
						'publication_not_found',
						__( 'Publication not found.', 'google-site-kit' ),
						array( 'status' => 404 )
					);
				}

				$publication = array_filter(
					$publications,
					function ( $publication ) use ( $data ) {
						return $publication->getPublicationId() === $data['publicationID'];
					}
				);

				if ( empty( $publication ) ) {
					return new WP_Error(
						'publication_not_found',
						__( 'Publication not found.', 'google-site-kit' ),
						array( 'status' => 404 )
					);
				}

				$publication          = reset( $publication );
				$new_onboarding_state = $publication->getOnboardingState();

				if ( $new_onboarding_state === $data['publicationOnboardingState'] ) {
					return function () {
						return (object) array();
					};
				}

				$settings = $this->get_settings();

				if ( $data['publicationID'] === $settings->get()['publicationID'] ) {
					$settings->merge(
						array(
							'publicationOnboardingState' => $new_onboarding_state,
						)
					);
				}

				return function () use ( $data, $new_onboarding_state ) {
					return (object) array(
						'publicationID'              => $data['publicationID'],
						'publicationOnboardingState' => $new_onboarding_state,
					);
				};
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.131.0
	 *
	 * @param Data_Request $data     Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				$publications = $response->getPublications();
				return array_values( $publications );
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.130.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Reader Revenue Manager', 'Service name', 'google-site-kit' ),
			'description' => __( 'Reader Revenue Manager helps publishers grow, retain, and engage their audiences, creating new revenue opportunities', 'google-site-kit' ),
			'homepage'    => 'https://publishercenter.google.com',
		);
	}

	/**
	 * Gets the filter for retrieving publications for the current site.
	 *
	 * @since 1.131.0
	 *
	 * @return string Permutations for site hosts or URL.
	 */
	private function get_publication_filter() {
		$sc_settings    = $this->options->get( Search_Console_Settings::OPTION );
		$sc_property_id = $sc_settings['propertyID'];

		if ( 0 === strpos( $sc_property_id, 'sc-domain:' ) ) { // Domain property.
			$host   = str_replace( 'sc-domain:', '', $sc_property_id );
			$filter = join(
				' OR ',
				array_map(
					function ( $domain ) {
						return sprintf( 'domain = "%s"', $domain );
					},
					URL::permute_site_hosts( $host )
				)
			);
		} else { // URL property.
			$filter = join(
				' OR ',
				array_map(
					function ( $url ) {
						return sprintf( 'site_url = "%s"', $url );
					},
					URL::permute_site_url( $sc_property_id )
				)
			);
		}

		return $filter;
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.131.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		$assets = array(
			new Script(
				'googlesitekit-modules-reader-revenue-manager',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-reader-revenue-manager.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-notifications',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);

		if ( Block_Support::has_block_support() ) {
			$assets[] = new Script(
				'blocks-reader-revenue-manager-block-editor-plugin',
				array(
					'src'           => $base_url . 'js/blocks/reader-revenue-manager/block-editor-plugin/index.js',
					'dependencies'  => array(
						'googlesitekit-data',
						'googlesitekit-i18n',
						'googlesitekit-modules',
						'googlesitekit-modules-reader-revenue-manager',
					),
					'execution'     => 'defer',
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
				)
			);

			$assets[] = new Stylesheet(
				'blocks-reader-revenue-manager-block-editor-plugin-styles',
				array(
					'src'           => $base_url . 'js/blocks/reader-revenue-manager/block-editor-plugin/editor-styles.css',
					'dependencies'  => array(),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
				)
			);

			$assets[] = new Script(
				'blocks-contribute-with-google',
				array(
					'src'           => $base_url . 'js/blocks/reader-revenue-manager/contribute-with-google/index.js',
					'dependencies'  => array(
						'googlesitekit-data',
						'googlesitekit-i18n',
						'googlesitekit-modules',
						'googlesitekit-modules-reader-revenue-manager',
					),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
					'execution'     => 'defer',
				)
			);

			$assets[] = new Script(
				'blocks-subscribe-with-google',
				array(
					'src'           => $base_url . 'js/blocks/reader-revenue-manager/subscribe-with-google/index.js',
					'dependencies'  => array(
						'googlesitekit-data',
						'googlesitekit-i18n',
						'googlesitekit-modules',
						'googlesitekit-modules-reader-revenue-manager',
					),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
					'execution'     => 'defer',
				)
			);

			if ( $this->is_non_sitekit_user() ) {
				$assets[] = new Script(
					'blocks-contribute-with-google-non-sitekit-user',
					array(
						'src'           => $base_url . 'js/blocks/reader-revenue-manager/contribute-with-google/non-site-kit-user.js',
						'dependencies'  => array(
							'googlesitekit-i18n',
						),
						'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
						'execution'     => 'defer',
					)
				);

				$assets[] = new Script(
					'blocks-subscribe-with-google-non-sitekit-user',
					array(
						'src'           => $base_url . 'js/blocks/reader-revenue-manager/subscribe-with-google/non-site-kit-user.js',
						'dependencies'  => array( 'googlesitekit-i18n' ),
						'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
						'execution'     => 'defer',
					)
				);
			}

			$assets[] = new Stylesheet(
				'blocks-reader-revenue-manager-common-editor-styles',
				array(
					'src'           => $base_url . 'js/blocks/reader-revenue-manager/common/editor-styles.css',
					'dependencies'  => array(),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_BLOCK_EDITOR ),
				)
			);
		}

		return $assets;
	}

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.132.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers() {
		return new Tag_Matchers();
	}

	/**
	 * Registers the Reader Revenue Manager tag.
	 *
	 * @since 1.132.0
	 */
	public function register_tag() {
		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();

		$tag = new Web_Tag( $settings['publicationID'], self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( $this->tag_guard );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( ! $tag->can_register() ) {
			return;
		}

		$product_id      = $settings['productID'];
		$post_product_id = '';

		if ( is_singular() ) {
			$post_product_id = $this->post_product_id->get( get_the_ID() );

			if ( ! empty( $post_product_id ) ) {
				$product_id = $post_product_id;
			}
		}

		// Extract the product ID from the setting, which is in the format
		// of `publicationID:productID`.
		if ( 'openaccess' !== $product_id ) {
			$separator_index = strpos( $product_id, ':' );

			if ( false !== $separator_index ) {
				$product_id = substr( $product_id, $separator_index + 1 );
			}
		}

		$tag->set_product_id( $product_id );
		$tag->register();
	}

	/**
	 * Checks if the current user is a non-Site Kit user.
	 *
	 * @since 1.150.0
	 *
	 * @return bool True if the current user is a non-Site Kit user, false otherwise.
	 */
	private function is_non_sitekit_user() {
		return ! ( current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD ) );
	}

	/**
	 * Enqueues block assets for non-Site Kit users.
	 *
	 * This is used for enqueueing styles to ensure they are loaded in all block editor contexts including iframes.
	 *
	 * @since 1.150.0
	 *
	 * @return void
	 */
	private function enqueue_block_assets_for_non_sitekit_user() {
		// Include a check for is_admin() to ensure the styles are only enqueued on admin screens.
		if ( is_admin() && $this->is_non_sitekit_user() ) {
			// Enqueue styles.
			$this->assets->enqueue_asset( 'blocks-reader-revenue-manager-common-editor-styles' );
		}
	}

	/**
	 * Enqueues block editor assets for non-Site Kit users.
	 *
	 * @since 1.150.0
	 *
	 * @return void
	 */
	private function enqueue_block_editor_assets_for_non_sitekit_user() {
		if ( $this->is_non_sitekit_user() ) {
			// Enqueue scripts.
			$this->assets->enqueue_asset( 'blocks-contribute-with-google-non-sitekit-user' );
			$this->assets->enqueue_asset( 'blocks-subscribe-with-google-non-sitekit-user' );
		}
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.132.0
	 *
	 * @return array An array of all debug fields.
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		$snippet_mode_values = array(
			'post_types' => __( 'Post types', 'google-site-kit' ),
			'per_post'   => __( 'Per post', 'google-site-kit' ),
			'sitewide'   => __( 'Sitewide', 'google-site-kit' ),
		);

		$extract_product_id = function ( $product_id ) {
			$parts = explode( ':', $product_id );
			return isset( $parts[1] ) ? $parts[1] : $product_id;
		};

		$redact_pub_in_product_id = function ( $product_id ) {
			$parts = explode( ':', $product_id );
			if ( isset( $parts[1] ) ) {
				return Debug_Data::redact_debug_value( $parts[0] ) . ':' . $parts[1];
			}
			return $product_id;
		};

		$debug_fields = array(
			'reader_revenue_manager_publication_id'        => array(
				'label' => __( 'Reader Revenue Manager: Publication ID', 'google-site-kit' ),
				'value' => $settings['publicationID'],
				'debug' => Debug_Data::redact_debug_value( $settings['publicationID'] ),
			),
			'reader_revenue_manager_publication_onboarding_state' => array(
				'label' => __( 'Reader Revenue Manager: Publication onboarding state', 'google-site-kit' ),
				'value' => $settings['publicationOnboardingState'],
				'debug' => $settings['publicationOnboardingState'],
			),
			'reader_revenue_manager_available_product_ids' => array(
				'label' => __( 'Reader Revenue Manager: Available product IDs', 'google-site-kit' ),
				'value' => implode( ', ', array_map( $extract_product_id, $settings['productIDs'] ) ),
				'debug' => implode( ', ', array_map( $redact_pub_in_product_id, $settings['productIDs'] ) ),
			),
			'reader_revenue_manager_payment_option'        => array(
				'label' => __( 'Reader Revenue Manager: Payment option', 'google-site-kit' ),
				'value' => $settings['paymentOption'],
				'debug' => $settings['paymentOption'],
			),
			'reader_revenue_manager_snippet_mode'          => array(
				'label' => __( 'Reader Revenue Manager: Snippet placement', 'google-site-kit' ),
				'value' => $snippet_mode_values[ $settings['snippetMode'] ],
				'debug' => $settings['snippetMode'],
			),
			'reader_revenue_manager_product_id'            => array(
				'label' => __( 'Reader Revenue Manager: Product ID', 'google-site-kit' ),
				'value' => $extract_product_id( $settings['productID'] ),
				'debug' => $redact_pub_in_product_id( $settings['productID'] ),
			),
		);

		if ( 'post_types' === $settings['snippetMode'] ) {
			$debug_fields['reader_revenue_manager_post_types'] = array(
				'label' => __( 'Reader Revenue Manager: Post types', 'google-site-kit' ),
				'value' => implode( ', ', $settings['postTypes'] ),
				'debug' => implode( ', ', $settings['postTypes'] ),
			);
		}

		return $debug_fields;
	}
}
