<?php
/**
 * Interface Google\Site_Kit\Core\Google_API\Google_API
 *
 * @package   Google\Site_Kit\Core\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Google_API;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\DI\DI_Aware_Interface;
use Google\Site_Kit\Core\DI\DI_Aware_Trait;
use Google\Site_Kit\Core\DI\DI_Services_Aware_Trait;

/**
 * Base class for Google services APIs.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 *
 * @property-read Context        $context        Plugin context.
 * @property-read Authentication $authentication Authentication instance.
 */
abstract class Google_API implements DI_Aware_Interface {

	use DI_Aware_Trait, DI_Services_Aware_Trait;

	/**
	 * Fetches Google service API.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params API request parameters.
	 * @return mixed API response.
	 */
	abstract public function fetch( $params );

}
