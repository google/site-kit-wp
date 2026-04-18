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
			->setMethods( array( 'schedule_next_initiator', 'schedule_worker', 'schedule_fallback' ) )
			->getMock();

		$this->query = $this->getMockBuilder( Subscribed_Users_Query::class )
			->disableOriginalConstructor()
			->setMethods( array( 'for_frequency' ) )
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

		$scheduled_timestamp = strtotime( '2023-11-15 01:00:00 UTC' );

		$this->query->expects( $this->once() )
			->method( 'for_frequency' )
			->with( Email_Reporting_Settings::FREQUENCY_WEEKLY )
			->willReturn( $user_ids );

		$captured_batch_id           = null;
		$captured_worker_timestamp   = null;
		$captured_fallback_timestamp = null;
		$captured_fallback_batch_id  = null;

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_next_initiator' )
			->with( Email_Reporting_Settings::FREQUENCY_WEEKLY, $scheduled_timestamp );

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
					function ( $timestamp ) use ( &$captured_worker_timestamp, $scheduled_timestamp ) {
						$captured_worker_timestamp = $timestamp;
						return is_int( $timestamp ) && $scheduled_timestamp === $timestamp;
					}
				)
			);

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_fallback' )
			->with(
				$this->callback(
					function ( $batch_id ) use ( &$captured_fallback_batch_id ) {
						$captured_fallback_batch_id = $batch_id;
						return is_string( $batch_id ) && '' !== $batch_id;
					}
				),
				$this->equalTo( Email_Reporting_Settings::FREQUENCY_WEEKLY ),
				$this->callback(
					function ( $timestamp ) use ( &$captured_fallback_timestamp, $scheduled_timestamp ) {
						$captured_fallback_timestamp = $timestamp;
						return is_int( $timestamp ) && $scheduled_timestamp === $timestamp;
					}
				)
			);

		$this->task->handle_callback_action( Email_Reporting_Settings::FREQUENCY_WEEKLY, $scheduled_timestamp );

		$this->assertNotNull( $captured_batch_id, 'Batch ID should be generated during callback handling.' );
		$this->assertSame( $captured_batch_id, $captured_fallback_batch_id, 'Fallback should be scheduled with the same batch ID.' );
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
			$this->assertSame( Email_Log::TEMPLATE_TYPE_EMAIL_REPORT, get_post_meta( $post->ID, Email_Log::META_TEMPLATE_TYPE, true ), 'Email log template type should default to email-report.' );
			$this->assertSame( get_current_blog_id(), (int) get_post_meta( $post->ID, Email_Log::META_SITE_ID, true ), 'Email log should store the current site ID.' );
			$this->assertSame( $captured_batch_id, $post->post_title, 'Email log title should reflect the batch ID.' );

			$send_attempts = get_post_meta( $post->ID, Email_Log::META_SEND_ATTEMPTS, true );
			$this->assertSame( 0, (int) $send_attempts, 'Email log send attempts should start at zero.' );

			$reference_dates = get_post_meta( $post->ID, Email_Log::META_REPORT_REFERENCE_DATES, true );
			$this->assertIsArray( $reference_dates, 'Reference dates should decode to an array.' );
			$this->assertArrayHasKey( 'startDate', $reference_dates, 'Reference dates should include start date.' );
			$this->assertArrayHasKey( 'endDate', $reference_dates, 'Reference dates should include end date.' );
			$this->assertArrayHasKey( 'compareStartDate', $reference_dates, 'Reference dates should include compare start date.' );
			$this->assertArrayHasKey( 'compareEndDate', $reference_dates, 'Reference dates should include compare end date.' );
		}
	}

	public function test_handle_callback_action_without_subscribers_still_schedules_follow_up_events() {
		$scheduled_timestamp = strtotime( '2023-11-15 01:00:00 UTC' );

		$this->query->expects( $this->once() )
			->method( 'for_frequency' )
			->with( Email_Reporting_Settings::FREQUENCY_MONTHLY )
			->willReturn( array() );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_next_initiator' )
			->with( Email_Reporting_Settings::FREQUENCY_MONTHLY, $scheduled_timestamp );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( Email_Reporting_Settings::FREQUENCY_MONTHLY ),
				$scheduled_timestamp
			);

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_fallback' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( Email_Reporting_Settings::FREQUENCY_MONTHLY ),
				$scheduled_timestamp
			);

		$this->task->handle_callback_action( Email_Reporting_Settings::FREQUENCY_MONTHLY, $scheduled_timestamp );

		$posts = get_posts(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => 'any',
				'numberposts' => -1,
			)
		);

		$this->assertEmpty( $posts, 'No email logs should be created when there are no subscribers.' );
	}

	/**
	 * @dataProvider data_build_reference_dates_uses_expected_period_length
	 */
	public function test_build_reference_dates_uses_expected_period_length( $frequency, $expected_current_days, $expected_compare_days, $timestamp ) {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );

		try {
			$reference_dates = Initiator_Task::build_reference_dates(
				$frequency,
				$timestamp
			);

			$current_start = new \DateTimeImmutable( $reference_dates['startDate'] );
			$current_end   = new \DateTimeImmutable( $reference_dates['endDate'] );
			$current_days  = (int) $current_start->diff( $current_end )->days + 1;

			$compare_start = new \DateTimeImmutable( $reference_dates['compareStartDate'] );
			$compare_end   = new \DateTimeImmutable( $reference_dates['compareEndDate'] );
			$compare_days  = (int) $compare_start->diff( $compare_end )->days + 1;

			$this->assertSame( $expected_current_days, $current_days, 'Expected current reference range to use inclusive period length.' );
			$this->assertSame( $expected_compare_days, $compare_days, 'Expected compare reference range to use its own natural period length.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	/**
	 * @dataProvider data_build_reference_dates_monthly_uses_previous_month_window
	 */
	public function test_build_reference_dates_monthly_uses_previous_month_window( $scheduled_timestamp, $expected_start, $expected_end, $expected_days, $expected_compare_start, $expected_compare_end ) {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );

		try {
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_MONTHLY,
				$scheduled_timestamp
			);

			$this->assertSame( $expected_start, $reference_dates['startDate'], 'Expected monthly startDate to be first day of previous month.' );
			$this->assertSame( $expected_end, $reference_dates['endDate'], 'Expected monthly endDate to be last day of previous month.' );

			$current_start = new \DateTimeImmutable( $reference_dates['startDate'] );
			$current_end   = new \DateTimeImmutable( $reference_dates['endDate'] );
			$current_days  = (int) $current_start->diff( $current_end )->days + 1;

			$this->assertSame( $expected_days, $current_days, 'Expected monthly range length to match previous month day count.' );
			$this->assertSame( $expected_compare_start, $reference_dates['compareStartDate'], 'Expected monthly compareStartDate to be first day of the month before previous.' );
			$this->assertSame( $expected_compare_end, $reference_dates['compareEndDate'], 'Expected monthly compareEndDate to be last day of the month before previous.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	/**
	 * @dataProvider data_build_reference_dates_quarterly_uses_previous_quarter_window
	 */
	public function test_build_reference_dates_quarterly_uses_previous_quarter_window( $scheduled_timestamp, $expected_start, $expected_end, $expected_days, $expected_compare_start, $expected_compare_end ) {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );

		try {
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_QUARTERLY,
				$scheduled_timestamp
			);

			$this->assertSame( $expected_start, $reference_dates['startDate'], 'Expected quarterly startDate to be first day of previous quarter.' );
			$this->assertSame( $expected_end, $reference_dates['endDate'], 'Expected quarterly endDate to be last day of previous quarter.' );

			$current_start = new \DateTimeImmutable( $reference_dates['startDate'] );
			$current_end   = new \DateTimeImmutable( $reference_dates['endDate'] );
			$current_days  = (int) $current_start->diff( $current_end )->days + 1;

			$this->assertSame( $expected_days, $current_days, 'Expected quarterly range length to match previous quarter day count.' );
			$this->assertSame( $expected_compare_start, $reference_dates['compareStartDate'], 'Expected quarterly compareStartDate to be first day of the quarter before previous.' );
			$this->assertSame( $expected_compare_end, $reference_dates['compareEndDate'], 'Expected quarterly compareEndDate to be last day of the quarter before previous.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	public function test_build_reference_dates_weekly_returns_previous_complete_week() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );
		$original_start_of_week   = get_option( 'start_of_week' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );
		// Monday start.
		update_option( 'start_of_week', 1 );

		try {
			// Thursday March 19 - should return previous complete week Mon Mar 9 – Sun Mar 15.
			$timestamp       = strtotime( '2026-03-19 00:00:00 UTC' );
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$timestamp
			);

			$this->assertSame( '2026-03-09', $reference_dates['startDate'], 'Expected weekly startDate to be Monday of previous week.' );
			$this->assertSame( '2026-03-15', $reference_dates['endDate'], 'Expected weekly endDate to be Sunday of previous week.' );
			$this->assertSame( '2026-03-02', $reference_dates['compareStartDate'], 'Expected compare startDate to be Monday two weeks ago.' );
			$this->assertSame( '2026-03-08', $reference_dates['compareEndDate'], 'Expected compare endDate to be Sunday two weeks ago.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
			update_option( 'start_of_week', $original_start_of_week );
		}
	}

	public function data_build_reference_dates_uses_expected_period_length() {
		return array(
			// frequency, expected_current_days, expected_compare_days, timestamp.
			'weekly'    => array( Email_Reporting_Settings::FREQUENCY_WEEKLY, 7, 7, strtotime( '2026-03-16 00:00:00 UTC' ) ),
			'monthly'   => array( Email_Reporting_Settings::FREQUENCY_MONTHLY, 28, 31, strtotime( '2026-03-01 00:00:00 UTC' ) ),
			'quarterly' => array( Email_Reporting_Settings::FREQUENCY_QUARTERLY, 92, 92, strtotime( '2026-01-01 00:00:00 UTC' ) ),
		);
	}

	public function data_build_reference_dates_monthly_uses_previous_month_window() {
		return array(
			// timestamp, startDate, endDate, days, compareStartDate, compareEndDate.
			'previous month has 28 days'             => array( strtotime( '2026-03-01 00:00:00 UTC' ), '2026-02-01', '2026-02-28', 28, '2026-01-01', '2026-01-31' ),
			'previous month has 29 days (leap year)' => array( strtotime( '2024-03-01 00:00:00 UTC' ), '2024-02-01', '2024-02-29', 29, '2024-01-01', '2024-01-31' ),
			'previous month has 30 days'             => array( strtotime( '2026-05-01 00:00:00 UTC' ), '2026-04-01', '2026-04-30', 30, '2026-03-01', '2026-03-31' ),
			'previous month has 31 days'             => array( strtotime( '2026-08-01 00:00:00 UTC' ), '2026-07-01', '2026-07-31', 31, '2026-06-01', '2026-06-30' ),
		);
	}

	public function data_build_reference_dates_quarterly_uses_previous_quarter_window() {
		return array(
			// timestamp, startDate, endDate, days, compareStartDate, compareEndDate.
			'previous quarter has 90 days'        => array( strtotime( '2026-04-01 00:00:00 UTC' ), '2026-01-01', '2026-03-31', 90, '2025-10-01', '2025-12-31' ),
			'previous quarter has 91 days (leap)' => array( strtotime( '2024-04-01 00:00:00 UTC' ), '2024-01-01', '2024-03-31', 91, '2023-10-01', '2023-12-31' ),
			'previous quarter has 91 days (Q2)'   => array( strtotime( '2026-07-01 00:00:00 UTC' ), '2026-04-01', '2026-06-30', 91, '2026-01-01', '2026-03-31' ),
			'previous quarter has 92 days'        => array( strtotime( '2026-10-01 00:00:00 UTC' ), '2026-07-01', '2026-09-30', 92, '2026-04-01', '2026-06-30' ),
			'previous quarter has 92 days (Q4)'   => array( strtotime( '2026-01-01 00:00:00 UTC' ), '2025-10-01', '2025-12-31', 92, '2025-07-01', '2025-09-30' ),
		);
	}

	/**
	 * @dataProvider data_build_reference_dates_mid_period_triggers
	 */
	public function test_build_reference_dates_mid_period_returns_canonical_previous_period( $frequency, $timestamp, $expected_start, $expected_end, $expected_compare_start, $expected_compare_end ) {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );
		$original_start_of_week   = get_option( 'start_of_week' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );
		update_option( 'start_of_week', 1 ); // Monday.

		try {
			$reference_dates = Initiator_Task::build_reference_dates( $frequency, $timestamp );

			$this->assertSame( $expected_start, $reference_dates['startDate'], 'Mid-period trigger should still resolve canonical previous period startDate.' );
			$this->assertSame( $expected_end, $reference_dates['endDate'], 'Mid-period trigger should still resolve canonical previous period endDate.' );
			$this->assertSame( $expected_compare_start, $reference_dates['compareStartDate'], 'Mid-period trigger should resolve correct compareStartDate.' );
			$this->assertSame( $expected_compare_end, $reference_dates['compareEndDate'], 'Mid-period trigger should resolve correct compareEndDate.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
			update_option( 'start_of_week', $original_start_of_week );
		}
	}

	public function data_build_reference_dates_mid_period_triggers() {
		return array(
			// Monthly triggered on March 7 - should still report February.
			'monthly mid-period'   => array(
				Email_Reporting_Settings::FREQUENCY_MONTHLY,
				strtotime( '2026-03-07 00:00:00 UTC' ),
				'2026-02-01',
				'2026-02-28',
				'2026-01-01',
				'2026-01-31',
			),
			// Quarterly triggered on May 20 - should report Q1 (Jan-Mar).
			'quarterly mid-period' => array(
				Email_Reporting_Settings::FREQUENCY_QUARTERLY,
				strtotime( '2026-05-20 00:00:00 UTC' ),
				'2026-01-01',
				'2026-03-31',
				'2025-10-01',
				'2025-12-31',
			),
			// Weekly triggered on Wednesday (start_of_week=Monday) - reports previous Mon-Sun.
			'weekly mid-period'    => array(
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				strtotime( '2026-03-11 00:00:00 UTC' ), // Wednesday.
				'2026-03-02',
				'2026-03-08',
				'2026-02-23',
				'2026-03-01',
			),
		);
	}

	/**
	 * @dataProvider data_build_reference_dates_weekly_start_of_week_variations
	 */
	public function test_build_reference_dates_weekly_respects_start_of_week( $start_of_week, $timestamp, $expected_start, $expected_end ) {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );
		$original_start_of_week   = get_option( 'start_of_week' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );
		update_option( 'start_of_week', $start_of_week );

		try {
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$timestamp
			);

			$this->assertSame( $expected_start, $reference_dates['startDate'], 'Weekly startDate should respect start_of_week setting.' );
			$this->assertSame( $expected_end, $reference_dates['endDate'], 'Weekly endDate should respect start_of_week setting.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
			update_option( 'start_of_week', $original_start_of_week );
		}
	}

	public function data_build_reference_dates_weekly_start_of_week_variations() {
		// Trigger on Wednesday 2026-03-11.
		$timestamp = strtotime( '2026-03-11 00:00:00 UTC' );
		return array(
			// Sunday start (0): week = Sun-Sat. Previous week: Sun Mar 1 – Sat Mar 7.
			'sunday start'   => array( 0, $timestamp, '2026-03-01', '2026-03-07' ),
			// Monday start (1): week = Mon-Sun. Previous week: Mon Mar 2 – Sun Mar 8.
			'monday start'   => array( 1, $timestamp, '2026-03-02', '2026-03-08' ),
			// Saturday start (6): week = Sat-Fri. Previous week: Sat Feb 28 – Fri Mar 6.
			'saturday start' => array( 6, $timestamp, '2026-02-28', '2026-03-06' ),
		);
	}

	public function test_build_reference_dates_monthly_year_boundary() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );

		try {
			// Trigger in January - should report December of previous year.
			$timestamp       = strtotime( '2026-01-15 00:00:00 UTC' );
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_MONTHLY,
				$timestamp
			);

			$this->assertSame( '2025-12-01', $reference_dates['startDate'], 'Monthly year boundary startDate should be Dec 1 of previous year.' );
			$this->assertSame( '2025-12-31', $reference_dates['endDate'], 'Monthly year boundary endDate should be Dec 31 of previous year.' );
			$this->assertSame( '2025-11-01', $reference_dates['compareStartDate'], 'Monthly year boundary compareStartDate should be Nov 1 of previous year.' );
			$this->assertSame( '2025-11-30', $reference_dates['compareEndDate'], 'Monthly year boundary compareEndDate should be Nov 30 of previous year.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	public function test_build_reference_dates_quarterly_year_boundary() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );

		try {
			// Trigger in Q1 2026 - should report Q4 2025, compare Q3 2025.
			$timestamp       = strtotime( '2026-02-15 00:00:00 UTC' );
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_QUARTERLY,
				$timestamp
			);

			$this->assertSame( '2025-10-01', $reference_dates['startDate'], 'Quarterly year boundary startDate should be Oct 1 of previous year.' );
			$this->assertSame( '2025-12-31', $reference_dates['endDate'], 'Quarterly year boundary endDate should be Dec 31 of previous year.' );
			$this->assertSame( '2025-07-01', $reference_dates['compareStartDate'], 'Quarterly year boundary compareStartDate should be Jul 1 of previous year.' );
			$this->assertSame( '2025-09-30', $reference_dates['compareEndDate'], 'Quarterly year boundary compareEndDate should be Sep 30 of previous year.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	public function test_build_reference_dates_idempotent_within_same_period() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'UTC' );
		update_option( 'gmt_offset', 0 );

		try {
			$early = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_MONTHLY,
				strtotime( '2026-03-05 00:00:00 UTC' )
			);
			$late  = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_MONTHLY,
				strtotime( '2026-03-20 00:00:00 UTC' )
			);

			$this->assertSame( $early, $late, 'Different trigger times within the same month should produce identical reference dates.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	public function test_build_reference_dates_dst_smoke_test() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'America/New_York' );
		delete_option( 'gmt_offset' );

		try {
			// March 8, 2026 is US spring-forward day in New York.
			$timestamp       = strtotime( '2026-03-08 05:00:00 UTC' ); // Midnight EDT.
			$reference_dates = Initiator_Task::build_reference_dates(
				Email_Reporting_Settings::FREQUENCY_MONTHLY,
				$timestamp
			);

			$this->assertSame( '2026-02-01', $reference_dates['startDate'], 'DST transition should not affect monthly date resolution.' );
			$this->assertSame( '2026-02-28', $reference_dates['endDate'], 'DST transition should not affect monthly date resolution.' );
		} finally {
			update_option( 'timezone_string', $original_timezone_string );

			if ( false === $original_gmt_offset ) {
				delete_option( 'gmt_offset' );
			} else {
				update_option( 'gmt_offset', $original_gmt_offset );
			}
		}
	}
}
