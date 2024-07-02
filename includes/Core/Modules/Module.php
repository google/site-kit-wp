<?php
/**
 * Class Google\Site_Kit\Core\Modules\Module
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Closure;
use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Exception\Insufficient_Scopes_Exception;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit_Dependencies\Google\Service as Google_Service;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Base class for a module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 *
 * @property-read string $slug         Unique module identifier.
 * @property-read string $name         Module name.
 * @property-read string $description  Module description.
 * @property-read int    $order        Module order within module lists.
 * @property-read string $homepage     External module homepage URL.
 * @property-read array  $depends_on   List of other module slugs the module depends on.
 * @property-read bool   $force_active Whether the module cannot be disabled.
 * @property-read bool   $internal     Whether the module is internal, thus without any UI.
 */
abstract class Module {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Option API instance.
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	protected $options;

	/**
	 * User Option API instance.
	 *
	 * @since 1.0.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.0.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Assets API instance.
	 *
	 * @since 1.40.0
	 * @var Assets
	 */
	protected $assets;

	/**
	 * Transients instance.
	 *
	 * @since 1.96.0
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Module information.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $info = array();

	/**
	 * Google API client instance.
	 *
	 * @since 1.0.0
	 * @var Google_Site_Kit_Client|null
	 */
	private $google_client;

	/**
	 * Google services as $identifier => $service_instance pairs.
	 *
	 * @since 1.0.0
	 * @var array|null
	 */
	private $google_services;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
		$this->assets         = $assets ?: new Assets( $this->context );
		$this->transients     = new Transients( $this->context );
		$this->info           = $this->parse_info( (array) $this->setup_info() );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	abstract public function register();

	/**
	 * Magic isset-er.
	 *
	 * Allows checking for existence of module information.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key to check..
	 * @return bool True if value for $key is available, false otherwise.
	 */
	final public function __isset( $key ) {
		return isset( $this->info[ $key ] );
	}

	/**
	 * Magic getter.
	 *
	 * Allows reading module information.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key to get value for.
	 * @return mixed Value for $key, or null if not available.
	 */
	final public function __get( $key ) {
		if ( ! isset( $this->info[ $key ] ) ) {
			return null;
		}

		return $this->info[ $key ];
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
		return true;
	}

	/**
	 * Gets data for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param string             $datapoint Datapoint to get data for.
	 * @param array|Data_Request $data      Optional. Contextual data to provide. Default empty array.
	 * @return mixed Data on success, or WP_Error on failure.
	 */
	final public function get_data( $datapoint, $data = array() ) {
		return $this->execute_data_request(
			new Data_Request( 'GET', 'modules', $this->slug, $datapoint, $data )
		);
	}

	/**
	 * Sets data for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param string             $datapoint Datapoint to get data for.
	 * @param array|Data_Request $data Data to set.
	 * @return mixed Response data on success, or WP_Error on failure.
	 */
	final public function set_data( $datapoint, $data ) {
		return $this->execute_data_request(
			new Data_Request( 'POST', 'modules', $this->slug, $datapoint, $data )
		);
	}

	/**
	 * Returns the list of datapoints the class provides data for.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of datapoints.
	 */
	final public function get_datapoints() {
		$keys        = array();
		$definitions = $this->get_datapoint_definitions();

		foreach ( array_keys( $definitions ) as $key ) {
			$parts = explode( ':', $key );
			$name  = end( $parts );
			if ( ! empty( $name ) ) {
				$keys[ $name ] = $name;
			}
		}

		return array_values( $keys );
	}

