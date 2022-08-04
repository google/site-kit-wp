<?php
/**
 * TrackingTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tracking
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Tracking\Tracking;
use Google\Site_Kit\Core\Tracking\Tracking_Consent;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group tracking
 */
class TrackingTest extends TestCase {

	public function test_register() {
		$tracking_consent_mock = $this->getTrackingConsentMock( array( 'register', 'get' ) );
		$tracking_consent_mock->expects( $this->once() )->method( 'register' );
		$tracking = new Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $tracking, 'consent', $tracking_consent_mock );
		remove_all_filters( 'googlesitekit_inline_tracking_data' );

		$tracking->register();

		$this->assertTrue( has_filter( 'googlesitekit_inline_tracking_data' ) );
		$tracking_data = apply_filters( 'googlesitekit_inline_tracking_data', array() );
		$this->assertArrayHasKey( 'trackingEnabled', $tracking_data );
		$this->assertEquals( Tracking::TRACKING_ID, $tracking_data['trackingID'] );
	}

	public function test_is_active() {
		$tracking_consent_mock = $this->getTrackingConsentMock( 'get' );
		$tracking              = new Tracking( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $tracking, 'consent', $tracking_consent_mock );

		// Set Tracking_Consent::get() to return an empty string on the first call, and '1' on the second.
		$tracking_consent_mock->expects( $this->any() )->method( 'get' )->willReturnOnConsecutiveCalls( '', '1' );

		$this->assertFalse( $tracking->is_active() );

		// User option change is simulated with mock above.

		$this->assertTrue( $tracking->is_active() );
	}

	protected function getTrackingConsentMock( $methods ) {
		return $this->getMockBuilder( Tracking_Consent::class )
			->disableOriginalConstructor()
			->setMethods( (array) $methods )
			->getMock();
	}
}
