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
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\OptinMonster;
use Google\Site_Kit\Tests\TestCase;

class OptinMonsterTest extends TestCase {

	/**
	 * OptinMonster instance.
	 *
	 * @var OptinMonster
	 */
	private $optinmonster;

	public function set_up() {
		parent::set_up();
		$this->optinmonster = new OptinMonster( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'OMAPI_FILE' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'OMAPI_FILE' );
		}
	}

	public function test_is_active() {
		$this->assertFalse( $this->optinmonster->is_active() );
		define( 'OMAPI_FILE', 1 );
		$this->assertTrue( $this->optinmonster->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->optinmonster->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'submit_lead_form', $events[0] );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . OptinMonster::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->optinmonster->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}
}
