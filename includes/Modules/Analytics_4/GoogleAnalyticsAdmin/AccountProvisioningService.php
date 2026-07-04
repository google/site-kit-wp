<?php
/**
 * Class AccountProvisioningService
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
 * Class for Analytics account provisioning service of the GoogleAnalytics Admin API.
 *
 * @since 1.98.0
 * @access private
 * @ignore
 */
class AccountProvisioningService extends GoogleAnalyticsAdmin {

	/**
	 * Accounts resource instance.
	 *
	 * @var AccountsResource
	 */
	public $accounts;

	/**
	 * Constructor.
	 *
	 * @since 1.98.0
	 *
	 * @param Google_Client $client The client used to deliver requests.
	 * @param string        $rootUrl The root URL used for requests to the service.
	 */
	public function __construct( Google_Client $client, $rootUrl = null ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		parent::__construct( $client, $rootUrl ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName

		$this->accounts = new AccountsResource(
			$this,
			$this->serviceName, // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			'accounts',
			array(
				'methods' => array(
					'provisionAccountTicket' => array(
						'path'       => 'v1beta/accounts:provisionAccountTicket',
						'httpMethod' => 'POST',
						'parameters' => array(),
					),
				),
			)
		);
	}
}
