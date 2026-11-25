<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\EventTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Event;
use Google\Site_Kit\Tests\TestCase;
use stdClass;

/**
 * @group Modules
 * @group Analytics_4
 */
class EventTest extends TestCase {

	public function test_construct__casts_and_truncates_param_values() {
		$event = new Event(
			'sign_up',
			array(
				'user_count' => 3,
				'ratio'      => 1.5,
				'is_new'     => true,
				'is_spam'    => false,
				'title'      => str_repeat( 'a', 150 ),
			),
			'sign_up:user:1'
		);

		$this->assertSame(
			array(
				'user_count' => '3',
				'ratio'      => '1.5',
				'is_new'     => '1',
				'is_spam'    => '',
				'title'      => str_repeat( 'a', 100 ),
			),
			$event->get_params(),
			'Each param value should be a string of 100 characters at most.'
		);
	}

	public function test_construct__truncates_non_ascii_value_by_characters() {
		// `€` takes 3 bytes, so a cut after 100 bytes would leave part of a character.
		$event = new Event( 'sign_up', array( 'title' => str_repeat( '€', 150 ) ), 'sign_up:user:1' );
		$title = $event->get_params()['title'];

		$this->assertNotFalse( json_encode( $title ), 'A truncated value should still encode as JSON.' );
		$this->assertSame( str_repeat( '€', 100 ), $title, 'A value should be truncated to 100 characters, not 100 bytes.' );
	}

	/**
	 * @dataProvider data_non_scalar_values
	 *
	 * @param mixed $value Param value that is not a scalar.
	 */
	public function test_construct__drops_non_scalar_params( $value ) {
		$event = new Event(
			'sign_up',
			array(
				'method' => 'email',
				'other'  => $value,
			),
			'sign_up:user:1'
		);

		$this->assertSame( array( 'method' => 'email' ), $event->get_params(), 'A param whose value is not a scalar should be dropped.' );
	}

	public function data_non_scalar_values() {
		return array(
			'an array'  => array( array( 'email' ) ),
			'an object' => array( new stdClass() ),
			'null'      => array( null ),
		);
	}

	public function test_construct__sets_timestamp_in_microseconds() {
		$before = (int) ( microtime( true ) * 1000000 );
		$event  = new Event( 'sign_up', array(), 'sign_up:user:1' );
		$after  = (int) ( microtime( true ) * 1000000 );

		$this->assertIsInt( $event->get_timestamp_micros(), 'The time should be a whole number of microseconds.' );
		$this->assertGreaterThanOrEqual( $before, $event->get_timestamp_micros(), 'The time should be in microseconds, not seconds.' );
		$this->assertLessThanOrEqual( $after, $event->get_timestamp_micros(), 'The time should be the time the event was created.' );
	}
}
