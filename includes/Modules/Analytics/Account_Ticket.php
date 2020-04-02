<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Provisioning
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit_Dependencies\Google_Service_Analytics_AccountTicket;

/**
 * Class for the Analytics provisioning Account Ticket object.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class AccountTicket extends Google_Service_Analytics_AccountTicket {

	/**
	 * The site ID.
	 *
	 * @since n.e.x.t
	 * @var String
	 */
	public $site_id = '';

	/**
	 * The site secret.
	 *
	 * @since n.e.x.t
	 * @var String
	 */
	public $site_secret = '';

	/**
	 * Get the site ID.
	 *
	 * @since n.e.x.t
	 */
	public function getSiteId() {
		return $this->site_id;
	}

	/**
	 * Set the site ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id The site id.
	 */
	public function setSiteId( $id ) {
		$this->site_id = $id;
	}

	/**
	 * Get the site secret.
	 *
	 * @since n.e.x.t
	 */
	public function getSiteSecret() {
		return $this->site_secret;
	}

	/**
	 * Set the site secret.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $secret The site secret.
	 */
	public function setSiteSecret( $secret ) {
		$this->site_secret = $secret;
	}
}
