<?php
/**
 * Class PropertiesAdSenseLinksService
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google_Client;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin_PropertiesAdSenseLinks_Resource as PropertiesAdSenseLinksResource;

/**
 * Class for managing GA4 AdSense Links.
 *
 * @since 1.119.0
 * @access private
 * @ignore
 */
class PropertiesAdSenseLinksService extends GoogleAnalyticsAdmin {

	/**
	 * PropertiesAdSenseLinksResource instance.
	 *
	 * @var PropertiesAdSenseLinksResource
	 */
	public $properties_adSenseLinks; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	/**
	 * Constructor.
	 *
	 * @since 1.119.0
	 *
	 * @param Google_Client $client The client used to deliver requests.
	 * @param string        $rootUrl The root URL used for requests to the service.
	 */
	public function __construct( Google_Client $client, $rootUrl = null ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		parent::__construct( $client, $rootUrl ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		$this->version = 'v1alpha';

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName
		$this->properties_adSenseLinks = new PropertiesAdSenseLinksResource(
			$this,
			$this->serviceName, // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			'adSenseLinks',
			array(
				'methods' => array(
					'create' => array(
						'path'       => 'v1alpha/{+parent}/adSenseLinks',
						'httpMethod' => 'POST',
						'parameters' => array(
							'parent' => array(
								'location' => 'path',
								'type'     => 'string',
								'required' => true,
							),
						),
					),
					'delete' => array(
						'path'       => 'v1alpha/{+name}',
						'httpMethod' => 'DELETE',
						'parameters' => array(
							'name' => array(
								'location' => 'path',
								'type'     => 'string',
								'required' => true,
							),
						),
					),
					'get'    => array(
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
					'list'   => array(
						'path'       => 'v1alpha/{+parent}/adSenseLinks',
						'httpMethod' => 'GET',
						'parameters' => array(
							'parent'    => array(
								'location' => 'path',
								'type'     => 'string',
								'required' => true,
							),
							'pageSize'  => array(
								'location' => 'query',
								'type'     => 'integer',
							),
							'pageToken' => array(
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
