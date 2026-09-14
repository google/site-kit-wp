<?php
/**
 * Ads_Conversion_Tracking_IntentTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Ads
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Modules\Ads\Ads_Conversion_Tracking_Intent;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 * @group Intents
 */
class Ads_Conversion_Tracking_IntentTest extends TestCase {

	/**
	 * Ads conversion tracking intent.
	 *
	 * @var Ads_Conversion_Tracking_Intent
	 */
	private $intent;

	public function set_up() {
		parent::set_up();

		$this->intent = new Ads_Conversion_Tracking_Intent();
	}

	public function test_get_id() {
		$this->assertEquals( 'ads-conversion-tracking', $this->intent->get_id(), 'The intent ID should be ads-conversion-tracking.' );
	}

	public function test_is_available__with_the_feature_flag_enabled() {
		$this->enable_feature( 'adsConversionTrackingIntent' );

		$this->assertTrue( $this->intent->is_available(), 'The intent should be available while adsConversionTrackingIntent is enabled.' );
	}

	public function test_is_available__with_the_feature_flag_disabled() {
		$this->assertFalse( $this->intent->is_available(), 'The intent should not be available while adsConversionTrackingIntent is disabled.' );
	}
}
