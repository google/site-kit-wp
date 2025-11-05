<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Initiator_TaskTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Initiator_Task;
use Google\Site_Kit\Core\Email_Reporting\Subscribed_Users_Query;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Initiator_TaskTest extends TestCase {

	/**
	 * @var Initiator_Task
	 */
	private $task;

	/**
	 * @var \PHPUnit_Framework_MockObject_MockObject|Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * @var \PHPUnit_Framework_MockObject_MockObject|Subscribed_Users_Query
	 */
	private $query;

	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$this->scheduler = $this->getMockBuilder( Email_Reporting_Scheduler::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'schedule_next_initiator', 'schedule_worker', 'schedule_fallback' ) )
			->getMock();

		$this->query = $this->getMockBuilder( Subscribed_Users_Query::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'for_frequency' ) )
			->getMock();

		$this->task             = new Initiator_Task( $this->scheduler, $this->query );
		$this->created_post_ids = array();
	}

	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		parent::tear_down();
	}

	public function test_handle_callback_action_creates_logs_and_schedules_follow_up_events() {
		$user_ids = array(
			self::factory()->user->create(),
			self::factory()->user->create(),
		);

		$this->query->expects( $this->once() )
			->method( 'for_frequency' )
			->with( Email_Reporting_Settings::FREQUENCY_WEEKLY )
			->willReturn( $user_ids );

		$captured_batch_id           = null;
		$captured_worker_timestamp   = null;
		$captured_fallback_timestamp = null;

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_next_initiator' )
			->with( Email_Reporting_Settings::FREQUENCY_WEEKLY, $this->isType( 'int' ) );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$this->callback(
					function ( $batch_id ) use ( &$captured_batch_id ) {
						$captured_batch_id = $batch_id;
						return is_string( $batch_id ) && '' !== $batch_id;
					}
				),
				$this->equalTo( Email_Reporting_Settings::FREQUENCY_WEEKLY ),
				$this->callback(
					function ( $timestamp ) use ( &$captured_worker_timestamp ) {
						$captured_worker_timestamp = $timestamp;
						return is_int( $timestamp );
					}
				)
			);

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_fallback' )
			->with(
				$this->equalTo( Email_Reporting_Settings::FREQUENCY_WEEKLY ),
				$this->callback(
					function ( $timestamp ) use ( &$captured_fallback_timestamp ) {
						$captured_fallback_timestamp = $timestamp;
						return is_int( $timestamp );
					}
				)
			);

		$this->task->handle_callback_action( Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertNotNull( $captured_batch_id, 'Batch ID should be generated during callback handling.' );
		$this->assertNotNull( $captured_worker_timestamp, 'Worker timestamp should be captured when scheduling worker.' );
		$this->assertNotNull( $captured_fallback_timestamp, 'Fallback timestamp should be captured when scheduling fallback.' );

		$posts = get_posts(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => 'any',
				'numberposts' => -1,
				'orderby'     => 'ID',
				'order'       => 'ASC',
			)
		);

		$this->created_post_ids = wp_list_pluck( $posts, 'ID' );

		$this->assertCount( count( $user_ids ), $posts, 'Each subscriber should receive a corresponding email log.' );

		foreach ( $posts as $post ) {
			$this->assertContains( (int) $post->post_author, $user_ids, 'Email log author should match subscriber ID list.' );
			$this->assertSame( $captured_batch_id, get_post_meta( $post->ID, Email_Log::META_BATCH_ID, true ), 'Email log batch ID should match scheduled batch.' );
			$this->assertSame( Email_Reporting_Settings::FREQUENCY_WEEKLY, get_post_meta( $post->ID, Email_Log::META_REPORT_FREQUENCY, true ), 'Email log frequency should match callback frequency.' );
			$this->assertSame( $captured_batch_id, $post->post_title, 'Email log title should reflect the batch ID.' );

			$send_attempts = get_post_meta( $post->ID, Email_Log::META_SEND_ATTEMPTS, true );
			$this->assertSame( 0, (int) $send_attempts, 'Email log send attempts should start at zero.' );

			$reference_dates = get_post_meta( $post->ID, Email_Log::META_REPORT_REFERENCE_DATES, true );
			$this->assertIsArray( $reference_dates, 'Reference dates should decode to an array.' );
			$this->assertArrayHasKey( 'startDate', $reference_dates, 'Reference dates should include start date.' );
			$this->assertArrayHasKey( 'sendDate', $reference_dates, 'Reference dates should include send date.' );
			$this->assertArrayHasKey( 'compareStartDate', $reference_dates, 'Reference dates should include compare start date.' );
			$this->assertArrayHasKey( 'compareEndDate', $reference_dates, 'Reference dates should include compare end date.' );
		}
	}

	public function test_handle_callback_action_without_subscribers_still_schedules_follow_up_events() {
		$this->query->expects( $this->once() )
			->method( 'for_frequency' )
			->with( Email_Reporting_Settings::FREQUENCY_MONTHLY )
			->willReturn( array() );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_next_initiator' )
			->with( Email_Reporting_Settings::FREQUENCY_MONTHLY, $this->isType( 'int' ) );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( Email_Reporting_Settings::FREQUENCY_MONTHLY ),
				$this->isType( 'int' )
			);

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_fallback' )
			->with( $this->equalTo( Email_Reporting_Settings::FREQUENCY_MONTHLY ), $this->isType( 'int' ) );

		$this->task->handle_callback_action( Email_Reporting_Settings::FREQUENCY_MONTHLY );

		$posts = get_posts(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => 'any',
				'numberposts' => -1,
			)
		);

		$this->assertEmpty( $posts, 'No email logs should be created when there are no subscribers.' );
	}
}
