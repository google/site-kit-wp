<?php
/**
 * Class PropertiesAudiencesService
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\Resource\PropertiesAudiences as PropertiesAudiences;
use Google\Site_Kit_Dependencies\Google_Client;

/**
 * Class for managing GA4 audiences.
 *
 * @since 1.120.0
 * @access private
 * @ignore
 */
class PropertiesAudiencesService extends GoogleAnalyticsAdmin {

	/**
	 * PropertiesAudiences instance.
	 *
	 * @var PropertiesAudiences
	 */
	public $properties_audiences;

	/**
	 * Constructor.
	 *
	 * @since 1.120.0
	 *
	 * @param Google_Client $client The client used to deliver requests.
	 * @param string        $rootUrl The root URL used for requests to the service.
	 */
	public function __construct( Google_Client $client, $rootUrl = null ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		parent::__construct( $client, $rootUrl ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		$this->version = 'v1alpha';

		$this->properties_audiences = new PropertiesAudiences(
			$this,
			$this->serviceName, // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			'audiences',
			array(
				'methods' => array(
					'create' => array(
						'path'       => 'v1alpha/{+parent}/audiences',
						'httpMethod' => 'POST',
						'parameters' => array(
							'parent' => array(
								'location' => 'path',
								'type'     => 'string',
								'required' => true,
							),
						),
					),
					'list'   => array(
						'path'       => 'v1alpha/{+parent}/audiences',
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
