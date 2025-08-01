<?php
/**
 * Google_Tag_Gateway_CronTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Cron;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

class Google_Tag_Gateway_CronTest extends TestCase {

	/**
	 * Google_Tag_Gateway_Settings instance.
	 *
	 * @var Google_Tag_Gateway_Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();
		remove_all_actions( Google_Tag_Gateway_Cron::CRON_ACTION );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$this->settings = new Google_Tag_Gateway_Settings( $options );
		$this->settings->register();
	}

	public function test_register() {
		$cron = new Google_Tag_Gateway_Cron( $this->settings, '__return_true' );
		$this->assertFalse( has_action( Google_Tag_Gateway_Cron::CRON_ACTION ), 'Cron action should not be registered initially.' );

		$cron->register();

		$this->assertTrue( has_action( Google_Tag_Gateway_Cron::CRON_ACTION ), 'Cron action should be registered after registration.' );
	}

	public function test_register__given_callable() {
		$spy  = new MethodSpy();
		$cron = new Google_Tag_Gateway_Cron( $this->settings, array( $spy, 'func' ) );
		$cron->register();
		$this->assertTrue( empty( $spy->invocations['func'] ), 'Spy should not be invoked before cron action.' );

		do_action( Google_Tag_Gateway_Cron::CRON_ACTION );

		$this->assertCount( 1, $spy->invocations['func'], 'Spy should be invoked once when cron action is triggered.' );
	}

	public function test_maybe_schedule_cron() {
		$cron = new Google_Tag_Gateway_Cron( $this->settings, '__return_true' );

		$this->assertFalse(
			wp_next_scheduled( Google_Tag_Gateway_Cron::CRON_ACTION ),
			'Cron should not be scheduled initially.'
		);

		$cron->maybe_schedule_cron();

		$this->assertFalse(
			wp_next_scheduled( Google_Tag_Gateway_Cron::CRON_ACTION ),
			'Cron should not be scheduled when gateway is disabled.'
		);

		$this->settings->merge( array( 'isEnabled' => true ) );

		$cron->maybe_schedule_cron();

		$this->assertNotEmpty(
			wp_next_scheduled( Google_Tag_Gateway_Cron::CRON_ACTION ),
			'Cron should be scheduled when gateway is enabled.'
		);
	}
}
