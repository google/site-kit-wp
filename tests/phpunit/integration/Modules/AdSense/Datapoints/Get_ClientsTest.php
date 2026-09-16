<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Get_ClientsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Clients;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\AdClient;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Get_ClientsTest extends DatapointTestCase {
	public function test_parse_response() {
		$datapoint = new Get_Clients(
			array(
				'service' => function () {
					return $this->service;
				},
			)
		);

		$client         = new AdClient();
		$client['name'] = 'accounts/pub-1/adclients/client-1';

		$response = new class( array( $client ) ) {
			private $ad_clients;

			public function __construct( $ad_clients ) {
				$this->ad_clients = $ad_clients;
			}

			public function getAdClients() {
				return $this->ad_clients;
			}
		};

		$parsed = $datapoint->parse_response( $response, new Data_Request( 'GET', 'modules', 'adsense', 'clients', array() ) );

		$this->assertEquals( 'client-1', $parsed[0]->_id, 'Expected the client ID to be parsed from the resource name.' );
		$this->assertEquals( 'pub-1', $parsed[0]->_accountID, 'Expected the account ID to be parsed from the resource name.' );
	}
}
