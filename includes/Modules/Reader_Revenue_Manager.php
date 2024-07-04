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

use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle as Google_Service_SubscribewithGoogle;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;
use Google\Site_Kit\Core\Util\URL;
use Exception;

/**
 * Class representing the Reader Revenue Manager module.
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
final class Reader_Revenue_Manager extends Module implements Module_With_Scopes, Module_With_Assets, Module_With_Service_Entity {
	use Module_With_Assets_Trait;
	use Module_With_Scopes_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'reader-revenue-manager';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.130.0
	 */
	public function register() {
		$this->register_scopes_hook();
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
	 * @since 1.30.0
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
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.70.0
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access() {
		/**
		 * Get the subscribe with google service instance.
		 *
		 * @var Google_Service_SubscribewithGoogle
		 */
		$subscribewithgoogle = $this->get_service( 'subscribewithgoogle' );

		try {
			$subscribewithgoogle->publications->listPublications(
				array(
					'pageSize' => 1,
				)
			);
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.30.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:publications' => array( 'service' => 'subscribewithgoogle' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.30.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 * @throws Invalid_Param_Exception Thrown if a parameter is invalid.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 *
	 * phpcs:ignore Squiz.Commenting.FunctionCommentThrowTag.WrongNumber
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				/**
				 * Get the subscribe with google service instance.
				 *
				 * @var Google_Service_SubscribewithGoogle
				 */
				$subscribewithgoogle = $this->get_service( 'subscribewithgoogle' );
				return $subscribewithgoogle->publications->listPublications( $this->get_publication_filters() );
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.30.0
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
			'order'       => 5,
			'homepage'    => __( 'https://readerrevenue.withgoogle.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Gets the filters for retrieving publications for the current property.
	 *
	 * @return array Permutations for site hosts or URL.
	 */
	private function get_publication_filters() {
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
					URL::permute_site_hosts( $raw_url )
				)
			);
		} else { // URL property.
			$filter = join(
				' OR ',
				array_map(
					function ( $host ) {
						return sprintf( 'site_url = "%s"', $host );
					},
					URL::permute_site_url( $raw_url )
				)
			);
		}

		return array(
			'filter' => $filter,
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since n.e.x.t
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-reader-revenue-manager',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-reader-revenue-manager.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}
}
