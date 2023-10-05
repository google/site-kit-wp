<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Ad_Blocking_Recovery_Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group AdSense
 */
class Ad_Blocking_Recovery_Tag_GuardTest extends TestCase {

	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Ad_Blocking_Recovery_Tag_Guard object.
	 *
	 * @var Ad_Blocking_Recovery_Tag_Guard
	 */
	private $guard;

	public function set_up() {
		parent::set_up();

		update_option(
			Settings::OPTION,
			array(
				'adBlockingRecoverySetupStatus' => 'tag-placed',
				'useAdBlockingRecoverySnippet'  => true,
			)
		);

		$this->settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->guard    = new Ad_Blocking_Recovery_Tag_Guard( $this->settings );
	}

	public function test_can_activate() {
		$this->assertTrue( $this->guard->can_activate() );
	}

	/**
	 * @dataProvider data_can_not_activate
	 */
	public function test_can_not_activate( $settings ) {
		$this->settings->merge( $settings );
		$this->assertFalse( $this->guard->can_activate() );
	}

	public function data_can_not_activate() {
		return array(
			'when adBlockingRecoverySetupStatus is empty' => array( array( 'adBlockingRecoverySetupStatus' => '' ) ),
			'when useAdBlockingRecoverySnippet is falsy'  => array( array( 'useAdBlockingRecoverySnippet' => false ) ),
		);
	}
}
