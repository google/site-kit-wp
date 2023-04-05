<?php
/**
 * Class Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProvisionAccountTicketRequest;

/**
 * Class for representing a proxied account ticket provisioning request body.
 *
 * @since 1.98.0
 * @access private
 * @ignore
 */
class Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest extends GoogleAnalyticsAdminV1betaProvisionAccountTicketRequest {
	/**
	 * The site ID.
	 *
	 * @since 1.98.0
	 * @var string
	 */
	public $site_id = '';

	/**
	 * The site secret.
	 *
	 * @since 1.98.0
	 * @var string
	 */
	public $site_secret = '';

	/**
	 * Gets the site ID.
	 *
	 * @since 1.98.0
	 */
	public function getSiteId() {
		return $this->site_id;
	}

	/**
	 * Sets the site ID.
	 *
	 * @since 1.98.0
	 *
	 * @param string $id The site id.
	 */
	public function setSiteId( $id ) {
		$this->site_id = $id;
	}

	/**
	 * Gets the site secret.
	 *
	 * @since 1.98.0
	 */
	public function getSiteSecret() {
		return $this->site_secret;
	}

	/**
	 * Sets the site secret.
	 *
	 * @since 1.98.0
	 *
	 * @param string $secret The site secret.
	 */
	public function setSiteSecret( $secret ) {
		$this->site_secret = $secret;
	}
}
