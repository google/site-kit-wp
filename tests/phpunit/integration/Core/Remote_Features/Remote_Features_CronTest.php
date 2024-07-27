<?php
/**
 * Remote_Features_CronTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Core\Remote_Features\Remote_Features_Cron;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Remote_Features
 */
class Remote_Features_CronTest extends TestCase {

	public function set_up() {
		parent::set_up();
		remove_all_actions( Remote_Features_Cron::CRON_ACTION );
	}

	public function test_register() {
		$cron = new Remote_Features_Cron( '__return_true' );
		$this->assertFalse( has_action( Remote_Features_Cron::CRON_ACTION ) );

		$cron->register();

		$this->assertTrue( has_action( Remote_Features_Cron::CRON_ACTION ) );
	}

	public function test_register__given_callable() {
		$spy  = new MethodSpy();
		$cron = new Remote_Features_Cron( array( $spy, 'func' ) );
		$cron->register();
		$this->assertTrue( empty( $spy->invocations['func'] ) );

		do_action( Remote_Features_Cron::CRON_ACTION );

		$this->assertCount( 1, $spy->invocations['func'] );
	}
}
