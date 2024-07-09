<?php
/**
 * Survey_QueueTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Surveys
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Surveys;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\User_Surveys\Survey_Queue;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Survey_QueueTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Survey_Queue
	 */
	private $queue;

	/**
	 * @var array
	 */
	private $survey1;

	/**
	 * @var array
	 */
	private $survey2;

	/**
	 * @var array
	 */
	private $survey3;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options = new User_Options( $context, $user_id );
		$this->queue        = new Survey_Queue( $this->user_options );
		$this->queue->register();

		$this->survey1 = array(
			'survey_id' => 'test_survey_1',
			'payload'   => array(),
			'session'   => array(
				'session_id'    => 'test_session_id_1',
				'session_token' => 'test_session_token_1',
			),
		);
		$this->survey2 = array(
			'survey_id' => 'test_survey_2',
			'payload'   => array(),
			'session'   => array(
				'session_id'    => 'test_session_id_2',
				'session_token' => 'test_session_token_2',
			),
		);
		$this->survey3 = array(
			'survey_id' => 'test_survey_3',
			'payload'   => array(),
			'session'   => array(
				'session_id'    => 'test_session_id_3',
				'session_token' => 'test_session_token_3',
			),
		);
	}

	public function test_enqueue() {
		$added = $this->queue->enqueue( $this->survey1 );

		$this->assertTrue( $added );
		$this->assertEquals(
			array(
				$this->survey1,
			),
			$this->user_options->get( Survey_Queue::OPTION )
		);
	}

	public function test_enqueue_existing_survey() {
		$this->user_options->set( Survey_Queue::OPTION, array( $this->survey1 ) );

		$added = $this->queue->enqueue( $this->survey1 );

		$this->assertFalse( $added );
		$this->assertEquals(
			array(
				$this->survey1,
			),
			$this->user_options->get( Survey_Queue::OPTION )
		);
	}

	public function test_dequeue() {
		$this->user_options->set(
			Survey_Queue::OPTION,
			array(
				$this->survey1,
				$this->survey2,
				$this->survey3,
			)
		);

		$survey = $this->queue->dequeue( $this->survey2['survey_id'] );

		$this->assertEquals( $survey, $this->survey2 );
		$this->assertEquals(
			array( $this->survey1, $this->survey3 ),
			$this->user_options->get( Survey_Queue::OPTION )
		);
	}

	public function test_dequeue_nonexisting_survey() {
		$this->user_options->set(
			Survey_Queue::OPTION,
			array( $this->survey1, $this->survey2, $this->survey3 )
		);

		$survey = $this->queue->dequeue( 'survey_id_4' );

		$this->assertNull( $survey );
		$this->assertEquals(
			array( $this->survey1, $this->survey2, $this->survey3 ),
			$this->user_options->get( Survey_Queue::OPTION )
		);
	}

	public function test_front() {
		$this->user_options->set(
			Survey_Queue::OPTION,
			array(
				$this->survey2,
				$this->survey1,
				$this->survey3,
			)
		);

		$survey = $this->queue->front();

		$this->assertEquals( $survey, $this->survey2 );
		$this->assertEquals(
			array( $this->survey2, $this->survey1, $this->survey3 ),
			$this->user_options->get( Survey_Queue::OPTION )
		);
	}

	public function test_front_empty_queue() {
		$survey = $this->queue->front();
		$this->assertNull( $survey );
	}

	public function test_find_by_session() {
		$this->user_options->set(
			Survey_Queue::OPTION,
			array( $this->survey1, $this->survey2, $this->survey3 )
		);

		$survey = $this->queue->find_by_session( $this->survey3['session'] );
		$this->assertEquals( $survey, $this->survey3 );
	}

	public function test_find_by_session_not_found() {
		$this->user_options->set(
			Survey_Queue::OPTION,
			array( $this->survey1 )
		);

		$survey = $this->queue->find_by_session( $this->survey3['session'] );
		$this->assertNull( $survey );
	}
}
