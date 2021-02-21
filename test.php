<?php
/**
 * Class Google\Site_Kit\Modules\PageSpeed_Insights.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google_Service_Pagespeedonline;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the PageSpeed Insights module.
 *
 * Comment description without capital.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class PageSpeed_Insights {

	/**
	 * Const doesn't have to have the third person verb
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested.
	 * for the first time
	 *
	 * @since 1.0.0
	 * @since 1.2.0 now requires Google_Site_Kit_Client instance
	 *
	 * @var int $test_const Google client instance.
	 */
	protected $test_const = 123;

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested.
	 * for the first time
	 *
	 * @since 1.0.0
	 * @since 1.2.0 now requires Google_Site_Kit_Client instance
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @param Google_Site_Kit_Client $spoon Comment
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service
	 */
	protected function setup_services( Google_Site_Kit_Client $client, $spoon ) {
		return array(
			'pagespeedonline' => new Google_Service_Pagespeedonline( $client ),
		);
	}

	/**
	 * Set up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested.
	 * for the first time
	 *
	 * @since 1.0.0
	 * @since 1.2.0 now requires Google_Site_Kit_Client instance
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @param Google_Site_Kit_Client $spoon Comment.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service
	 */
	protected function setup_services_2( Google_Site_Kit_Client $client, $spoon ) {
		return array(
			'pagespeedonline' => new Google_Service_Pagespeedonline( $client ),
		);
	}
}