	/**
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @since 1.0.0
	 * @since 1.9.0 No longer abstract.
	 * @deprecated 1.12.0
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 */
	protected function get_datapoint_services() {
		_deprecated_function( __METHOD__, '1.12.0', static::class . '::get_datapoint_definitions' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		return array();
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.9.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array();
	}

	/**
	 * Gets the datapoint definition instance.
	 *
	 * @since 1.77.0
	 *
	 * @param string $datapoint_id Datapoint ID.
	 * @return Datapoint Datapoint instance.
	 * @throws Invalid_Datapoint_Exception Thrown if no datapoint exists by the given ID.
	 */
	protected function get_datapoint_definition( $datapoint_id ) {
		$definitions = $this->get_datapoint_definitions();

		// All datapoints must be defined.
		if ( empty( $definitions[ $datapoint_id ] ) ) {
			throw new Invalid_Datapoint_Exception();
		}

		return new Datapoint( $definitions[ $datapoint_id ] );
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * // phpcs:ignore Squiz.Commenting.FunctionComment.InvalidNoReturn
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 * @throws Invalid_Datapoint_Exception Override in a sub-class.
	 */
	protected function create_data_request( Data_Request $data ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found,Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		throw new Invalid_Datapoint_Exception();
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
		return $response;
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return mixed Data on success, or WP_Error on failure.
	 */
	final protected function execute_data_request( Data_Request $data ) {
		$restore_defers = array();
		try {
			$datapoint    = $this->get_datapoint_definition( "{$data->method}:{$data->datapoint}" );
			$oauth_client = $this->get_oauth_client_for_datapoint( $datapoint );

			$this->validate_datapoint_scopes( $datapoint, $oauth_client );
			$this->validate_base_scopes( $oauth_client );

			// In order for a request to leverage a client other than the default
			// it must return a RequestInterface (Google Services return this when defer = true).
			// If not deferred, the request will be executed immediately with the client
			// the service instance was instantiated with, which will always be the
			// default client, configured for the current user and provided in `get_service`.

			// Client defer is false by default, so we need to configure the default to defer
			// even if a different client will be the one to execute the request because
			// the default instance is what services are setup with.
			$restore_defers[] = $this->get_client()->withDefer( true );
			if ( $this->authentication->get_oauth_client() !== $oauth_client ) {
				$restore_defers[] = $oauth_client->get_client()->withDefer( true );

				$current_user = wp_get_current_user();
				// Adds the current user to the active consumers list.
				$oauth_client->add_active_consumer( $current_user );
			}

			$request = $this->create_data_request( $data );

			if ( is_wp_error( $request ) ) {
				return $request;
			} elseif ( $request instanceof Closure ) {
				$response = $request();
			} elseif ( $request instanceof RequestInterface ) {
				$response = $oauth_client->get_client()->execute( $request );
			} else {
				return new WP_Error(
					'invalid_datapoint_request',
					__( 'Invalid datapoint request.', 'google-site-kit' ),
					array( 'status' => 400 )
				);
			}
		} catch ( Exception $e ) {
			return $this->exception_to_error( $e, $data->datapoint );
		} finally {
			foreach ( $restore_defers as $restore_defer ) {
				$restore_defer();
			}
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->parse_data_response( $data, $response );
	}

	/**
	 * Validates necessary scopes for the given datapoint.
	 *
	 * @since 1.77.0
	 *
	 * @param Datapoint    $datapoint    Datapoint instance.
	 * @param OAuth_Client $oauth_client OAuth_Client instance.
	 * @throws Insufficient_Scopes_Exception Thrown if required scopes are not satisfied.
	 */
	private function validate_datapoint_scopes( Datapoint $datapoint, OAuth_Client $oauth_client ) {
		$required_scopes = $datapoint->get_required_scopes();

		if ( $required_scopes && ! $oauth_client->has_sufficient_scopes( $required_scopes ) ) {
			$message = $datapoint->get_request_scopes_message();

			throw new Insufficient_Scopes_Exception( $message, 0, null, $required_scopes );
		}
	}

	/**
	 * Validates necessary scopes for the module.
	 *
	 * @since 1.77.0
	 *
	 * @param OAuth_Client $oauth_client OAuth_Client instance.
	 * @throws Insufficient_Scopes_Exception Thrown if required scopes are not satisfied.
	 */
	private function validate_base_scopes( OAuth_Client $oauth_client ) {
		if ( ! $this instanceof Module_With_Scopes ) {
			return;
		}
		if ( ! $oauth_client->has_sufficient_scopes( $this->get_scopes() ) ) {
			$message = sprintf(
				/* translators: %s: module name */
				__( 'Site Kit can’t access the relevant data from %s because you haven’t granted all permissions requested during setup.', 'google-site-kit' ),
				$this->name
			);
			throw new Insufficient_Scopes_Exception( $message, 0, null, $this->get_scopes() );
		}
	}

	/**
	 * Gets the output for a specific frontend hook.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook Frontend hook name, e.g. 'wp_head', 'wp_footer', etc.
	 * @return string Output the hook generates.
	 */
	final protected function get_frontend_hook_output( $hook ) {
		$current_user_id = get_current_user_id();

		// Unset current user to make WordPress behave as if nobody was logged in.
		wp_set_current_user( false );

		ob_start();
		do_action( $hook );
		$output = ob_get_clean();

		// Restore the current user.
		wp_set_current_user( $current_user_id );

		return $output;
	}

	/**
	 * Gets the Google client the module uses.
	 *
	 * This method should be used to access the client.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now returns Google_Site_Kit_Client instance.
	 * @since 1.35.0 Updated to be public.
	 *
	 * @return Google_Site_Kit_Client Google client instance.
	 *
	 * @throws Exception Thrown when the module did not correctly set up the client.
	 */
	final public function get_client() {
		if ( null === $this->google_client ) {
			$client = $this->setup_client();
			if ( ! $client instanceof Google_Site_Kit_Client ) {
				throw new Exception( __( 'Google client not set up correctly.', 'google-site-kit' ) );
			}
			$this->google_client = $client;
		}

		return $this->google_client;
	}

	/**
	 * Gets the oAuth client instance to use for the given datapoint.
	 *
	 * @since 1.77.0
	 *
	 * @param Datapoint $datapoint Datapoint definition.
	 * @return OAuth_Client OAuth_Client instance.
	 */
	private function get_oauth_client_for_datapoint( Datapoint $datapoint ) {
		if (
			$this instanceof Module_With_Owner
			&& $this->is_shareable()
			&& $datapoint->is_shareable()
			&& $this->get_owner_id() !== get_current_user_id()
			&& ! $this->is_recoverable()
			&& current_user_can( Permissions::READ_SHARED_MODULE_DATA, $this->slug )
		) {
			$oauth_client = $this->get_owner_oauth_client();

			try {
				$this->validate_base_scopes( $oauth_client );
				return $oauth_client;
			} catch ( Exception $exception ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				// Fallthrough to default oauth client if scopes are unsatisfied.
			}
		}

		return $this->authentication->get_oauth_client();
	}

	/**
	 * Gets the Google service for the given identifier.
	 *
	 * This method should be used to access Google services.
	 *
	 * @since 1.0.0
	 *
	 * @param string $identifier Identifier for the service.
	 * @return Google_Service Google service instance.
	 *
	 * @throws Exception Thrown when the module did not correctly set up the services or when the identifier is invalid.
	 */
	final protected function get_service( $identifier ) {
		if ( null === $this->google_services ) {
			$services = $this->setup_services( $this->get_client() );
			if ( ! is_array( $services ) ) {
				throw new Exception( __( 'Google services not set up correctly.', 'google-site-kit' ) );
			}
			foreach ( $services as $service ) {
				if ( ! $service instanceof Google_Service ) {
					throw new Exception( __( 'Google services not set up correctly.', 'google-site-kit' ) );
				}
			}
			$this->google_services = $services;
		}

		if ( ! isset( $this->google_services[ $identifier ] ) ) {
			/* translators: %s: service identifier */
			throw new Exception( sprintf( __( 'Google service identified by %s does not exist.', 'google-site-kit' ), $identifier ) );
		}

		return $this->google_services[ $identifier ];
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	abstract protected function setup_info();

	/**
	 * Sets up the Google client the module should use.
	 *
	 * This method is invoked once by {@see Module::get_client()} to lazily set up the client when it is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now returns Google_Site_Kit_Client instance.
	 *
	 * @return Google_Site_Kit_Client Google client instance.
	 */
	protected function setup_client() {
		return $this->authentication->get_oauth_client()->get_client();
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
	protected function setup_services( Google_Site_Kit_Client $client ) {// phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		return array();
	}

	/**
	 * Sets whether or not to return raw requests and returns a callback to reset to the previous value.
	 *
	 * @since 1.2.0
	 *
	 * @param bool $defer Whether or not to return raw requests.
	 * @return callable Callback function that resets to the original $defer value.
	 */
	protected function with_client_defer( $defer ) {
		return $this->get_client()->withDefer( $defer );
	}

	/**
	 * Parses information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @param array $info Associative array of module info.
	 * @return array Parsed $info.
	 */
	private function parse_info( array $info ) {
		$info = wp_parse_args(
			$info,
			array(
				'slug'         => '',
				'name'         => '',
				'description'  => '',
				'order'        => 10,
				'homepage'     => '',
				'feature'      => '',
				'depends_on'   => array(),
				'force_active' => static::is_force_active(),
				'internal'     => false,
			)
		);

		if ( empty( $info['name'] ) && ! empty( $info['slug'] ) ) {
			$info['name'] = $info['slug'];
		}

		$info['depends_on'] = (array) $info['depends_on'];

		return $info;
	}

	/**
	 * Transforms an exception into a WP_Error object.
	 *
	 * @since 1.0.0
	 * @since 1.49.0 Uses the new `Google_Proxy::setup_url_v2` method when the `serviceSetupV2` feature flag is enabled.
	 * @since 1.70.0 $datapoint parameter is optional.
	 *
	 * @param Exception $e         Exception object.
	 * @param string    $datapoint Optional. Datapoint originally requested. Default is an empty string.
	 * @return WP_Error WordPress error object.
	 */
	protected function exception_to_error( Exception $e, $datapoint = '' ) { // phpcs:ignore phpcs:enable Generic.CodeAnalysis.UnusedFunctionParameter.Found,Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( $e instanceof WP_Errorable ) {
			return $e->to_wp_error();
		}

		$code = $e->getCode();

		$message       = $e->getMessage();
		$status        = is_numeric( $code ) && $code ? (int) $code : 500;
		$reason        = '';
		$reconnect_url = '';

		if ( $e instanceof Google_Service_Exception ) {
			$errors = $e->getErrors();
			if ( isset( $errors[0]['message'] ) ) {
				$message = $errors[0]['message'];
			}
			if ( isset( $errors[0]['reason'] ) ) {
				$reason = $errors[0]['reason'];
			}
		} elseif ( $e instanceof Google_Proxy_Code_Exception ) {
			$status        = 401;
			$code          = $message;
			$auth_client   = $this->authentication->get_oauth_client();
			$message       = $auth_client->get_error_message( $code );
			$google_proxy  = $this->authentication->get_google_proxy();
			$credentials   = $this->authentication->credentials()->get();
			$params        = array(
				'code'    => $e->getAccessCode(),
				'site_id' => ! empty( $credentials['oauth2_client_id'] ) ? $credentials['oauth2_client_id'] : '',
			);
			$params        = $google_proxy->add_setup_step_from_error_code( $params, $code );
			$reconnect_url = $google_proxy->setup_url( $params );
		}

		if ( empty( $code ) ) {
			$code = 'unknown';
		}

		$data = array(
			'status' => $status,
			'reason' => $reason,
		);

		if ( ! empty( $reconnect_url ) ) {
			$data['reconnectURL'] = $reconnect_url;
		}

		return new WP_Error( $code, $message, $data );
	}

	/**
	 * Parses the string list into an array of strings.
	 *
	 * @since 1.15.0
	 *
	 * @param string|array $items Items to parse.
	 * @return array An array of string items.
	 */
	protected function parse_string_list( $items ) {
		if ( is_string( $items ) ) {
			$items = explode( ',', $items );
		}

		if ( ! is_array( $items ) || empty( $items ) ) {
			return array();
		}

		$items = array_map(
			function ( $item ) {
				if ( ! is_string( $item ) ) {
					return false;
				}

				$item = trim( $item );
				if ( empty( $item ) ) {
					return false;
				}

				return $item;
			},
			$items
		);

		$items = array_filter( $items );
		$items = array_values( $items );

		return $items;
	}

	/**
	 * Determines whether the current request is for shared data.
	 *
	 * @since 1.98.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return bool TRUE if the request is for shared data, otherwise FALSE.
	 */
	protected function is_shared_data_request( Data_Request $data ) {
		$datapoint    = $this->get_datapoint_definition( "{$data->method}:{$data->datapoint}" );
		$oauth_client = $this->get_oauth_client_for_datapoint( $datapoint );

		if ( $this->authentication->get_oauth_client() !== $oauth_client ) {
			return true;
		}

		return false;
	}

	/**
	 * Determines whether the current module is forced to be active or not.
	 *
	 * @since 1.49.0
	 *
	 * @return bool TRUE if the module forced to be active, otherwise FALSE.
	 */
	public static function is_force_active() {
		return false;
	}

	/**
	 * Checks whether the module is shareable.
	 *
	 * @since 1.50.0
	 *
	 * @return bool True if module is shareable, false otherwise.
	 */
	public function is_shareable() {
		if ( $this instanceof Module_With_Owner && $this->is_connected() ) {
			$datapoints = $this->get_datapoint_definitions();
			foreach ( $datapoints as $details ) {
				if ( ! empty( $details['shareable'] ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Checks whether the module is recoverable.
	 *
	 * @since 1.78.0
	 *
	 * @return bool
	 */
	public function is_recoverable() {
		/**
		 * Filters the recoverable status of the module.
		 *
		 * @since 1.78.0
		 * @param bool   $_    Whether or not the module is recoverable. Default: false
		 * @param string $slug Module slug.
		 */
		return (bool) apply_filters( 'googlesitekit_is_module_recoverable', false, $this->slug );
	}
}
