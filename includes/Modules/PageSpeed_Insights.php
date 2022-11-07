<?php
/**
 * Class Google\Site_Kit\Modules\PageSpeed_Insights
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\PageSpeed_Insights\Settings;
use Google\Site_Kit_Dependencies\Google\Service\PagespeedInsights as Google_Service_PagespeedInsights;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the PageSpeed Insights module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class PageSpeed_Insights extends Module
	implements Module_With_Scopes, Module_With_Assets, Module_With_Deactivation, Module_With_Settings, Module_With_Owner {
	use Module_With_Scopes_Trait, Module_With_Assets_Trait, Module_With_Settings_Trait, Module_With_Owner_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'pagespeed-insights';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.0.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
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
			'GET:pagespeed' => array(
				'service'   => 'pagespeedonline',
				'shareable' => Feature_Flags::enabled( 'dashboardSharing' ),
			),
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
			case 'GET:pagespeed':
				if ( empty( $data['strategy'] ) ) {
					return new WP_Error(
						'missing_required_param',
						sprintf(
							/* translators: %s: Missing parameter name */
							__( 'Request parameter is empty: %s.', 'google-site-kit' ),
							'strategy'
						),
						array( 'status' => 400 )
					);
				}

				$valid_strategies = array( 'mobile', 'desktop' );

				if ( ! in_array( $data['strategy'], $valid_strategies, true ) ) {
					return new WP_Error(
						'invalid_param',
						sprintf(
							/* translators: 1: Invalid parameter name, 2: list of valid values */
							__( 'Request parameter %1$s is not one of %2$s', 'google-site-kit' ),
							'strategy',
							implode( ', ', $valid_strategies )
						),
						array( 'status' => 400 )
					);
				}

				if ( ! empty( $data['url'] ) ) {
					$page_url = $data['url'];
				} else {
					$page_url = $this->context->get_reference_site_url();
				}

				$service = $this->get_service( 'pagespeedonline' );

				return $service->pagespeedapi->runpagespeed(
					$page_url,
					array(
						'locale'   => $this->context->get_locale( 'site', 'language-code' ),
						'strategy' => $data['strategy'],
					)
				);
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.9.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-pagespeed-insights',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-pagespeed-insights.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-components',
					),
				)
			),
		);
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
			'slug'        => 'pagespeed-insights',
			'name'        => _x( 'PageSpeed Insights', 'Service name', 'google-site-kit' ),
			'description' => __( 'Google PageSpeed Insights gives you metrics about performance, accessibility, SEO and PWA', 'google-site-kit' ),
			'order'       => 4,
			'homepage'    => __( 'https://pagespeed.web.dev', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.49.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
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
			'pagespeedonline' => new Google_Service_PagespeedInsights( $client ),
		);
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @return array List of Google OAuth scopes.
	 * @since 1.0.0
	 */
	public function get_scopes() {
		return array(
			'openid',
		);
	}
}
