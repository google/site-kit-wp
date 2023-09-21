<?php
/**
 * Class PropertiesEnhancedMeasurementService
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google_Client;

/**
 * Class for managing GA4 datastream enhanced measurement settings.
 *
 * @since 1.110.0
 * @access private
 * @ignore
 */
class PropertiesEnhancedMeasurementService extends GoogleAnalyticsAdmin {

	/**
	 * PropertiesEnhancedMeasurementResource instance.
	 *
	 * @var PropertiesEnhancedMeasurementResource
	 */
	public $properties_enhancedMeasurements; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	/**
	 * Constructor.
	 *
	 * @since 1.110.0
	 *
	 * @param Google_Client $client The client used to deliver requests.
	 * @param string        $rootUrl The root URL used for requests to the service.
	 */
	public function __construct( Google_Client $client, $rootUrl = null ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		parent::__construct( $client, $rootUrl ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		$this->version = 'v1alpha';

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName
		$this->properties_enhancedMeasurements = new PropertiesEnhancedMeasurementResource(
			$this,
			$this->serviceName, // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			'enhancedMeasurements',
			array(
				'methods' => array(
					'getEnhancedMeasurementSettings'    => array(
						'path'       => 'v1alpha/{+name}',
						'httpMethod' => 'GET',
						'parameters' => array(
							'name' => array(
								'location' => 'path',
								'type'     => 'string',
								'required' => true,
							),
						),
					),
					'updateEnhancedMeasurementSettings' => array(
						'path'       => 'v1alpha/{+name}',
						'httpMethod' => 'PATCH',
						'parameters' => array(
							'name'       => array(
								'location' => 'path',
								'type'     => 'string',
								'required' => true,
							),
							'updateMask' => array(
								'location' => 'query',
								'type'     => 'string',
							),
						),
					),
				),
			)
		);
	}
}
