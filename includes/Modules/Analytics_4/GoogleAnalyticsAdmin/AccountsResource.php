<?php
/**
 * Class AccountsResource
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse;
use Google\Site_Kit_Dependencies\Google\Service\Resource;

/**
 * Class for representing the Accounts resource of the GoogleAnalytics Admin API for provisioning.
 *
 * @since 1.98.0
 * @access private
 * @ignore
 */
class AccountsResource extends Resource {

	/**
	 * Requests a ticket for creating an account.
	 *
	 * @since 1.98.0
	 *
	 * @param Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest $post_body  The post body to send.
	 * @param array                                                   $opt_params Optional parameters.
	 * @return GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse
	 */
	public function provisionAccountTicket( Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest $post_body, $opt_params = array() ) {
		$params = array( 'postBody' => $post_body );
		$params = array_merge( $params, $opt_params );

		return $this->call(
			'provisionAccountTicket',
			array( $params ),
			GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse::class
		);
	}
}
