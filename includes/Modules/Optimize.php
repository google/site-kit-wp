<?php
/**
 * Class Google\Site_Kit\Modules\Optimize
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google_Client;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Optimize module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Optimize extends Module {

	const OPTION = 'googlesitekit_optimize_settings';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_filter( // For non-AMP.
			'googlesitekit_gtag_opt',
			function( $gtag_config ) {
				return $this->gtag_config_add_optimize_id( $gtag_config );
			}
		);

		$print_amp_optimize_experiment = function() {
			$this->print_amp_optimize_experiment();
		};
		add_action( 'wp_footer', $print_amp_optimize_experiment ); // For AMP Native and Transitional.
		add_action( 'amp_post_template_footer', $print_amp_optimize_experiment ); // For AMP Reader.

		add_filter( // Load amp-experiment component for AMP Reader.
			'amp_post_template_data',
			function( $data ) {
				return $this->amp_data_load_experiment_component( $data );
			}
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
			__( 'A/B or multivariate testing', 'google-site-kit' ),
			__( 'Improvement tracking', 'google-site-kit' ),
			__( 'Probability and confidence calculations', 'google-site-kit' ),
		);

		$optimize_id          = $this->get_data( 'optimize-id' );
		$amp_client_id_opt_in = $this->get_data( 'amp-client-id-opt-in' );
		$amp_experiment_json  = $this->get_data( 'amp-experiment-json' );

		$info['settings'] = array(
			'optimizeID'        => ! is_wp_error( $optimize_id ) ? $optimize_id : false,
			'ampClientIDOptIn'  => ! is_wp_error( $amp_client_id_opt_in ) ? $amp_client_id_opt_in : false,
			'ampExperimentJSON' => ! is_wp_error( $amp_experiment_json ) ? $amp_experiment_json : '',
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
		$optimize_id = $this->get_data( 'optimize-id' );
		if ( is_wp_error( $optimize_id ) ) {
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
		$this->options->delete( self::OPTION );
	}

	/**
	 * Expands gtag config options with optimize ID.
	 *
	 * @since 1.0.0
	 *
	 * @param array $gtag_config Associative array of gtag config options.
	 * @return array Filtered $gtag_config.
	 */
	protected function gtag_config_add_optimize_id( $gtag_config ) {
		$optimize_id = $this->get_data( 'optimize-id' );
		if ( is_wp_error( $optimize_id ) || empty( $optimize_id ) ) {
			return $gtag_config;
		}

		$gtag_config['optimize_id'] = $optimize_id;

		return $gtag_config;
	}

	/**
	 * Outputs Optimize experiment script in AMP if opted in.
	 *
	 * @since 1.0.0
	 */
	protected function print_amp_optimize_experiment() {
		if ( ! $this->context->is_amp() ) {
			return;
		}

		$amp_client_id_opt_in = $this->get_data( 'amp-client-id-opt-in' );
		if ( is_wp_error( $amp_client_id_opt_in ) || ! $amp_client_id_opt_in ) {
			return;
		}

		$amp_experiment_json = $this->get_data( 'amp-experiment-json' );
		if ( is_wp_error( $amp_experiment_json ) || ! $amp_experiment_json ) {
			return;
		}

		?>
		<amp-experiment>
			<script type="application/json">
				<?php echo wp_json_encode( $optimize_option['ampExperimentJSON'] ); ?>
			</script>
		</amp-experiment>
		<?php
	}

	/**
	 * Adds AMP experiment script if opted in.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	protected function amp_data_load_experiment_component( $data ) {
		$amp_client_id_opt_in = $this->get_data( 'amp-client-id-opt-in' );
		if ( is_wp_error( $amp_client_id_opt_in ) || ! $amp_client_id_opt_in ) {
			return $data;
		}

		$amp_experiment_json = $this->get_data( 'amp-experiment-json' );
		if ( is_wp_error( $amp_experiment_json ) || ! $amp_experiment_json ) {
			return $data;
		}

		$data['amp_component_scripts']['amp-experiment'] = 'https://cdn.ampproject.org/v0/amp-experiment-0.1.js';
		return $data;
	}

	/**
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 */
	protected function get_datapoint_services() {
		return array(
			// GET / POST.
			'optimize-id'          => '',
			'amp-experiment-json'  => '',
			// GET.
			'amp-client-id-opt-in' => '',
			// POST.
			'settings'             => '',
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	protected function create_data_request( Data_Request $data ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'optimize-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						// TODO: Remove this at some point (migration of old option).
						if ( isset( $option['optimize_id'] ) ) {
							if ( ! isset( $option['optimizeID'] ) ) {
								$option['optimizeID'] = $option['optimize_id'];
							}
							unset( $option['optimize_id'] );
							$this->options->set( self::OPTION, $option );
						}

						// TODO: Remove this at some point (migration of old 'optimizeId' option).
						if ( isset( $option['optimizeId'] ) ) {
							if ( ! isset( $option['optimizeID'] ) ) {
								$option['optimizeID'] = $option['optimizeId'];
							}
							unset( $option['optimizeId'] );
						}

						if ( empty( $option['optimizeID'] ) ) {
							return new WP_Error( 'optimize_id_not_set', __( 'Optimize ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['optimizeID'];
					};
				case 'amp-client-id-opt-in': // Get this from Analytics, read-only from here.
					return function() {
						$option = (array) $this->options->get( Analytics::OPTION );

						// TODO: Remove this at some point (migration of old 'ampClientIdOptIn' option).
						if ( isset( $option['ampClientIdOptIn'] ) ) {
							if ( ! isset( $option['ampClientIDOptIn'] ) ) {
								$option['ampClientIDOptIn'] = $option['ampClientIdOptIn'];
							}
							unset( $option['ampClientIdOptIn'] );
						}

						if ( ! isset( $option['ampClientIDOptIn'] ) ) {
							return true; // Default to true.
						}
						return ! empty( $option['ampClientIDOptIn'] );
					};
				case 'amp-experiment-json':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						// TODO: Remove this at some point (migration of old option).
						if ( isset( $option['AMPExperimentJson'] ) ) {
							if ( ! isset( $option['ampExperimentJSON'] ) ) {
								$option['ampExperimentJSON'] = $option['AMPExperimentJson'];
							}
							unset( $option['AMPExperimentJson'] );
							$this->options->set( self::OPTION, $option );
						}

						// TODO: Remove this at some point (migration of old 'ampExperimentJson' option).
						if ( isset( $option['ampExperimentJson'] ) ) {
							if ( ! isset( $option['ampExperimentJSON'] ) ) {
								$option['ampExperimentJSON'] = $option['ampExperimentJson'];
							}
							unset( $option['ampExperimentJson'] );
						}

						if ( empty( $option['ampExperimentJSON'] ) ) {
							return new WP_Error( 'amp_experiment_json_not_set', __( 'AMP experiment JSON not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return wp_json_encode( $option['ampExperimentJSON'] );
					};
			}
		} elseif ( 'POST' === $method ) {
			switch ( $datapoint ) {
				case 'optimize-id':
					if ( ! isset( $data['optimizeID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'optimizeID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option               = (array) $this->options->get( self::OPTION );
						$option['optimizeID'] = $data['optimizeID'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'amp-experiment-json':
					if ( ! isset( $data['ampExperimentJSON'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'ampExperimentJSON' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                      = (array) $this->options->get( self::OPTION );
						$option['ampExperimentJSON'] = $data['ampExperimentJSON'];
						if ( is_string( $option['ampExperimentJSON'] ) ) {
							$option['ampExperimentJSON'] = json_decode( $option['ampExperimentJSON'] );
						}
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'settings':
					if ( ! isset( $data['optimizeID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'optimizeID' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['ampExperimentJSON'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'ampExperimentJSON' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option = array(
							'optimizeID'        => $data['optimizeID'],
							'ampExperimentJSON' => $data['ampExperimentJSON'],
						);
						if ( is_string( $option['ampExperimentJSON'] ) ) {
							$option['ampExperimentJSON'] = json_decode( $option['ampExperimentJSON'] );
						}
						$this->options->set( self::OPTION, $option );
						return $option;
					};
			}
		}

		return new WP_Error( 'invalid_datapoint', __( 'Invalid datapoint.', 'google-site-kit' ) );
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
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'optimize',
			'name'        => _x( 'Optimize', 'Service name', 'google-site-kit' ),
			'description' => __( 'Create free A/B tests that help you drive metric-based design solutions to your site.', 'google-site-kit' ),
			'cta'         => __( 'Increase your CTR.', 'google-site-kit' ),
			'order'       => 5,
			'homepage'    => __( 'https://optimize.google.com/optimize/home/', 'google-site-kit' ),
			'learn_more'  => __( 'https://marketingplatform.google.com/about/optimize/', 'google-site-kit' ),
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
	 *
	 * @param Google_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Client $client ) {
		return array();
	}
}
