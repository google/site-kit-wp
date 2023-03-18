<?php
/**
 * Class GoogleAnalyticsAdmin_AccountProvisioning
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google_Client;

/**
 * Class for Google Analytics account provisioning.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class GoogleAnalyticsAdmin_AccountProvisioning extends GoogleAnalyticsAdmin {
	/**
	 * Constructs the internal representation of the Analytics service.
	 *
	 * @since 1.9.0
	 *
	 * @param Google_Client $client The client used to deliver requests.
	 * @param string        $rootUrl The root URL used for requests to the service.
	 */
	public function __construct( Google_Client $client, $rootUrl = null ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		parent::__construct( $client, $rootUrl ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		$this->provisioning = new Proxy_Provisioning(
			$this,
			$this->serviceName, // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			'provisioning',
			array(
				'methods' => array(
					'createAccountTicket' => array(
						'path'       => 'provisioning/createAccountTicket',
						'httpMethod' => 'POST',
						'parameters' => array(),
					),
				),
			)
		);
	}
}
