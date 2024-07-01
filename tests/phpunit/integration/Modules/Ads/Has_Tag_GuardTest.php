<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Ads\Has_Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Ads\Settings;
use Google\Site_Kit\Modules\Ads\Has_Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class Has_Tag_GuardTest extends TestCase {

	/**
	 * @var Has_Tag_Guard
	 */
	protected $guard;

	/**
	 * @var Settings
	 */
	protected $settings;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$this->settings = new Settings( $options );
	}

	public function test_can_activate_non_pax() {
		update_option(
			Settings::OPTION,
			array(
				'conversionID' => '123456',
			)
		);

		$ads_conversion_id = $this->settings->get()['conversionID'];
		$this->guard       = new Has_Tag_Guard( $ads_conversion_id );

		$this->assertTrue( $this->guard->can_activate() );
	}

	public function test_can_activate_pax() {
		update_option(
			Settings::OPTION,
			array(
				'paxConversionID' => '123456',
			)
		);

		$pax_conversion_id = $this->settings->get()['paxConversionID'];
		$this->guard       = new Has_Tag_Guard( $pax_conversion_id );

		$this->assertTrue( $this->guard->can_activate() );
	}

	public function test_can_activate__with_no_ads_conversion_id() {
		update_option(
			Settings::OPTION,
			array(
				'conversionID' => '',
			)
		);

		$ads_conversion_id = $this->settings->get()['conversionID'];
		$this->guard       = new Has_Tag_Guard( $ads_conversion_id );

		$this->assertFalse(
			$this->guard->can_activate(),
			'Should return FALSE when conversionID is empty.'
		);
	}

	public function test_can_activate__with_no_pax_ads_conversion_id() {
		update_option(
			Settings::OPTION,
			array(
				'paxConversionID' => '',
			)
		);

		$pax_conversion_id = $this->settings->get()['paxConversionID'];
		$this->guard       = new Has_Tag_Guard( $pax_conversion_id );

		$this->assertFalse(
			$this->guard->can_activate(),
			'Should return FALSE when conversionID is empty.'
		);
	}
}
