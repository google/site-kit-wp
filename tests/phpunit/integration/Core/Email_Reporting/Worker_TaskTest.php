<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Worker_TaskTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Processor;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Sender;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Formatter;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer_Factory;
use Google\Site_Kit\Core\Email_Reporting\Max_Execution_Limiter;
use Google\Site_Kit\Core\Email_Reporting\Worker_Task;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

class Worker_TaskTest extends TestCase {

	/**
	 * @var Email_Reporting_Scheduler|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $scheduler;

	/**
	 * @var Email_Log_Batch_Query|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $batch_query;

	/**
	 * @var Max_Execution_Limiter|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $limiter;

	/**
	 * @var Email_Reporting_Data_Requests|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $data_requests;

	/**
	 * @var Email_Template_Formatter|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $template_formatter;

	/**
	 * @var Email|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $email_sender;

	/**
	 * @var Email_Template_Renderer|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $template_renderer;

	/**
	 * @var Email_Template_Renderer_Factory|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $template_renderer_factory;

	/**
	 * @var Email_Log
	 */
	private $email_log;

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var array
	 */
	private $created_post_ids = array();

	/**
	 * @var Email_Log_Batch_Query
	 */
	private $real_batch_query;

	public function set_up() {
		parent::set_up();

		$this->context                   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->scheduler                 = $this->createMock( Email_Reporting_Scheduler::class );
		$this->batch_query               = $this->createMock( Email_Log_Batch_Query::class );
		$this->limiter                   = $this->createMock( Max_Execution_Limiter::class );
		$this->data_requests             = $this->createMock( Email_Reporting_Data_Requests::class );
		$this->template_formatter        = $this->createMock( Email_Template_Formatter::class );
		$this->email_sender              = $this->createMock( Email::class );
		$this->template_renderer         = $this->createMock( Email_Template_Renderer::class );
		$this->template_renderer_factory = $this->createMock( Email_Template_Renderer_Factory::class );
		$this->template_renderer_factory->method( 'create' )->willReturn( $this->template_renderer );
		$this->email_log        = new Email_Log( $this->context );
		$this->created_post_ids = array();
		$this->real_batch_query = new Email_Log_Batch_Query();
	}

	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		delete_transient( 'googlesitekit_email_reporting_worker_lock_weekly' );
		delete_transient( 'googlesitekit_email_reporting_worker_lock_monthly' );
		delete_transient( 'googlesitekit_email_reporting_worker_lock_quarterly' );

		if ( post_type_exists( Email_Log::POST_TYPE ) && function_exists( 'unregister_post_type' ) ) {
			unregister_post_type( Email_Log::POST_TYPE );
		}

		foreach ( array( Email_Log::STATUS_SENT, Email_Log::STATUS_FAILED, Email_Log::STATUS_SCHEDULED ) as $status ) {
			if ( isset( $GLOBALS['wp_post_statuses'][ $status ] ) ) {
				unset( $GLOBALS['wp_post_statuses'][ $status ] );
			}
		}

		foreach (
			array(
				Email_Log::META_REPORT_FREQUENCY,
				Email_Log::META_BATCH_ID,
				Email_Log::META_SEND_ATTEMPTS,
				Email_Log::META_ERROR_DETAILS,
				Email_Log::META_REPORT_REFERENCE_DATES,
				Email_Log::META_SITE_ID,
			) as $meta_key
		) {
			if ( function_exists( 'unregister_meta_key' ) ) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}

