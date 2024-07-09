<?php
/**
 * Survey_TimeoutsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Surveys
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Surveys;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\User_Surveys\Survey_Timeouts;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Survey_TimeoutsTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Survey_Timeouts
	 */
	private $timeouts;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options = new User_Options( $context, $user_id );
		$this->timeouts     = new Survey_Timeouts( $this->user_options );
		$this->timeouts->register();
	}

	public function test_add() {
		$this->assertEmpty( $this->user_options->get( Survey_Timeouts::OPTION ) );

		$this->timeouts->add( 'foo', 100 );
		$timeouts = $this->user_options->get( Survey_Timeouts::OPTION );
		$this->assertArrayHasKey( 'foo', $timeouts );
		$this->assertEqualsWithDelta( time() + 100, $timeouts['foo'], 2 );
	}

	public function test_get_survey_timeouts() {
		$this->user_options->set(
			Survey_Timeouts::OPTION,
			array(
				'foo' => 0,
				'bar' => time() + 100,
				'baz' => time() - 100,
			)
		);

		$this->assertEquals(
			array(
				'bar',
			),
			$this->timeouts->get_survey_timeouts()
		);
	}

	public function test_set_global_timeout() {
		$this->assertEmpty( $this->user_options->get( Survey_Timeouts::OPTION ) );

		$time    = array();
		$timeout = 12 * HOUR_IN_SECONDS;

		array_push( $time, time() + $timeout );
		$this->timeouts->set_global_timeout();
		array_push( $time, time() + $timeout );

		$timeouts = $this->user_options->get( Survey_Timeouts::OPTION );
		$this->assertArrayHasKey( Survey_Timeouts::GLOBAL_KEY, $timeouts );
		$this->assertTrue( $time[0] >= $timeouts[ Survey_Timeouts::GLOBAL_KEY ] );
		$this->assertTrue( $time[1] <= $timeouts[ Survey_Timeouts::GLOBAL_KEY ] );
	}
}
