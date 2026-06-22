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



	/**
	 * @runInSeparateProcess
	 */
	public function test_is_active() {
		$this->assertFalse( $this->mailchimp->is_active(), 'Mailchimp provider should not be active before plugin constant.' );
		define( 'MC4WP_VERSION', 1 );
		$this->assertTrue( $this->mailchimp->is_active(), 'Mailchimp provider should be active after plugin constant.' );
	}

	public function test_get_event_names() {
		$events = $this->mailchimp->get_event_names();
		$this->assertCount( 1, $events, 'Mailchimp provider should expose one event.' );
		$this->assertEquals( 'submit_lead_form', $events[0], 'Mailchimp event should be submit_lead_form.' );
	}

	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . Mailchimp::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ), 'Mailchimp script should not be registered initially.' );

		$script = $this->mailchimp->register_script();
		$this->assertInstanceOf( Script::class, $script, 'Mailchimp provider should return a script.' );
		$this->assertTrue( wp_script_is( $handle, 'registered' ), 'Mailchimp script should be registered.' );
	}
}
