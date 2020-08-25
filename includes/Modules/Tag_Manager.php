<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit_Dependencies\Google_Service_TagManager;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_Account;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_Container;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_ListAccountsResponse;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_ListContainersResponse;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_ListTagsResponse;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_ListWorkspacesResponse;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Tag Manager module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Tag_Manager extends Module
	implements Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner {
	use Module_With_Scopes_Trait, Module_With_Settings_Trait, Module_With_Assets_Trait, Module_With_Owner_Trait;

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
	 * Internal flag set after print_gtm_no_js invoked for the first time.
	 *
	 * @since 1.7.1
	 * @var bool
	 */
	private $did_gtm_no_js = false;

	/**
	 * Internal flag set after print_amp_gtm is invoked for the first time.
	 *
	 * @since 1.14.0
	 * @var bool
	 */
	private $did_amp_gtm = false;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		// Tag Manager tag placement logic.
		add_action(
			'template_redirect',
			function() {
				// Bail early if we are checking for the tag presence from the back end.
				if ( $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN ) ) {
					return;
				}

				if ( ! $this->get_settings()->get()['useSnippet'] ) {
					return;
				}

				// Container needs to be checked based on whether AMP or non-AMP.
				$container_id = $this->get_data(
					'container-id',
					array(
						'usageContext' => $this->context->is_amp() ? self::USAGE_CONTEXT_AMP : self::USAGE_CONTEXT_WEB,
					)
				);
				if ( is_wp_error( $container_id ) || ! $container_id ) {
					return;
				}

				// At this point, we know the tag should be rendered, so let's take care of it
				// for AMP and non-AMP.
				if ( $this->context->is_amp() ) {
					$print_amp_gtm = function() use ( $container_id ) {
						$this->print_amp_gtm( $container_id );
					};
					// Which actions are run depends on the version of the AMP Plugin
					// (https://amp-wp.org/) available. Version >=1.3 exposes a
					// new, `amp_print_analytics` action.
					// For all AMP modes, AMP plugin version >=1.3.
					add_action( 'amp_print_analytics', $print_amp_gtm );
					// For AMP Standard and Transitional, AMP plugin version <1.3.
					add_action( 'wp_footer', $print_amp_gtm, 20 );
					// For AMP Reader, AMP plugin version <1.3.
					add_action( 'amp_post_template_footer', $print_amp_gtm, 20 );

					add_filter( // Load amp-analytics component for AMP Reader.
						'amp_post_template_data',
						function( $data ) {
							return $this->amp_data_load_analytics_component( $data );
						}
					);

					/**
					 * Fires when the Tag Manager tag for AMP has been initialized.
					 *
					 * This means that the tag will be rendered in the current request.
					 *
					 * @since 1.14.0
					 *
					 * @param string $container_id Tag Manager container ID used in the tag.
					 */
					do_action( 'googlesitekit_tagmanager_init_tag_amp', $container_id );
				} else {
					add_action( // For non-AMP.
						'wp_head',
						function() use ( $container_id ) {
							$this->print_gtm_js( $container_id );
						}
					);

					$print_gtm_no_js = function () use ( $container_id ) {
						$this->print_gtm_no_js( $container_id );
					};
					// For non-AMP (if `wp_body_open` supported).
					add_action( 'wp_body_open', $print_gtm_no_js, -9999 );
					// For non-AMP (as fallback).
					add_action( 'wp_footer', $print_gtm_no_js );

					/**
					 * Fires when the Tag Manager tag has been initialized.
					 *
					 * This means that the tag will be rendered in the current request.
					 *
					 * @since 1.14.0
					 *
					 * @param string $container_id Tag Manager container ID used in the tag.
					 */
					do_action( 'googlesitekit_tagmanager_init_tag', $container_id );
				}
			}
		);
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
	 * Returns all module information data for passing it to JavaScript.
	 *
	 * @since 1.0.0
	 *
	 * @return array Module information data.
	 */
	public function prepare_info_for_js() {
		$info = parent::prepare_info_for_js();

		$info['provides'] = array(
			__( 'Create tags without updating code', 'google-site-kit' ),
		);

		return $info;
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
		$amp_mode = $this->context->get_amp_mode();
		switch ( $amp_mode ) {
			case Context::AMP_MODE_PRIMARY:
				$container_ids = array(
					$this->get_data( 'container-id', array( 'usageContext' => self::USAGE_CONTEXT_AMP ) ),
				);
				break;
			case Context::AMP_MODE_SECONDARY:
				$container_ids = array(
					$this->get_data( 'container-id', array( 'usageContext' => self::USAGE_CONTEXT_WEB ) ),
					$this->get_data( 'container-id', array( 'usageContext' => self::USAGE_CONTEXT_AMP ) ),
				);
				break;
			default:
				$container_ids = array(
					$this->get_data( 'container-id', array( 'usageContext' => self::USAGE_CONTEXT_WEB ) ),
				);
		}

		$container_id_errors = array_filter(
			$container_ids,
			function( $container_id ) {
				return is_wp_error( $container_id ) || ! $container_id;
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
	 * Outputs Tag Manager script.
	 *
	 * @since 1.0.0
	 * @since 1.14.0 The `$container_id` parameter was added.
	 *
	 * @param string $container_id Tag Manager container ID to use in the snippet.
	 */
	protected function print_gtm_js( $container_id ) {
		?>
		<!-- Google Tag Manager added by Site Kit -->
		<script>( function( w, d, s, l, i ) {
				w[l] = w[l] || [];
				w[l].push( {'gtm.start': new Date().getTime(), event: 'gtm.js'} );
				var f = d.getElementsByTagName( s )[0],
					j = d.createElement( s ), dl = l != 'dataLayer' ? '&l=' + l : '';
				j.async = true;
				j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
				f.parentNode.insertBefore( j, f );
			} )( window, document, 'script', 'dataLayer', '<?php echo esc_js( $container_id ); ?>' );
		</script>
		<!-- End Google Tag Manager -->
		<?php
	}

	/**
	 * Outputs Tag Manager iframe for when the browser has JavaScript disabled.
	 *
	 * @since 1.0.0
	 * @since 1.14.0 The `$container_id` parameter was added.
	 *
	 * @param string $container_id Tag Manager container ID to use in the snippet.
	 */
	protected function print_gtm_no_js( $container_id ) {
		// Bail if this has already been run.
		if ( $this->did_gtm_no_js ) {
			return;
		}

		$this->did_gtm_no_js = true;

		?>
		<!-- Google Tag Manager (noscript) added by Site Kit -->
		<noscript>
			<iframe src="<?php echo esc_url( "https://www.googletagmanager.com/ns.html?id=$container_id" ); ?>" height="0" width="0" style="display:none;visibility:hidden"></iframe>
		</noscript>
		<!-- End Google Tag Manager (noscript) -->
		<?php
	}

	/**
	 * Outputs Tag Manager <amp-analytics> tag.
	 *
	 * @since 1.0.0
	 * @since 1.14.0 The `$container_id` parameter was added.
	 *
	 * @param string $container_id Tag Manager container ID to use in the snippet.
	 */
	protected function print_amp_gtm( $container_id ) {
		if ( $this->did_amp_gtm ) {
			return;
		}

		$this->did_amp_gtm = true;

		// Add the optoutElementId for compatibility with our Analytics opt-out mechanism.
		// This configuration object will be merged with the configuration object returned
		// by the `config` attribute URL.
		$gtm_amp_opt = array(
			'optoutElementId' => '__gaOptOutExtension',
		);

		?>
		<!-- Google Tag Manager added by Site Kit -->
		<amp-analytics config="<?php echo esc_url( "https://www.googletagmanager.com/amp.json?id=$container_id" ); ?>" data-credentials="include">
			<script type="application/json">
				<?php echo wp_json_encode( $gtm_amp_opt ); ?>
			</script>
		</amp-analytics>
		<!-- End Google Tag Manager -->
		<?php
	}

	/**
	 * Loads AMP analytics script if opted in.
	 *
	 * This only affects AMP Reader mode, the others are automatically covered.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	protected function amp_data_load_analytics_component( $data ) {
		if ( isset( $data['amp_component_scripts']['amp-analytics'] ) ) {
			return $data;
		}

		$data['amp_component_scripts']['amp-analytics'] = 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js';
		return $data;
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
			'GET:account-id'             => array( 'service' => '' ),
			'POST:account-id'            => array( 'service' => '' ),
			'GET:accounts'               => array( 'service' => 'tagmanager' ),
			'GET:accounts-containers'    => array( 'service' => 'tagmanager' ),
			'GET:connection'             => array( 'service' => '' ),
			'POST:connection'            => array( 'service' => '' ),
			'GET:container-id'           => array( 'service' => '' ),
			'POST:container-id'          => array( 'service' => '' ),
			'GET:containers'             => array( 'service' => 'tagmanager' ),
			'POST:create-container'      => array(
				'service'                => 'tagmanager',
				'scopes'                 => array( 'https://www.googleapis.com/auth/tagmanager.edit.containers' ),
				'request_scopes_message' => __( 'Additional permissions are required to create a new Tag Manager container on your behalf.', 'google-site-kit' ),
			),
			'GET:live-container-version' => array( 'service' => 'tagmanager' ),
			'GET:tag-permission'         => array( 'service' => 'tagmanager' ),
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
			case 'GET:account-id':
				return function() {
					$option = $this->get_settings()->get();

					if ( empty( $option['accountID'] ) ) {
						return new WP_Error( 'account_id_not_set', __( 'Tag Manager account ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
					}
					return $option['accountID'];
				};
			case 'POST:account-id':
				if ( ! isset( $data['accountID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$this->get_settings()->merge( array( 'accountID' => $data['accountID'] ) );
					return true;
				};
			// Intentional fallthrough.
			case 'GET:accounts':
			case 'GET:accounts-containers':
				return $this->get_tagmanager_service()->accounts->listAccounts();
			case 'GET:connection':
				return function() {
					$option = $this->get_settings()->get();

					$connection = array(
						'accountID'      => '',
						'containerID'    => '',
						'ampContainerID' => '',
					);

					return array_intersect_key( $option, $connection );
				};
			case 'POST:connection':
				return function() use ( $data ) {
					$this->get_settings()->merge(
						array(
							'accountID'   => $data['accountID'],
							'containerID' => $data['containerID'],
						)
					);
					return true;
				};
			case 'GET:container-id':
				return function() use ( $data ) {
					$option        = $this->get_settings()->get();
					$usage_context = $data['usageContext'] ?: self::USAGE_CONTEXT_WEB;

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

					$option_key = $this->context_map[ $usage_context ];

					if ( empty( $option[ $option_key ] ) ) {
						return new WP_Error(
							'container_id_not_set',
							__( 'Tag Manager container ID not set.', 'google-site-kit' ),
							array( 'status' => 404 )
						);
					}

					return $option[ $option_key ];
				};
			case 'POST:container-id':
				if ( ! isset( $data['containerID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'containerID' ), array( 'status' => 400 ) );
				}

				$usage_context = $data['usageContext'] ?: self::USAGE_CONTEXT_WEB;

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

				$option_key = $this->context_map[ $usage_context ];

				return function() use ( $data, $option_key ) {
					$this->get_settings()->merge( array( $option_key => $data['containerID'] ) );
					return true;
				};
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

				$usage_context = $data['usageContext'] ?: self::USAGE_CONTEXT_WEB;

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
			case 'GET:tag-permission':
				return function () use ( $data ) {
					// TODO: Remove 'tag' fallback once legacy components are refactored.
					$container_id = $data['containerID'] ?: $data['tag'];

					if ( ! $container_id ) {
						return new WP_Error(
							'missing_required_param',
							/* translators: %s: Missing parameter name */
							sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'containerID' ),
							array( 'status' => 400 )
						);
					}

					$accounts = $this->get_data( 'accounts' );

					if ( is_wp_error( $accounts ) ) {
						return $accounts;
					}

					$response = array(
						'accountID'   => '',
						'containerID' => $container_id,
						'permission'  => false,
					);

					try {
						$account_container      = $this->get_account_for_container( $container_id, $accounts );
						$response['accountID']  = $account_container['account']['accountId'];
						$response['permission'] = true;

						// Return full `account` and `container` for backwards compat with legacy setup component.
						// TODO: Remove $account_container from response.
						return array_merge( $response, $account_container );
					} catch ( Exception $exception ) {
						return $response;
					}
				};
		}

		throw new Invalid_Datapoint_Exception();
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
				$usage_context = $data['usageContext'] ?: self::USAGE_CONTEXT_WEB;
				/* @var Google_Service_TagManager_Container[] $containers Filtered containers. */
				$containers = array_filter(
					(array) $response->getContainer(),
					function ( Google_Service_TagManager_Container $container ) use ( $usage_context ) {
						return array_intersect( (array) $usage_context, $container->getUsageContext() );
					}
				);

				return array_values( $containers );
		}

		return $response;
	}

	/**
	 * Finds the account for the given container *public ID* from the given list of accounts.
	 *
	 * There is no way to query a container by its public ID (the ID that identifies the container on the client)
	 * so we must find it by listing the containers of the available accounts and matching on the public ID.
	 *
	 * @since 1.2.0
	 *
	 * @param string                              $container_id Container public ID (e.g. GTM-ABCDEFG).
	 * @param Google_Service_TagManager_Account[] $accounts     All accounts available to the current user.
	 *
	 * @return array {
	 *     @type Google_Service_TagManager_Account   $account   Account model instance.
	 *     @type Google_Service_TagManager_Container $container Container model instance.
	 * }
	 * @throws Exception Thrown if the given container ID does not belong to any of the given accounts.
	 */
	private function get_account_for_container( $container_id, $accounts ) {
		foreach ( (array) $accounts as $account ) {
			/* @var Google_Service_TagManager_Account $account Tag manager account */
			$containers = $this->get_data(
				'containers',
				array(
					'accountID'    => $account->getAccountId(),
					'usageContext' => array_keys( $this->context_map ),
				)
			);

			if ( is_wp_error( $containers ) ) {
				break;
			}

			foreach ( (array) $containers as $container ) {
				/* @var Google_Service_TagManager_Container $container Container instance */
				if ( $container_id === $container->getPublicId() ) {
					return compact( 'account', 'container' );
				}
			}
		}
		throw new Exception( __( 'No account found for given container', 'google-site-kit' ) );
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
			'slug'        => 'tagmanager',
			'name'        => _x( 'Tag Manager', 'Service name', 'google-site-kit' ),
			'description' => __( 'Tag Manager creates an easy to manage way to create tags on your site without updating code.', 'google-site-kit' ),
			'cta'         => __( 'Tag management made simple.', 'google-site-kit' ),
			'order'       => 6,
			'homepage'    => __( 'https://tagmanager.google.com/', 'google-site-kit' ),
			'learn_more'  => __( 'https://marketingplatform.google.com/about/tag-manager/', 'google-site-kit' ),
			'group'       => __( 'Marketing Platform', 'google-site-kit' ),
			'tags'        => array( 'marketing' ),
			'depends_on'  => array( 'analytics' ),
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
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
					),
				)
			),
		);
	}
}
