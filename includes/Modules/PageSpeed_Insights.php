<?php
/**
 * Class Google\Site_Kit\Modules\PageSpeed_Insights
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google_Client;
use Google_Service;
use Google_Service_Exception;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use WP_Error;
use Exception;

/**
 * Class representing the PageSpeed Insights module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class PageSpeed_Insights extends Module {

	const OPTION = 'googlesitekit_pagespeed_insights_settings';

	/**
	 * Register.
	 *
	 * @since 1.0.0
	 */
	public function register() {}

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
		$api_key = $this->authentication->get_api_key_client()->get_api_key();
		if ( empty( $api_key ) ) {
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
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 */
	protected function get_datapoint_services() {
		return array(
			// GET.
			'site-pagespeed-mobile'  => 'pagespeedonline',
			'site-pagespeed-desktop' => 'pagespeedonline',
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param string $method    Request method. Either 'GET' or 'POST'.
	 * @param string $datapoint Datapoint to get request object for.
	 * @param array  $data      Optional. Contextual data to provide or set. Default empty array.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	protected function create_data_request( $method, $datapoint, array $data = array() ) {
		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'site-pagespeed-mobile':
				case 'site-pagespeed-desktop':
					$strategy = str_replace( 'site-pagespeed-', '', $datapoint );
					if ( ! empty( $data['permaLink'] ) ) {
						$page_url = $data['permaLink'];
					} else {
						$page_url = $this->context->get_reference_site_url();
					}
					$service = $this->get_service( 'pagespeedonline' );
					return $service->pagespeedapi->runpagespeed(
						$page_url,
						array(
							'locale'   => substr( get_locale(), 0, 2 ),
							'strategy' => $strategy,
						)
					);
			}
		}

		return new WP_Error( 'invalid_datapoint', __( 'Invalid datapoint.', 'google-site-kit' ) );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param string $method    Request method. Either 'GET' or 'POST'.
	 * @param string $datapoint Datapoint to resolve response for.
	 * @param mixed  $response  Response object or array.
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( $method, $datapoint, $response ) {
		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'site-pagespeed-mobile':
				case 'site-pagespeed-desktop':
					// TODO: Parse this response to a regular array.
					return $response->getLighthouseResult();
			}
		}

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
			'slug'        => 'pagespeed-insights',
			'name'        => __( 'PageSpeed Insights', 'google-site-kit' ),
			'description' => __( 'Google PageSpeed Insights gives you metrics about performance, accessibility, SEO and PWA.', 'google-site-kit' ),
			'cta'         => __( 'Learn more about your website’s performance.', 'google-site-kit' ),
			'order'       => 4,
			'homepage'    => __( 'https://developers.google.com/speed/pagespeed/insights/', 'google-site-kit' ),
			'learn_more'  => __( 'https://developers.google.com/speed/docs/insights/v5/about', 'google-site-kit' ),
			'group'       => __( 'Additional Google Services', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the Google client the module should use.
	 *
	 * This method is invoked once by {@see Module::get_client()} to lazily set up the client when it is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 *
	 * @return Google_Client Google client instance.
	 */
	protected function setup_client() {
		return $this->authentication->get_api_key_client()->get_client();
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
		return array(
			'pagespeedonline' => new \Google_Service_Pagespeedonline( $client ),
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
			__( 'Website performance reports for mobile and desktop', 'google-site-kit' ),
		);

		return $info;
	}
}
