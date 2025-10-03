<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads;
use Google\Site_Kit\Tests\TestCase;

class Easy_Digital_DownloadsTest extends TestCase {

	/**
	 * Easy_Digital_Downloads instance.
	 *
	 * @var Easy_Digital_Downloads
	 */
	private $edd;

	public function set_up() {
		parent::set_up();
		$this->edd = new Easy_Digital_Downloads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_is_active() {
		$this->assertFalse( $this->edd->is_active() );
		define( 'EDD_VERSION', 1 );
		$this->assertTrue( $this->edd->is_active() );
	}

	public function test_get_event_names_with_gtag_disabled() {
		$events = $this->edd->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'add_to_cart', $events[0] );
	}

	public function test_get_event_names_with_gtag_enabled() {
		$this->enable_feature( 'gtagUserData' );
		$events = $this->edd->get_event_names();
		$this->assertCount( 2, $events );
		$this->assertEquals( array( 'add_to_cart', 'purchase' ), $events );
	}


	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->edd->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}

	public function test_register_hooks_without_feature_flag() {
		remove_all_actions( 'wp_footer' );

		$this->edd->register_hooks();
		$this->assertFalse( has_action( 'wp_footer' ), 'Expected wp_footer action to not be registered.' );
	}

	public function test_register_hooks_with_feature_flag() {
		$this->enable_feature( 'gtagUserData' );
		remove_all_actions( 'wp_footer' );

		$this->edd->register_hooks();
		$this->assertTrue( has_action( 'wp_footer' ), 'Expected wp_footer action to be registered.' );
	}
}
