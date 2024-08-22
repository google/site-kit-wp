<?php
/**
 * Conversion_Reporting_CronTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Cron;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Conversion_Reporting
 */
class Conversion_Reporting_CronTest extends TestCase {

	public function set_up() {
		parent::set_up();
		remove_all_actions( Conversion_Reporting_Cron::CRON_ACTION );
	}

	public function test_register() {
		$cron = new Conversion_Reporting_Cron( '__return_true' );
		$this->assertFalse( has_action( Conversion_Reporting_Cron::CRON_ACTION ) );

		$cron->register();

		$this->assertTrue( has_action( Conversion_Reporting_Cron::CRON_ACTION ) );
	}

	public function test_register__given_callable() {
		$spy  = new MethodSpy();
		$cron = new Conversion_Reporting_Cron( array( $spy, 'func' ) );
		$cron->register();
		$this->assertTrue( empty( $spy->invocations['func'] ) );

		do_action( Conversion_Reporting_Cron::CRON_ACTION );

		$this->assertCount( 1, $spy->invocations['func'] );
	}
}
