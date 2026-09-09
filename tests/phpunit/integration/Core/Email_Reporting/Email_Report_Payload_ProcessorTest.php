<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Report_Payload_ProcessorTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Email_Report_Payload_Processor;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Email_Report_Payload_ProcessorTest extends TestCase {

	/**
	 * Payload processor under test.
	 *
	 * @var Email_Report_Payload_Processor
	 */
	private $processor;

	public function set_up() {
		parent::set_up();
		$this->processor = new Email_Report_Payload_Processor();
	}

	public function test_compute_trend__returns_the_percentage_change_between_the_two_values() {
		$this->assertSame(
			16.0,
			$this->processor->compute_trend( 116, 100 ),
			'compute_trend() should return 16.0 for a rise from 100 to 116.'
		);
		$this->assertSame(
			-20.0,
			$this->processor->compute_trend( 80, 100 ),
			'compute_trend() should return -20.0 for a fall from 100 to 80.'
		);
	}

	public function test_compute_trend__returns_null_when_the_comparison_value_is_zero() {
		$this->assertNull(
			$this->processor->compute_trend( 116, 0 ),
			'compute_trend() should return null when the comparison value is zero, because a change from zero has no percentage.'
		);
	}

	public function test_compute_trend__returns_null_when_either_value_is_not_a_number() {
		$this->assertNull(
			$this->processor->compute_trend( null, 100 ),
			'compute_trend() should return null when the current value is not a number.'
		);

		$this->assertNull(
			$this->processor->compute_trend( 116, true ),
			'compute_trend() should return null when the comparison value is not a number.'
		);
	}
}
