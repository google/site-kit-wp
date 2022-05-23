<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Tags\Guards\Tag_Production_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Tag_Manager\AMP_Tag;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit\Modules\Tag_Manager\Tag_Guard;
use Google\Site_Kit\Modules\Tag_Manager\Web_Tag;
use Google\Site_Kit_Dependencies\Google\Service\TagManager as Google_Service_TagManager;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Container as Google_Service_TagManager_Container;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Tag Manager module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Tag_Manager extends Module
	implements Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner, Module_With_Deactivation {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'tagmanager';

	/**
	 * Container usage context for web.
	 */
	const USAGE_CONTEXT_WEB = 'web';

	/**
	 * Container usage context for AMP.
	 */
	const USAGE_CONTEXT_AMP = 'amp';

	/**
	 * Map of container usageContext to option key for containerID.
	 *
	 * @var array
	 */
	protected $context_map = array(
		self::USAGE_CONTEXT_WEB => 'containerID',
		self::USAGE_CONTEXT_AMP => 'ampContainerID',
	);

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		// Tag Manager tag placement logic.
		add_action( 'template_redirect', $this->get_method_proxy( 'register_tag' ) );
		// Filter the Analytics `canUseSnippet` value.
		add_filter( 'googlesitekit_analytics_can_use_snippet', $this->get_method_proxy( 'can_analytics_use_snippet' ), 10, 2 );
		// Filter whether certain users can be excluded from tracking.
		add_action( 'googlesitekit_allow_tracking_disabled', $this->get_method_proxy( 'filter_analytics_allow_tracking_disabled' ) );
		add_action( 'googlesitekit_analytics_tracking_opt_out', $this->get_method_proxy( 'analytics_tracking_opt_out' ) );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/tagmanager.readonly',
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = $this->get_settings()->get();
		$amp_mode = $this->context->get_amp_mode();

		switch ( $amp_mode ) {
			case Context::AMP_MODE_PRIMARY:
				$container_ids = array( $settings['ampContainerID'] );
				break;
			case Context::AMP_MODE_SECONDARY:
				$container_ids = array( $settings['containerID'], $settings['ampContainerID'] );
				break;
			default:
				$container_ids = array( $settings['containerID'] );
		}

		$container_id_errors = array_filter(
			$container_ids,
			function( $container_id ) {
				return ! $container_id;
			}
		);

		if ( ! empty( $container_id_errors ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.0.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array(
			'tagmanager_account_id'       => array(
				'label' => __( 'Tag Manager account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'] ),
			),
			'tagmanager_container_id'     => array(
				'label' => __( 'Tag Manager container ID', 'google-site-kit' ),
				'value' => $settings['containerID'],
				'debug' => Debug_Data::redact_debug_value( $settings['containerID'], 7 ),
			),
			'tagmanager_amp_container_id' => array(
				'label' => __( 'Tag Manager AMP container ID', 'google-site-kit' ),
				'value' => $settings['ampContainerID'],
				'debug' => Debug_Data::redact_debug_value( $settings['ampContainerID'], 7 ),
			),
			'tagmanager_use_snippet'      => array(
				'label' => __( 'Tag Manager snippet placed', 'google-site-kit' ),
				'value' => $settings['useSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useSnippet'] ? 'yes' : 'no',
			),
		);
	}

	/**
	 * Sanitizes a string to be used for a container name.
	 *
	 * @since 1.0.4
	 *
	 * @param string $name String to sanitize.
	 *
	 * @return string
	 */
	public static function sanitize_container_name( $name ) {
		// Remove any leading or trailing whitespace.
		$name = trim( $name );
		// Must not start with an underscore.
		$name = ltrim( $name, '_' );
		// Decode entities for special characters so that they are stripped properly.
		$name = wp_specialchars_decode( $name, ENT_QUOTES );
		// Convert accents to basic characters to prevent them from being stripped.
		$name = remove_accents( $name );
		// Strip all non-simple characters.
		$name = preg_replace( '/[^a-zA-Z0-9_., -]/', '', $name );
		// Collapse multiple whitespaces.
		$name = preg_replace( '/\s+/', ' ', $name );

		return $name;
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.9.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:accounts'               => array( 'service' => 'tagmanager' ),
			'GET:accounts-containers'    => array( 'service' => 'tagmanager' ),
			'GET:containers'             => array( 'service' => 'tagmanager' ),
			'POST:create-container'      => array(
				'service'                => 'tagmanager',
				'scopes'                 => array( 'https://www.googleapis.com/auth/tagmanager.edit.containers' ),
				'request_scopes_message' => __( 'Additional permissions are required to create a new Tag Manager container on your behalf.', 'google-site-kit' ),
			),
			'GET:live-container-version' => array( 'service' => 'tagmanager' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			// Intentional fallthrough.
			case 'GET:accounts':
			case 'GET:accounts-containers':
				return $this->get_tagmanager_service()->accounts->listAccounts();
			case 'GET:containers':
				if ( ! isset( $data['accountID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
				}
				return $this->get_tagmanager_service()->accounts_containers->listAccountsContainers( "accounts/{$data['accountID']}" );
			case 'POST:create-container':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}

				$usage_context = $data['usageContext'] ?: array( self::USAGE_CONTEXT_WEB, self::USAGE_CONTEXT_AMP );

				if ( empty( $this->context_map[ $usage_context ] ) ) {
					return new WP_Error(
						'invalid_param',
						sprintf(
						/* translators: 1: Invalid parameter name, 2: list of valid values */
							__( 'Request parameter %1$s is not one of %2$s', 'google-site-kit' ),
							'usageContext',
							implode( ', ', array_keys( $this->context_map ) )
						),
						array( 'status' => 400 )
					);
				}

				$account_id = $data['accountID'];

				if ( $data['name'] ) {
					$container_name = $data['name'];
				} else {
					// Use site name for container, fallback to domain of reference URL.
					$container_name = get_bloginfo( 'name' ) ?: wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST );
					// Prevent naming conflict (Tag Manager does not allow more than one with same name).
					if ( self::USAGE_CONTEXT_AMP === $usage_context ) {
						$container_name .= ' AMP';
					}
				}

				$container = new Google_Service_TagManager_Container();
				$container->setName( self::sanitize_container_name( $container_name ) );
				$container->setUsageContext( (array) $usage_context );

				return $this->get_tagmanager_service()->accounts_containers->create( "accounts/{$account_id}", $container );
			case 'GET:live-container-version':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				if ( ! isset( $data['internalContainerID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'internalContainerID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_tagmanager_service()->accounts_containers_versions->live(
					"accounts/{$data['accountID']}/containers/{$data['internalContainerID']}"
				);
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Creates GTM Container.
	 *
	 * @since 1.0.0
	 * @param string       $account_id    The account ID.
	 * @param string|array $usage_context The container usage context(s).
	 *
	 * @return string Container public ID.
	 * @throws Exception Throws an exception if raised during container creation.
	 */
	protected function create_container( $account_id, $usage_context = self::USAGE_CONTEXT_WEB ) {
		$restore_defer = $this->with_client_defer( false );

		// Use site name for container, fallback to domain of reference URL.
		$container_name = get_bloginfo( 'name' ) ?: wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST );
		// Prevent naming conflict (Tag Manager does not allow more than one with same name).
		if ( self::USAGE_CONTEXT_AMP === $usage_context ) {
			$container_name .= ' AMP';
		}
		$container_name = self::sanitize_container_name( $container_name );

		$container = new Google_Service_TagManager_Container();
		$container->setName( $container_name );
		$container->setUsageContext( (array) $usage_context );

		try {
			$new_container = $this->get_tagmanager_service()->accounts_containers->create( "accounts/{$account_id}", $container );
		} catch ( Exception $exception ) {
			$restore_defer();
			throw $exception;
		}

		$restore_defer();

		return $new_container->getPublicId();
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts':
				/* @var Google_Service_TagManager_ListAccountsResponse $response List accounts response. */
				return $response->getAccount();
			case 'GET:accounts-containers':
				/* @var Google_Service_TagManager_ListAccountsResponse $response List accounts response. */
				$response = array(
					// TODO: Parse this response to a regular array.
					'accounts'   => $response->getAccount(),
					'containers' => array(),
				);
				if ( 0 === count( $response['accounts'] ) ) {
					return $response;
				}
				if ( $data['accountID'] ) {
					$account_id = $data['accountID'];
				} else {
					$account_id = $response['accounts'][0]->getAccountId();
				}

				$containers = $this->get_data(
					'containers',
					array(
						'accountID'    => $account_id,
						'usageContext' => $data['usageContext'] ?: self::USAGE_CONTEXT_WEB,
					)
				);

				if ( is_wp_error( $containers ) ) {
					return $response;
				}

				return array_merge( $response, compact( 'containers' ) );
			case 'GET:containers':
				/* @var Google_Service_TagManager_ListContainersResponse $response Response object. */
				$usage_context = $data['usageContext'] ?: array( self::USAGE_CONTEXT_WEB, self::USAGE_CONTEXT_AMP );
				/* @var Google_Service_TagManager_Container[] $containers Filtered containers. */
				$containers = array_filter(
					(array) $response->getContainer(),
					function ( Google_Service_TagManager_Container $container ) use ( $usage_context ) {
						return array_intersect( (array) $usage_context, $container->getUsageContext() );
					}
				);

				return array_values( $containers );
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Gets the configured TagManager service instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Google_Service_TagManager instance.
	 * @throws Exception Thrown if the module did not correctly set up the service.
	 */
	private function get_tagmanager_service() {
		return $this->get_service( 'tagmanager' );
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Tag Manager', 'Service name', 'google-site-kit' ),
			'description' => __( 'Tag Manager creates an easy to manage way to create tags on your site without updating code', 'google-site-kit' ),
			'order'       => 6,
			'homepage'    => __( 'https://tagmanager.google.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now requires Google_Site_Kit_Client instance.
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'tagmanager' => new Google_Service_TagManager( $client ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.11.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-tagmanager',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-tagmanager.js',
					'dependencies' => array(
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-modules',
						'googlesitekit-modules-analytics',
						'googlesitekit-vendor',
					),
				)
			),
		);
	}

	/**
	 * Registers the Tag Manager tag.
	 *
	 * @since 1.24.0
	 */
	private function register_tag() {
		$is_amp          = $this->context->is_amp();
		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();

		$tag = $is_amp
			? new AMP_Tag( $settings['ampContainerID'], self::MODULE_SLUG )
			: new Web_Tag( $settings['containerID'], self::MODULE_SLUG );

		if ( ! $tag->is_tag_blocked() ) {
			$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
			$tag->use_guard( new Tag_Guard( $module_settings, $is_amp ) );
			$tag->use_guard( new Tag_Production_Guard() );

			if ( $tag->can_register() ) {
				$tag->register();
			}
		}
	}

	/**
	 * Filters whether or not the Analytics module's snippet should be controlled by its `useSnippet` setting.
	 *
	 * @since 1.28.0
	 * @since 1.75.0 Now requires current UA property ID as second parameter.
	 *
	 * @param boolean $original_value Original value of useSnippet setting.
	 * @param string  $ua_property_id Current UA property.
	 * @return boolean Filtered value.
	 */
	private function can_analytics_use_snippet( $original_value, $ua_property_id ) {
		$settings = $this->get_settings()->get();

		if ( ! empty( $settings['gaPropertyID'] ) && $settings['useSnippet'] && $settings['gaPropertyID'] === $ua_property_id ) {
			return false;
		}

		return $original_value;
	}

	/**
	 * Handles Analytics measurement opt-out for the configured Analytics property in the container(s).
	 *
	 * @since 1.41.0
	 *
	 * @param string $property_id Analytics property_id.
	 */
	private function analytics_tracking_opt_out( $property_id ) {
		$settings       = $this->get_settings()->get();
		$ga_property_id = $settings['gaPropertyID'];
		if ( ! $ga_property_id || $ga_property_id === $property_id ) {
			return;
		}

		BC_Functions::wp_print_inline_script_tag(
			sprintf(
				'window["ga-disable-%s"] = true;',
				esc_attr( $ga_property_id )
			)
		);

	}

	/**
	 * Filters whether or not the option to exclude certain users from tracking should be displayed.
	 *
	 * If Site Kit does not place the Analytics snippet (neither via Analytics nor via Tag Manager),
	 * the option to exclude certain users from tracking should not be displayed.
	 *
	 * @since 1.36.0
	 *
	 * @param boolean $allowed Whether to allow tracking exclusion.
	 * @return boolean Filtered value.
	 */
	private function filter_analytics_allow_tracking_disabled( $allowed ) {
		if ( $allowed ) {
			return true;
		}

		$settings = $this->get_settings()->get();

		if ( ! empty( $settings['gaPropertyID'] ) && $settings['useSnippet'] ) {
			return true;
		}

		return $allowed;
	}

}
