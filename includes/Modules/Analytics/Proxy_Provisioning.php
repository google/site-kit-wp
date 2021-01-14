<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Proxy_Provisioning
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;
use Google\Site_Kit\Modules\Analytics\Proxy_AccountTicket;
use \Google\Site_Kit_Dependencies\Google_Service_Resource;

/**
 * Class for Analytics provisioning.
 *
 * @since 1.9.0
 * @access private
 * @ignore
 */
class Proxy_Provisioning extends Google_Service_Resource {
	/**
	 * Creates an account ticket. (provisioning.createAccountTicket)
	 *
	 * @since 1.9.0
	 *
	 * @param Proxy_AccountTicket $post_body  The post body to send.
	 * @param array               $opt_params Optional parameters. Pass site_id and site_secret here.
	 * @return Google_Service_Analytics_AccountTicket
	 */
	public function createAccountTicket( Proxy_AccountTicket $post_body, $opt_params = array() ) {
		$params = array( 'postBody' => $post_body );
		$params = array_merge( $params, $opt_params );
		return $this->call( 'createAccountTicket', array( $params ), 'Google\Site_Kit_Dependencies\Google_Service_Analytics_AccountTicket' );
	}
}
