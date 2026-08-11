<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Get_NotificationsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Notifications;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Get_NotificationsTest extends DatapointTestCase {
	public function test_parse_response_filters_to_severe_alerts() {
		$severe_alert = new Alert();
		$severe_alert->setSeverity( 'SEVERE' );
		$severe_alert->setName( 'test-alert' );
		$severe_alert->setMessage( 'Severe alert message' );

		$warning_alert = new Alert();
		$warning_alert->setSeverity( 'WARNING' );
		$warning_alert->setName( 'warning-alert' );
		$warning_alert->setMessage( 'Warning alert message' );

		$this->adsense->get_settings()->merge( array( 'accountID' => 'pub-1234567890' ) );

		$datapoint = new Get_Notifications(
			array(
				'settings'        => $this->adsense->get_settings(),
				'get_data'        => function () use ( $severe_alert, $warning_alert ) {
					return array( $severe_alert, $warning_alert );
				},
				'get_account_url' => function () {
					return 'https://www.google.com/adsense/new/pub-1234567890/home';
				},
			)
		);

		$data_request = new Data_Request( 'GET', 'modules', 'adsense', 'notifications', array() );
		$callback     = $datapoint->create_request( $data_request );
		$parsed       = $datapoint->parse_response( $callback, $data_request );

		$this->assertCount( 1, $parsed, 'Expected only severe alerts to be converted into notifications.' );
		$this->assertEquals( 'adsense::test-alert', $parsed[0]['id'], 'Expected the severe alert notification ID to be namespaced.' );
	}
}