		parent::tear_down();
	}

	public function test_acquires_and_clears_lock() {
		$task            = $this->create_worker_task();
		$transient_name  = 'googlesitekit_email_reporting_worker_lock_weekly';
		$initiator_stamp = time();

		$this->limiter->expects( $this->once() )
			->method( 'should_abort' )
			->with( $initiator_stamp )
			->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->with( 'batch-lock' )
			->willReturn( true );

		$this->batch_query->expects( $this->never() )
			->method( 'get_pending_ids' );

		$task->handle_callback_action( 'batch-lock', Email_Reporting_Settings::FREQUENCY_WEEKLY, $initiator_stamp );

		$this->assertFalse( get_transient( $transient_name ), 'Transient lock should be cleared after execution.' );
	}

	public function test_existing_lock_short_circuits_worker() {
		$task           = $this->create_worker_task();
		$transient_name = 'googlesitekit_email_reporting_worker_lock_monthly';
		set_transient( $transient_name, time(), MINUTE_IN_SECONDS );

		$this->limiter->expects( $this->never() )->method( 'should_abort' );
		$this->batch_query->expects( $this->never() )->method( 'is_complete' );

		$task->handle_callback_action( 'batch-lock', Email_Reporting_Settings::FREQUENCY_MONTHLY, time() );

		$this->assertNotFalse( get_transient( $transient_name ), 'Existing lock should remain untouched when worker skips execution.' );
	}

	public function test_exits_without_rescheduling_when_complete() {
		$task = $this->create_worker_task();

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->willReturn( true );

		$this->scheduler->expects( $this->never() )
			->method( 'schedule_worker' );

		$task->handle_callback_action( 'batch-complete', Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );
	}

	public function test_schedules_follow_up_for_pending_ids() {
		$task            = $this->create_worker_task();
		$initiator_stamp = time();
		$pending_ids     = array( 11, 22 );
		$expected_delay  = 11 * MINUTE_IN_SECONDS;
		$captured_delay  = null;

		$this->limiter->expects( $this->exactly( 5 ) )
			->method( 'should_abort' )
			->with( $initiator_stamp )
			->willReturnOnConsecutiveCalls( false, false, false, false, false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'get_pending_ids' )
			->willReturn( $pending_ids );

		$this->batch_query->expects( $this->exactly( count( $pending_ids ) ) )
			->method( 'increment_attempt' )
			->withConsecutive( array( $pending_ids[0] ), array( $pending_ids[1] ) );

		$this->data_requests->expects( $this->never() )->method( 'get_user_payload' );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				'batch-follow-up',
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$initiator_stamp,
				$this->callback(
					function ( $delay ) use ( $initiator_stamp, &$captured_delay, $expected_delay ) {
						$captured_delay = $delay;
						return $delay >= $expected_delay;
					}
				)
			);

		$task->handle_callback_action( 'batch-follow-up', Email_Reporting_Settings::FREQUENCY_WEEKLY, $initiator_stamp );

		$this->assertNotNull( $captured_delay, 'Follow-up delay should be captured for assertion.' );
	}

	public function test_switches_to_log_site_id_on_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		$this->register_email_log_dependencies();

		$site_id            = self::factory()->blog->create();
		$batch_id           = 'batch-site-switch';
		$post_id            = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0, null, null, $site_id );
		$observed_blog_id   = null;
		$original_blog_id   = get_current_blog_id();
		$log_processor_mock = $this->createMock( Email_Log_Processor::class );

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->with( $batch_id )
			->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'get_pending_ids' )
			->with( $batch_id )
			->willReturn( array( $post_id ) );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$batch_id,
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$this->isType( 'int' ),
				$this->greaterThanOrEqual( 11 * MINUTE_IN_SECONDS )
			);

		$log_processor_mock->expects( $this->once() )
			->method( 'process' )
			->with( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY )
			->willReturnCallback(
				function () use ( &$observed_blog_id ) {
					$observed_blog_id = get_current_blog_id();
				}
			);

		$task = new Worker_Task(
			$this->limiter,
			$this->batch_query,
			$this->scheduler,
			$log_processor_mock,
			$this->data_requests
		);

		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( $site_id, $observed_blog_id, 'Worker should switch to the log site before processing.' );
		$this->assertSame( $original_blog_id, get_current_blog_id(), 'Worker should restore the original blog after processing.' );
	}

	public function test_increments_attempts_for_pending_posts() {
		$this->register_email_log_dependencies();

		$limiter = $this->createMock( Max_Execution_Limiter::class );
		$limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->method( 'get_user_payload' )->willReturn(
			new WP_Error( 'data_failure', 'No data' )
		);

		$task = new Worker_Task(
			$limiter,
			$this->real_batch_query,
			$this->scheduler,
			new Email_Log_Processor(
				$this->real_batch_query,
				$this->data_requests,
				$this->template_formatter,
				new Email_Report_Sender( $this->template_renderer_factory, $this->email_sender )
			),
			$this->data_requests
		);

		$batch_id       = 'batch-real';
		$scheduled_id   = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );
		$retry_failed   = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, 2 );
		$max_failed     = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, Email_Log_Batch_Query::MAX_ATTEMPTS );
		$completed_sent = $this->create_log_post( $batch_id, Email_Log::STATUS_SENT, 1 );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$batch_id,
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$this->isType( 'int' ),
				$this->greaterThanOrEqual( 11 * MINUTE_IN_SECONDS )
			);

		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( 1, (int) get_post_meta( $scheduled_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Scheduled post attempts should increment.' );
		$this->assertSame( 3, (int) get_post_meta( $retry_failed, Email_Log::META_SEND_ATTEMPTS, true ), 'Retriable failed post attempts should increment.' );
		$this->assertSame( Email_Log_Batch_Query::MAX_ATTEMPTS, (int) get_post_meta( $max_failed, Email_Log::META_SEND_ATTEMPTS, true ), 'Posts at max attempts should not change.' );
		$this->assertSame( 1, (int) get_post_meta( $completed_sent, Email_Log::META_SEND_ATTEMPTS, true ), 'Completed posts should remain untouched.' );
	}

	public function test_happy_path_marks_sent_and_clears_error() {
		$this->register_email_log_dependencies();

		$batch_id = 'batch-success';
		$user_id  = self::factory()->user->create( array( 'user_email' => 'report@example.com' ) );
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0, $user_id );
		$old_post = get_post( $post_id );
		$section  = new Email_Report_Data_Section_Part(
			'total_conversion_events',
			array(
				'title'  => 'Conversions',
				'labels' => array( 'Conversions' ),
				'values' => array( '10' ),
				'trends' => array( '5.5' ),
			)
		);

		update_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, 'old-error' );

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->expects( $this->once() )
			->method( 'get_user_payload' )
			->with( $user_id, $this->arrayHasKey( 'startDate' ) )
			->willReturn( array( 'total_conversion_events' => array( 'report' => true ) ) );

		$this->template_formatter->expects( $this->once() )
			->method( 'build_sections' )
			->willReturn( array( $section ) );

		$this->template_formatter->expects( $this->once() )
			->method( 'build_template_payload' )
			->with( array( $section ), Email_Reporting_Settings::FREQUENCY_WEEKLY, $this->arrayHasKey( 'startDate' ) )
			->willReturn(
				array(
					'sections_payload' => array( 'total_conversion_events' => array( 'value' => '10' ) ),
					'template_data'    => array( 'subject' => 'Subject' ),
				)
			);

		$this->template_renderer_factory->expects( $this->once() )
			->method( 'create' )
			->with( array( 'total_conversion_events' => array( 'value' => '10' ) ) )
			->willReturn( $this->template_renderer );

		$this->template_renderer->expects( $this->once() )
			->method( 'render' )
			->with( 'email-report', $this->arrayHasKey( 'subject' ) )
			->willReturn( '<html>Email</html>' );

		$this->template_renderer->expects( $this->once() )
			->method( 'render_text' )
			->with( 'email-report', $this->arrayHasKey( 'subject' ) )
			->willReturn( 'Plain text email content' );

		$this->email_sender->expects( $this->once() )
			->method( 'send' )
			->with(
				'report@example.com',
				'Subject',
				$this->stringContains( 'Email' ),
				array(),
				'Plain text email content'
			)
			->willReturn( true );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$batch_id,
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$this->isType( 'int' ),
				$this->greaterThanOrEqual( 11 * MINUTE_IN_SECONDS )
			);

		$task = $this->create_worker_task( $this->real_batch_query );
		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$updated_post = get_post( $post_id );

		$this->assertSame( Email_Log::STATUS_SENT, get_post_status( $post_id ), 'Post should be marked sent.' );
		$this->assertSame( '', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Error meta should be cleared after send.' );
		$this->assertNotSame( $old_post->post_date, $updated_post->post_date, 'Post date should update on send.' );
		$this->assertFalse( get_transient( 'googlesitekit_email_reporting_worker_lock_weekly' ), 'Lock transient should be cleared.' );
	}

	public function test_data_request_failure_marks_failed() {
		$this->register_email_log_dependencies();

		$batch_id = 'batch-error';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->expects( $this->once() )
			->method( 'get_user_payload' )
			->willReturn( new WP_Error( 'data_failure', 'Data failure' ) );

		$this->template_formatter->expects( $this->never() )->method( 'build_sections' );
		$this->template_renderer->expects( $this->never() )->method( 'render' );
		$this->email_sender->expects( $this->never() )->method( 'send' );

		$task = $this->create_worker_task( $this->real_batch_query );
		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Post should be marked failed when data request errors.' );
		$this->assertStringContainsString( 'data_failure', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be stored.' );
	}

	public function test_empty_sections_marks_failed() {
		$this->register_email_log_dependencies();

		$batch_id = 'batch-empty';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array() );
		$this->template_formatter->expects( $this->never() )->method( 'build_template_payload' );

		$task = $this->create_worker_task( $this->real_batch_query );
		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Post should be marked failed when no sections.' );
		$this->assertStringContainsString( 'No email report data available', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure should record missing data.' );
	}

	public function test_template_render_failure_marks_failed() {
		$this->register_email_log_dependencies();

		$batch_id = 'batch-render';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );
		$section  = new Email_Report_Data_Section_Part(
			'traffic',
			array(
				'title'  => 'Traffic',
				'labels' => array( 'Visitors' ),
				'values' => array( '100' ),
			)
		);

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array( $section ) );
		$this->template_formatter->method( 'build_template_payload' )->willReturn(
			array(
				'sections_payload' => array( 'traffic' => array() ),
				'template_data'    => array( 'subject' => 'Subject' ),
			)
		);
		$this->template_renderer_factory->method( 'create' )->willReturn( $this->template_renderer );
		$this->template_renderer->method( 'render' )->willReturn( new WP_Error( 'render_failed', 'Render failed' ) );

		$task = $this->create_worker_task( $this->real_batch_query );
		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Post should be marked failed when rendering fails.' );
		$this->assertStringContainsString( 'render_failed', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Render failure should be stored.' );
	}

	public function test_send_failure_marks_failed() {
		$this->register_email_log_dependencies();

		$batch_id = 'batch-send';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );
		$section  = new Email_Report_Data_Section_Part(
			'traffic',
			array(
				'title'  => 'Traffic',
				'labels' => array( 'Visitors' ),
				'values' => array( '100' ),
			)
		);

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array( $section ) );
		$this->template_formatter->method( 'build_template_payload' )->willReturn(
			array(
				'sections_payload' => array( 'traffic' => array() ),
				'template_data'    => array( 'subject' => 'Subject' ),
			)
		);
		$this->template_renderer_factory->method( 'create' )->willReturn( $this->template_renderer );
		$this->template_renderer->method( 'render' )->willReturn( '<html>Email</html>' );
		$this->template_renderer->method( 'render_text' )->willReturn( 'Plain text email content' );
		$this->email_sender->method( 'send' )->willReturn( new WP_Error( 'send_failure', 'Send failed' ) );

		$task = $this->create_worker_task( $this->real_batch_query );
		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Post should be marked failed when send fails.' );
		$this->assertStringContainsString( 'send_failure', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Send failure should be stored.' );
		$this->assertFalse( get_transient( 'googlesitekit_email_reporting_worker_lock_weekly' ), 'Lock transient should be cleared after send failure.' );
	}

	public function test_processes_multiple_posts_and_continues_after_failure() {
		$this->register_email_log_dependencies();

		$batch_id = 'batch-multi';
		$user_one = self::factory()->user->create( array( 'user_email' => 'one@example.com' ) );
		$user_two = self::factory()->user->create( array( 'user_email' => 'two@example.com' ) );
		$post_one = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0, $user_one );
		$post_two = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0, $user_two );
		$section  = new Email_Report_Data_Section_Part(
			'total_conversion_events',
			array(
				'title'  => 'Conversions',
				'labels' => array( 'Conversions' ),
				'values' => array( '5' ),
				'trends' => array( '10' ),
			)
		);

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->data_requests->expects( $this->exactly( 2 ) )
			->method( 'get_user_payload' )
			->willReturnOnConsecutiveCalls(
				new WP_Error( 'data_failure', 'Data Failure' ),
				array(
					'analytics-4' => array(
						'total_conversion_events' => array(),
					),
				)
			);

		$this->template_formatter->expects( $this->once() )
			->method( 'build_sections' )
			->willReturn( array( $section ) );

		$this->template_formatter->expects( $this->once() )
			->method( 'build_template_payload' )
			->willReturn(
				array(
					'sections_payload' => array(
						'total_conversion_events' => array(
							'value'  => '5',
							'change' => 10,
							'label'  => 'Conversions',
						),
					),
					'template_data'    => array( 'subject' => 'Subject' ),
				)
			);

		$this->template_renderer_factory->method( 'create' )->willReturn( $this->template_renderer );
		$this->template_renderer->method( 'render' )->willReturn( '<html>Email</html>' );
		$this->template_renderer->method( 'render_text' )->willReturn( 'Plain text email content' );

		$this->email_sender->expects( $this->once() )
			->method( 'send' )
			->with(
				$this->callback( fn( $to ) => in_array( $to, array( 'one@example.com', 'two@example.com' ), true ) ),
				'Subject',
				$this->stringContains( 'Email' ),
				array(),
				'Plain text email content'
			)
			->willReturn( true );

		$task = $this->create_worker_task( $this->real_batch_query );
		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$statuses = array(
			$post_one => get_post_status( $post_one ),
			$post_two => get_post_status( $post_two ),
		);

		$this->assertContains( Email_Log::STATUS_FAILED, $statuses, 'One post should fail on data error.' );
		$this->assertContains( Email_Log::STATUS_SENT, $statuses, 'One post should send successfully.' );

		$failed_id = array_search( Email_Log::STATUS_FAILED, $statuses, true );
		$sent_id   = array_search( Email_Log::STATUS_SENT, $statuses, true );

		$this->assertStringContainsString( 'data_failure', get_post_meta( $failed_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
		$this->assertSame( '', get_post_meta( $sent_id, Email_Log::META_ERROR_DETAILS, true ), 'Sent post should clear errors.' );
	}

	private function create_worker_task( $batch_query = null, $template_renderer_factory = null ) {
		$batch_query               = $batch_query ?: $this->batch_query;
		$template_renderer_factory = $template_renderer_factory ?: $this->template_renderer_factory;

		$report_sender = new Email_Report_Sender( $template_renderer_factory, $this->email_sender );
		$log_processor = new Email_Log_Processor(
			$batch_query,
			$this->data_requests,
			$this->template_formatter,
			$report_sender
		);

		return new Worker_Task(
			$this->limiter,
			$batch_query,
			$this->scheduler,
			$log_processor,
			$this->data_requests
		);
	}

	private function create_log_post( $batch_id, $status, $attempts, $user_id = null, $date_range_meta = null, $site_id = null ) {
		$user_id = $user_id ?: self::factory()->user->create();
		$site_id = null !== $site_id ? (int) $site_id : get_current_blog_id();

		$post_id = wp_insert_post(
			array(
				'post_type'     => Email_Log::POST_TYPE,
				'post_status'   => $status,
				'post_title'    => 'Worker Log ' . uniqid(),
				'post_author'   => $user_id,
				'post_date'     => '2000-01-01 00:00:00',
				'post_date_gmt' => '2000-01-01 00:00:00',
				'meta_input'    => array(
					Email_Log::META_BATCH_ID               => $batch_id,
					Email_Log::META_REPORT_FREQUENCY       => Email_Reporting_Settings::FREQUENCY_WEEKLY,
					Email_Log::META_SEND_ATTEMPTS          => $attempts,
					Email_Log::META_REPORT_REFERENCE_DATES => $date_range_meta ?: $this->get_reference_dates_meta(),
					Email_Log::META_SITE_ID                => $site_id,
				),
			)
		);

		$this->created_post_ids[] = $post_id;

		return $post_id;
	}

	private function register_email_log_dependencies() {
		if ( post_type_exists( Email_Log::POST_TYPE ) ) {
			return;
		}

		$email_log       = new Email_Log( $this->context );
		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $email_log );
	}

	private function get_reference_dates_meta() {
		return array(
			'startDate'        => strtotime( '2024-01-01' ),
			'sendDate'         => strtotime( '2024-01-07' ),
			'compareStartDate' => strtotime( '2023-12-25' ),
			'compareEndDate'   => strtotime( '2023-12-31' ),
		);
	}
}
