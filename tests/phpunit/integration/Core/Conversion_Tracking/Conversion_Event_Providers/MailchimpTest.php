<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Mailchimp;
use Google\Site_Kit\Tests\TestCase;

class MailchimpTest extends TestCase {

	/**
	 * Mailchimp instance.
	 *
	 * @var Mailchimp
	 */
	private $mailchimp;

	public function set_up() {
		parent::set_up();
		$this->mailchimp = new Mailchimp( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'MC4WP_VERSION' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'MC4WP_VERSION' );
		}
	}

	public function test_is_active() {
		$this->assertFalse( $this->mailchimp->is_active() );
		define( 'MC4WP_VERSION', 1 );
		$this->assertTrue( $this->mailchimp->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->mailchimp->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'submit_lead_form', $events[0] );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . Mailchimp::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->mailchimp->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}
}
