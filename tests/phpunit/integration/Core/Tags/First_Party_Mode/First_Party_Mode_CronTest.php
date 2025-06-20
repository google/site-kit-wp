<?php
/**
 * First_Party_Mode_CronTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\First_Party_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Site_Kit\Tests\Core\Tags\First_Party_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Cron;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Settings;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

class First_Party_Mode_CronTest extends TestCase {

	/**
	 * First_Party_Mode_Settings instance.
	 *
	 * @var First_Party_Mode_Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();
		remove_all_actions( First_Party_Mode_Cron::CRON_ACTION );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$this->settings = new First_Party_Mode_Settings( $options );
		$this->settings->register();
	}

	public function test_register() {
		$cron = new First_Party_Mode_Cron( $this->settings, '__return_true' );
		$this->assertFalse( has_action( First_Party_Mode_Cron::CRON_ACTION ) );

		$cron->register();

		$this->assertTrue( has_action( First_Party_Mode_Cron::CRON_ACTION ) );
	}

	public function test_register__given_callable() {
		$spy  = new MethodSpy();
		$cron = new First_Party_Mode_Cron( $this->settings, array( $spy, 'func' ) );
		$cron->register();
		$this->assertTrue( empty( $spy->invocations['func'] ) );

		do_action( First_Party_Mode_Cron::CRON_ACTION );

		$this->assertCount( 1, $spy->invocations['func'] );
	}

	public function test_maybe_schedule_cron() {
		$cron = new First_Party_Mode_Cron( $this->settings, '__return_true' );

		$this->assertFalse(
			wp_next_scheduled( First_Party_Mode_Cron::CRON_ACTION )
		);

		$cron->maybe_schedule_cron();

		$this->assertFalse(
			wp_next_scheduled( First_Party_Mode_Cron::CRON_ACTION )
		);

		$this->settings->merge( array( 'isEnabled' => true ) );

		$cron->maybe_schedule_cron();

		$this->assertNotEmpty(
			wp_next_scheduled( First_Party_Mode_Cron::CRON_ACTION )
		);
	}
}
