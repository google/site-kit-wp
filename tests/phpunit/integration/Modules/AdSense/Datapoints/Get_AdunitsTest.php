<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Get_AdunitsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Adunits;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\AdUnit;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Get_AdunitsTest extends DatapointTestCase {
	public function test_create_request_requires_params() {
		$datapoint = new Get_Adunits(
			array(
				'service'  => function () {
					return $this->service;
				},
				'settings' => $this->adsense->get_settings(),
			)
		);

		$request = $datapoint->create_request( new Data_Request( 'GET', 'modules', 'adsense', 'adunits', array() ) );
		$this->assertWPError( $request );
	}

	public function test_parse_response() {
		$datapoint = new Get_Adunits(
			array(
				'service'  => function () {
					return $this->service;
				},
				'settings' => $this->adsense->get_settings(),
			)
		);

		$adunit         = new AdUnit();
		$adunit['name'] = 'accounts/pub-1/adclients/ca-pub/adunits/unit-1';

		$response = new class( array( $adunit ) ) {
			private $ad_units;

			public function __construct( $ad_units ) {
				$this->ad_units = $ad_units;
			}

			public function getAdUnits() {
				return $this->ad_units;
			}
		};

		$parsed = $datapoint->parse_response( $response, new Data_Request( 'GET', 'modules', 'adsense', 'adunits', array() ) );

		$this->assertEquals( 'unit-1', $parsed[0]->_id, 'Expected the ad unit ID to be parsed from the resource name.' );
		$this->assertEquals( 'ca-pub', $parsed[0]->_clientID, 'Expected the client ID to be parsed from the resource name.' );
	}
}
