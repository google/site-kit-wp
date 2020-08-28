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

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Modules\Optimize\Settings;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Optimize module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Optimize extends Module
	implements Module_With_Settings, Module_With_Debug_Fields, Module_With_Assets, Module_With_Owner {
	use Module_With_Settings_Trait, Module_With_Assets_Trait, Module_With_Owner_Trait;

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
		$this->get_settings()->delete();
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

		$amp_experiment_json = $this->get_data( 'amp-experiment-json' );
		if ( is_wp_error( $amp_experiment_json ) || ! $amp_experiment_json ) {
			return;
		}

		?>
		<amp-experiment>
			<script type="application/json">
				<?php echo $amp_experiment_json; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</script>
		</amp-experiment>
		<?php
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
			'optimize_id' => array(
				'label' => __( 'Optimize ID', 'google-site-kit' ),
				'value' => $settings['optimizeID'],
				'debug' => Debug_Data::redact_debug_value( $settings['optimizeID'], 7 ),
			),
		);
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
		$amp_experiment_json = $this->get_data( 'amp-experiment-json' );
		if ( is_wp_error( $amp_experiment_json ) || ! $amp_experiment_json ) {
			return $data;
		}

		$data['amp_component_scripts']['amp-experiment'] = 'https://cdn.ampproject.org/v0/amp-experiment-0.1.js';
		return $data;
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.12.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:amp-experiment-json'  => array( 'service' => '' ),
			'POST:amp-experiment-json' => array( 'service' => '' ),
			'GET:optimize-id'          => array( 'service' => '' ),
			'POST:optimize-id'         => array( 'service' => '' ),
			'POST:settings'            => array( 'service' => '' ),
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
			case 'GET:amp-experiment-json':
				return function() {
					$option = $this->get_settings()->get();

					if ( empty( $option['ampExperimentJSON'] ) ) {
						return new WP_Error( 'amp_experiment_json_not_set', __( 'AMP experiment JSON not set.', 'google-site-kit' ), array( 'status' => 404 ) );
					}

					return $option['ampExperimentJSON'];
				};
			case 'POST:amp-experiment-json':
				if ( ! isset( $data['ampExperimentJSON'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'ampExperimentJSON' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$json = $data['ampExperimentJSON'];
					$this->get_settings()->merge( array( 'ampExperimentJSON' => $json ) );
					return true;
				};
			case 'GET:optimize-id':
				return function() {
					$option = $this->get_settings()->get();

					if ( empty( $option['optimizeID'] ) ) {
						return new WP_Error( 'optimize_id_not_set', __( 'Optimize ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
					}

					return $option['optimizeID'];
				};
			case 'POST:optimize-id':
				if ( ! isset( $data['optimizeID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'optimizeID' ), array( 'status' => 400 ) );
				}
				return function() use ( $data ) {
					$this->get_settings()->merge( array( 'optimizeID' => $data['optimizeID'] ) );
					return true;
				};
		}

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
	 * @since 1.10.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-optimize',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-optimize.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-forms',
					),
				)
			),
		);
	}
}
