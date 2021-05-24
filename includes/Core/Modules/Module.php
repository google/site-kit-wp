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
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Exception\Insufficient_Scopes_Exception;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Cache;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google_Service;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

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
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null
	) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
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
	 * Returns all module information data for passing it to JavaScript.
	 *
	 * @since 1.0.0
	 *
	 * @return array Module information data.
	 */
	public function prepare_info_for_js() {
		// TODO: Modify this to ditch unnecessary backward-compatibility.
		return array(
			'slug'         => $this->slug,
			'name'         => $this->name,
			'description'  => $this->description,
			'sort'         => $this->order,
			'homepage'     => $this->homepage,
			'required'     => $this->depends_on,
			'autoActivate' => $this->force_active,
			'internal'     => $this->internal,
			'screenID'     => $this instanceof Module_With_Screen ? $this->get_screen()->get_slug() : false,
			'settings'     => $this instanceof Module_With_Settings ? $this->get_settings()->get() : false,
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
	 * Gets data for multiple datapoints in one go.
	 *
	 * When needing to fetch multiple pieces of data at once, this method provides a more performant approach than
	 * {@see Module::get_data()} by combining multiple external requests into a single one.
	 *
	 * @since 1.0.0
	 *
	 * @param \stdClass[]|Data_Request[] $datasets List of datapoints with data attached.
	 * @return array List of responses. Each item is either the response data, or a WP_Error on failure.
	 */
	final public function get_batch_data( array $datasets ) {
		// Ensure all services are initialized.
		try {
			$this->get_service( 'default' );
		} catch ( Exception $e ) {
			// Internal error.
			if ( ! is_array( $this->google_services ) ) {
				return array();
			}
		}

		$restore_defer = $this->with_client_defer( true );

		$datapoint_definitions = $this->get_datapoint_definitions();
		$service_batches       = array();

		$data_requests = array();
		$results       = array();
		foreach ( $datasets as $dataset ) {
			if ( ! $dataset instanceof Data_Request ) {
				$dataset = new Data_Request(
					'GET',
					'modules',
					$dataset->identifier,
					$dataset->datapoint,
					(array) $dataset->data,
					$dataset->key
				);
			}

			/* @var Data_Request $dataset Request object. */
			if ( $this->slug !== $dataset->identifier ) {
				continue;
			}

			$definition_key = "{$dataset->method}:{$dataset->datapoint}";
			if ( ! isset( $datapoint_definitions[ $definition_key ] ) ) {
				continue;
			}

			$key                   = $dataset->key ?: wp_rand();
			$data_requests[ $key ] = $dataset;
			$datapoint             = $dataset->datapoint;

			try {
				$this->validate_data_request( $dataset );
				$request = $this->create_data_request( $dataset );
			} catch ( Exception $e ) {
				$request = $this->exception_to_error( $e, $datapoint );
			}

			if ( is_wp_error( $request ) ) {
				$results[ $key ] = $request;
				continue;
			}

			if ( $request instanceof Closure ) {
				try {
					$response        = $request();
					$results[ $key ] = $response;

					if ( ! is_wp_error( $response ) ) {
						$results[ $key ] = $this->parse_data_response( $dataset, $response );
					}
				} catch ( Exception $e ) {
					$results[ $key ] = $this->exception_to_error( $e, $datapoint );
				}
				continue;
			}

			$datapoint_service = $datapoint_definitions[ $definition_key ]['service'];
			if ( empty( $datapoint_service ) ) {
				continue;
			}

			if ( ! isset( $service_batches[ $datapoint_service ] ) ) {
				$service_batches[ $datapoint_service ] = $this->google_services[ $datapoint_service ]->createBatch();
			}

			$service_batches[ $datapoint_service ]->add( $request, $key );
			$results[ $key ] = $definition_key;
		}

		foreach ( $service_batches as $service_identifier => $batch ) {
			try {
				$batch_results = $batch->execute();
			} catch ( Exception $e ) {
				// Set every result of this batch to the exception.
				foreach ( $results as $key => $definition_key ) {
					if ( is_wp_error( $definition_key ) ) {
						continue;
					}

					$datapoint_service = ! empty( $datapoint_definitions[ $definition_key ] )
						? $datapoint_definitions[ $definition_key ]['service']
						: null;

					if ( is_string( $definition_key ) && $service_identifier === $datapoint_service ) {
						$results[ $key ] = $this->exception_to_error( $e, explode( ':', $definition_key, 2 )[1] );
					}
				}
				continue;
			}

			foreach ( $batch_results as $key => $result ) {
				if ( 0 === strpos( $key, 'response-' ) ) {
					$key = substr( $key, 9 );
				}
				if ( ! isset( $results[ $key ] ) || ! is_string( $results[ $key ] ) ) {
					continue;
				}

				if ( ! $result instanceof Exception ) {
					$results[ $key ] = $result;
					$results[ $key ] = $this->parse_data_response( $data_requests[ $key ], $result );
				} else {
					$definition_key  = $results[ $key ];
					$results[ $key ] = $this->exception_to_error( $result, explode( ':', $definition_key, 2 )[1] );
				}
			}
		}

		$restore_defer();

		// Cache the results for storybook.
		if (
			! empty( $results )
			&& null !== $this->context->input()->filter( INPUT_GET, 'datacache' )
			&& current_user_can( 'manage_options' )
		) {
			$cache = new Cache();
			$cache->cache_batch_results( $datasets, $results );
		}

		return $results;
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
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * // phpcs:ignore Squiz.Commenting.FunctionComment.InvalidNoReturn
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 * @throws Invalid_Datapoint_Exception Override in a sub-class.
	 */
	protected function create_data_request( Data_Request $data ) {
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
	 *
	 * phpcs:disable Squiz.Commenting.FunctionCommentThrowTag.Missing
	 */
	final protected function execute_data_request( Data_Request $data ) {
		try {
			$this->validate_data_request( $data );

			$request = $this->make_data_request( $data );

			if ( is_wp_error( $request ) ) {
				return $request;
			} elseif ( $request instanceof Closure ) {
				$response = $request();
			} elseif ( $request instanceof RequestInterface ) {
				$response = $this->get_client()->execute( $request );
			} else {
				return new WP_Error(
					'invalid_datapoint_request',
					__( 'Invalid datapoint request.', 'google-site-kit' ),
					array( 'status' => 400 )
				);
			}
		} catch ( Exception $e ) {
			return $this->exception_to_error( $e, $data->datapoint );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->parse_data_response( $data, $response );
	}

	/**
	 * Validates the given data request.
	 *
	 * @since 1.9.0
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * @throws Invalid_Datapoint_Exception   Thrown if the datapoint does not exist.
	 * @throws Insufficient_Scopes_Exception Thrown if the user has not granted
	 *                                       necessary scopes required by the datapoint.
	 */
	private function validate_data_request( Data_Request $data ) {
		$definitions   = $this->get_datapoint_definitions();
		$datapoint_key = "$data->method:$data->datapoint";

		// All datapoints must be defined.
		if ( empty( $definitions[ $datapoint_key ] ) ) {
			throw new Invalid_Datapoint_Exception();
		}

		if ( empty( $definitions[ $datapoint_key ]['scopes'] ) ) {
			return;
		}

		$datapoint = $definitions[ $datapoint_key ];

		// If the datapoint requires specific scopes, ensure they are satisfied.
		if ( ! $this->authentication->get_oauth_client()->has_sufficient_scopes( $datapoint['scopes'] ) ) {
			$request_scopes_message = ! empty( $datapoint['request_scopes_message'] )
				? $datapoint['request_scopes_message']
				: __( 'You’ll need to grant Site Kit permission to do this.', 'google-site-kit' );

			throw new Insufficient_Scopes_Exception( $request_scopes_message, 0, null, $datapoint['scopes'] );
		}
	}

	/**
	 * Facilitates the creation of a request object for execution.
	 *
	 * @since 1.9.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|Closure|WP_Error
	 */
	private function make_data_request( Data_Request $data ) {
		$definitions = $this->get_datapoint_definitions();

		// We only need to initialize the client if this datapoint relies on a service.
		$requires_client = ! empty( $definitions[ "$data->method:$data->datapoint" ]['service'] );

		if ( $requires_client ) {
			$restore_defer = $this->with_client_defer( true );
		}

		$request = $this->create_data_request( $data );

		if ( isset( $restore_defer ) ) {
			$restore_defer();
		}

		return $request;
	}

	/**
	 * Parses a date range string into a start date and an end date.
	 *
	 * @since 1.0.0
	 *
	 * @param string $range         Date range string. Either 'last-7-days', 'last-14-days', 'last-90-days', or
	 *                              'last-28-days' (default).
	 * @param string $multiplier    Optional. How many times the date range to get. This value can be specified if the
	 *                              range should be request multiple times back. Default 1.
	 * @param int    $offset        Days the range should be offset by. Default 1. Used by Search Console where
	 *                              data is delayed by two days.
	 * @param bool   $previous      Whether to select the previous period. Default false.
	 * @param bool   $weekday_align Whether to align the previous period days of the week to current period. Default false.
	 *
	 * @return array List with two elements, the first with the start date and the second with the end date, both as
	 *               'Y-m-d'.
	 */
	protected function parse_date_range( $range, $multiplier = 1, $offset = 1, $previous = false, $weekday_align = false ) {
		preg_match( '*-(\d+)-*', $range, $matches );
		$number_of_days = $multiplier * ( isset( $matches[1] ) ? $matches[1] : 28 );

		// Calculate the end date. For previous period requests, offset period by the number of days in the request.
		$end_date_offset = $previous ? $offset + $number_of_days : $offset;
		$date_end        = gmdate( 'Y-m-d', strtotime( $end_date_offset . ' days ago' ) );

		// Set the start date.
		$start_date_offset = $end_date_offset + $number_of_days - 1;
		$date_start        = gmdate( 'Y-m-d', strtotime( $start_date_offset . ' days ago' ) );

		// When weekday_align is true and request is for a previous period,
		// ensure the last & previous periods align by day of the week.
		$date_end_day_of_week      = gmdate( 'w', strtotime( $date_end ) );
		$previous_date_end_of_week = gmdate( 'w', strtotime( $offset . ' days ago' ) );
		if ( $weekday_align && $previous && $date_end_day_of_week !== $previous_date_end_of_week ) {
			// Adjust the date to closest period that matches the same days of the week.
			$off_by = $number_of_days % 7;
			if ( $off_by > 3 ) {
				$off_by = $off_by - 7;
			}

			// Move the date to match the same day of the week.
			$date_end   = gmdate( 'Y-m-d', strtotime( $off_by . ' days', strtotime( $date_end ) ) );
			$date_start = gmdate( 'Y-m-d', strtotime( $off_by . ' days', strtotime( $date_start ) ) );
		}

		return array( $date_start, $date_end );
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
	 * Permutes site URL to cover all different variants of it (not considering the path).
	 *
	 * @since 1.0.0
	 *
	 * @param string $site_url Site URL to get permutations for.
	 * @return array List of permutations.
	 */
	final protected function permute_site_url( $site_url ) {
		$urls = array();

		// Get host url.
		$host = wp_parse_url( $site_url, PHP_URL_HOST );

		// Add http:// and https:// to host.
		$urls[] = 'https://' . $host;
		$urls[] = 'http://' . $host;

		if ( 0 === strpos( $host, 'www.' ) ) {
			$urls[] = 'https://' . substr( $host, 4 );
			$urls[] = 'http://' . substr( $host, 4 );
		} else {
			$urls[] = 'https://www.' . $host;
			$urls[] = 'http://www.' . $host;
		}

		return $urls;
	}

	/**
	 * Gets the Google client the module uses.
	 *
	 * This method should be used to access the client.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now returns Google_Site_Kit_Client instance.
	 *
	 * @return Google_Site_Kit_Client Google client instance.
	 *
	 * @throws Exception Thrown when the module did not correctly set up the client.
	 */
	final protected function get_client() {
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
	protected function setup_services( Google_Site_Kit_Client $client ) {
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
				'force_active' => false,
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
	 *
	 * @param Exception $e         Exception object.
	 * @param string    $datapoint Datapoint originally requested.
	 * @return WP_Error WordPress error object.
	 */
	protected function exception_to_error( Exception $e, $datapoint ) {
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
			$reconnect_url = $auth_client->get_proxy_setup_url( $e->getAccessCode(), $code );
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
			function( $item ) {
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

}
