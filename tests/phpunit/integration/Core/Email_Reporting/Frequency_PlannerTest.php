<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Frequency_PlannerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Core\Email_Reporting\Frequency_Planner;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Frequency_PlannerTest extends TestCase {

	private $original_start_of_week;
	private $original_timezone_string;

	/**
	 * @var Frequency_Planner
	 */
	private $planner;

	public function set_up() {
		parent::set_up();

		$this->planner                  = new Frequency_Planner();
		$this->original_start_of_week   = get_option( 'start_of_week' );
		$this->original_timezone_string = get_option( 'timezone_string' );
	}

	public function tear_down() {
		if ( null === $this->original_start_of_week ) {
			delete_option( 'start_of_week' );
		} else {
			update_option( 'start_of_week', $this->original_start_of_week );
		}

		if ( empty( $this->original_timezone_string ) ) {
			delete_option( 'timezone_string' );
		} else {
			update_option( 'timezone_string', $this->original_timezone_string );
		}

		parent::tear_down();
	}

	/**
	 * @dataProvider weekly_provider
	 */
	public function test_next_occurrence_weekly( $start_of_week, $current_date, $expected_date, $description ) {
		update_option( 'start_of_week', $start_of_week );
		update_option( 'timezone_string', 'America/New_York' );

		$timezone = BC_Functions::wp_timezone();
		$current  = new DateTimeImmutable( $current_date, $timezone );

		$next_timestamp = $this->planner->next_occurrence(
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$current->getTimestamp(),
			$timezone
		);

		$this->assertSame(
			( new DateTimeImmutable( $expected_date, $timezone ) )->getTimestamp(),
			$next_timestamp,
			$description
		);
	}

	public function weekly_provider() {
		return array(
			'sunday start, mid-week'                 => array( 0, '2024-05-15 15:00:00', '2024-05-19 09:00:00', 'Should reach upcoming Sunday at the trigger hour.' ),
			'monday start, morning of same day'      => array( 1, '2024-05-13 09:30:00', '2024-05-20 09:00:00', 'Once the day has started, schedule for the following week.' ),
			'monday start, afternoon of same day'    => array( 1, '2024-05-13 12:00:00', '2024-05-20 09:00:00', 'Past the target weekday should roll to next week.' ),
			'wednesday start from sunday'            => array( 3, '2024-05-12 18:00:00', '2024-05-15 09:00:00', 'Start on Wednesday from Sunday evening.' ),
			'saturday start from saturday afternoon' => array( 6, '2024-05-11 16:45:00', '2024-05-18 09:00:00', 'Hit Saturday afternoon and schedule for following Saturday.' ),
		);
	}

	/**
	 * @dataProvider monthly_provider
	 */
	public function test_next_occurrence_monthly( $baseline, $timezone_string, $expected, $message ) {
		update_option( 'timezone_string', $timezone_string );
		$timezone = BC_Functions::wp_timezone();

		$timestamp          = ( new DateTimeImmutable( $baseline, $timezone ) )->getTimestamp();
		$next               = $this->planner->next_occurrence( Email_Reporting_Settings::FREQUENCY_MONTHLY, $timestamp, $timezone );
		$expected_timestamp = ( new DateTimeImmutable( $expected, $timezone ) )->getTimestamp();

		$this->assertSame( $expected_timestamp, $next, $message );
	}

	public function monthly_provider() {
		return array(
			'middle of month to first of next' => array( '2024-05-15 12:00:00', 'UTC', '2024-06-01 09:00:00', 'Should advance to first day of next month.' ),
			'last day before midnight'         => array( '2024-05-31 23:59:59', 'UTC', '2024-06-01 09:00:00', 'Edge near month boundary still jumps to next month.' ),
			'handles year wrap'                => array( '2024-12-20 10:00:00', 'UTC', '2025-01-01 09:00:00', 'December should roll into next calendar year.' ),
			'timezone shift preserved'         => array( '2024-07-10 18:00:00', 'America/Los_Angeles', '2024-08-01 09:00:00', 'Local timezone should be respected.' ),
		);
	}

	/**
	 * @dataProvider quarterly_provider
	 */
	public function test_next_occurrence_quarterly( $baseline, $expected, $message ) {
		update_option( 'timezone_string', 'UTC' );
		$timezone = new DateTimeZone( 'UTC' );

		$timestamp          = ( new DateTimeImmutable( $baseline, $timezone ) )->getTimestamp();
		$next               = $this->planner->next_occurrence( Email_Reporting_Settings::FREQUENCY_QUARTERLY, $timestamp, $timezone );
		$expected_timestamp = ( new DateTimeImmutable( $expected, $timezone ) )->getTimestamp();

		$this->assertSame( $expected_timestamp, $next, $message );
	}

	public function quarterly_provider() {
		return array(
			'middle of q4 rolls to jan 1'            => array( '2024-11-15 12:00:00', '2025-01-01 09:00:00', 'Should advance to first day of the next quarter.' ),
			'first month of quarter jumped properly' => array( '2024-04-10 08:00:00', '2024-07-01 09:00:00', 'Second quarter should move to start of third.' ),
			'last day of quarter next midnight'      => array( '2024-09-30 18:30:00', '2024-10-01 09:00:00', 'End of quarter should yield next quarter start.' ),
			'first day of quarter midday'            => array( '2024-07-01 12:00:00', '2024-10-01 09:00:00', 'Being on day one later in the day jumps three months ahead.' ),
			'late december moves to january'         => array( '2024-12-31 23:59:59', '2025-01-01 09:00:00', 'Quarterly transition across year boundary.' ),
		);
	}

	public function test_next_occurrence_respects_site_timezone_trigger_hour() {
		$base_timestamp = ( new DateTimeImmutable( '2024-03-01 00:30:00', new DateTimeZone( 'UTC' ) ) )->getTimestamp();
		$utc_timezone   = new DateTimeZone( 'UTC' );
		$la_timezone    = new DateTimeZone( 'America/Los_Angeles' );

		$utc_next = $this->planner->next_occurrence(
			Email_Reporting_Settings::FREQUENCY_MONTHLY,
			$base_timestamp,
			$utc_timezone
		);
		$la_next  = $this->planner->next_occurrence(
			Email_Reporting_Settings::FREQUENCY_MONTHLY,
			$base_timestamp,
			$la_timezone
		);

		$this->assertNotSame( $utc_next, $la_next, 'Monthly next occurrence should differ by timezone for the same UTC timestamp.' );

		$utc_next_date = ( new DateTimeImmutable( '@' . $utc_next ) )->setTimezone( $utc_timezone );
		$la_next_date  = ( new DateTimeImmutable( '@' . $la_next ) )->setTimezone( $la_timezone );

		$this->assertSame( '09:00:00', $utc_next_date->format( 'H:i:s' ), 'UTC next occurrence should resolve to the trigger hour.' );
		$this->assertSame( '09:00:00', $la_next_date->format( 'H:i:s' ), 'Los Angeles next occurrence should resolve to the trigger hour.' );
		$this->assertSame( '2024-04-01', $utc_next_date->format( 'Y-m-d' ), 'UTC next monthly occurrence should be April 1st.' );
		$this->assertSame( '2024-03-01', $la_next_date->format( 'Y-m-d' ), 'Los Angeles next monthly occurrence should be March 1st.' );
	}

	public function test_trigger_hour_constant_is_applied_consistently() {
		$timezone  = new DateTimeZone( 'UTC' );
		$timestamp = ( new DateTimeImmutable( '2024-01-01 00:00:00', $timezone ) )->getTimestamp();

		$weekly    = $this->planner->next_occurrence( Email_Reporting_Settings::FREQUENCY_WEEKLY, $timestamp, $timezone );
		$monthly   = $this->planner->next_occurrence( Email_Reporting_Settings::FREQUENCY_MONTHLY, $timestamp, $timezone );
		$quarterly = $this->planner->next_occurrence( Email_Reporting_Settings::FREQUENCY_QUARTERLY, $timestamp, $timezone );

		$weekly_date    = ( new DateTimeImmutable( '@' . $weekly ) )->setTimezone( $timezone );
		$monthly_date   = ( new DateTimeImmutable( '@' . $monthly ) )->setTimezone( $timezone );
		$quarterly_date = ( new DateTimeImmutable( '@' . $quarterly ) )->setTimezone( $timezone );

		$expected_hour = sprintf( '%02d:00:00', Frequency_Planner::TRIGGER_HOUR );

		$this->assertSame( $expected_hour, $weekly_date->format( 'H:i:s' ), 'Weekly occurrence should use the trigger hour.' );
		$this->assertSame( $expected_hour, $monthly_date->format( 'H:i:s' ), 'Monthly occurrence should use the trigger hour.' );
		$this->assertSame( $expected_hour, $quarterly_date->format( 'H:i:s' ), 'Quarterly occurrence should use the trigger hour.' );
	}
}
