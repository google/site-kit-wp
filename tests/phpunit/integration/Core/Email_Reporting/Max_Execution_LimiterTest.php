<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Max_Execution_LimiterTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Max_Execution_Limiter;
use Google\Site_Kit\Tests\TestCase;

class Max_Execution_LimiterTest extends TestCase {

	public function test_it_caches_passed_limits_and_fallbacks() {
		$limiter = new Max_Execution_Limiter( 45 );
		$this->assertSame( 45, $this->force_get_property( $limiter, 'max_execution_time' ), 'Passed max execution limit should be cached.' );

		$limiter = new Max_Execution_Limiter( 0 );
		$this->assertSame( 30, $this->force_get_property( $limiter, 'max_execution_time' ), 'Zero execution limits should fall back to default.' );

		$limiter = new Max_Execution_Limiter( null );
		$this->assertSame( 30, $this->force_get_property( $limiter, 'max_execution_time' ), 'Null execution limits should fall back to default.' );
	}

	public function test_should_abort_respects_runtime_and_initiator_windows() {
		$limiter = new Max_Execution_Limiter( 3600 );
		$this->assertFalse( $limiter->should_abort( time() ), 'Limiter should allow execution while within both windows.' );

		$this->force_set_property( $limiter, 'max_execution_time', 5 );
		$this->assertTrue( $limiter->should_abort( time() ), 'Limiter should abort when runtime budget is exhausted.' );

		$this->force_set_property( $limiter, 'max_execution_time', 3600 );
		$this->assertTrue( $limiter->should_abort( time() - DAY_IN_SECONDS - 1 ), 'Limiter should abort when initiator window exceeds 24h.' );
	}
}
