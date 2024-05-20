<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Ads\Tag_GuardTest
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
use Google\Site_Kit\Modules\Ads\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class Tag_GuardTest extends TestCase {

	/**
	 * @var Tag_Guard
	 */
	protected $guard;

	public function set_up() {
		parent::set_up();

		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options     = new Options( $context );
		$settings    = new Settings( $options );
		$this->guard = new Tag_Guard( $settings );
	}

	public function test_can_activate() {
		update_option(
			Settings::OPTION,
			array(
				'conversionID' => '123456',
			)
		);

		$this->assertTrue( $this->guard->can_activate() );
	}

	public function test_can_activate__with_no_ads_conversion_id() {
		update_option(
			Settings::OPTION,
			array(
				'conversionID' => '',
			)
		);

		$this->assertFalse(
			$this->guard->can_activate(),
			'Should return FALSE when conversionID is empty.'
		);
	}

}
