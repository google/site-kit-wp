<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Site_HealthTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Site_Health;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group EmailReporting
 */
class Email_Reporting_Site_HealthTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * User options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Email log instance.
	 *
	 * @var Email_Log
	 */
	private $email_log;

	/**
	 * Email reporting settings instance.
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options      = new Options( $this->context );
		$this->user_options = new User_Options( $this->context );
		$this->settings     = new Email_Reporting_Settings( $this->options );
		$this->settings->register();

		$this->email_log = new Email_Log( $this->context );

		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $this->email_log );

		$this->delete_email_logs();
	}

	public function tear_down() {
		$this->delete_email_logs();

		if ( post_type_exists( Email_Log::POST_TYPE ) ) {
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
			) as $meta_key
		) {
			if ( function_exists( 'unregister_meta_key' ) ) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}

		if ( $this->settings ) {
			$this->settings->delete();
		}

		parent::tear_down();
	}

	public function test_get_debug_fields__counts_subscribers() {
		$subscribed_user = $this->factory()->user->create( array( 'role' => 'author' ) );
		$unsubscribed    = $this->factory()->user->create( array( 'role' => 'author' ) );

		$subscribed_options   = new User_Options( $this->context, $subscribed_user );
		$unsubscribed_options = new User_Options( $this->context, $unsubscribed );

		$subscribed_options->set(
			User_Email_Reporting_Settings::OPTION,
			array(
				'subscribed' => true,
				'frequency'  => 'weekly',
			)
		);

		$unsubscribed_options->set(
			User_Email_Reporting_Settings::OPTION,
			array(
				'subscribed' => false,
				'frequency'  => 'weekly',
			)
		);

		$email_reporting_site_health = $this->instantiate_site_health();

		$fields = $email_reporting_site_health->get_debug_fields();

		$this->assertSame(
			1,
			$fields['email_reports_subscribers']['value'],
			'Email Reports subscribers count should match the number of subscribed users.'
		);
	}

	public function test_get_debug_fields__reports_all_sent_deliverability() {
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-1',
				'status'        => Email_Log::STATUS_SENT,
				'post_date_gmt' => '2024-05-10 09:00:00',
			)
		);

		$timestamp = strtotime( '2024-05-15 10:00:00' );
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-2',
				'status'        => Email_Log::STATUS_SENT,
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $timestamp ),
			)
		);
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-2',
				'status'        => Email_Log::STATUS_SENT,
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $timestamp + HOUR_IN_SECONDS ),
			)
		);

		$email_reporting_site_health = $this->instantiate_site_health();

		$fields = $email_reporting_site_health->get_debug_fields();

		$this->assertSame(
			__( '✅ all emails in last run sent', 'google-site-kit' ),
			$fields['email_reports_deliverability']['value'],
			'Email Reports deliverability should report all emails sent when the latest batch succeeds.'
		);
		$this->assertSame(
			gmdate( 'c', $timestamp + HOUR_IN_SECONDS ),
			$fields['email_reports_last_sent']['value'],
			'Email Reports last sent should match the most recent sent email timestamp in ISO 8601 format.'
		);
	}

	public function test_get_debug_fields__reports_partial_failure_deliverability() {
		$timestamp = strtotime( '2024-06-01 09:00:00' );
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-partial',
				'status'        => Email_Log::STATUS_SENT,
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $timestamp ),
			)
		);
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-partial',
				'status'        => Email_Log::STATUS_FAILED,
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $timestamp + MINUTE_IN_SECONDS ),
			)
		);

		$email_reporting_site_health = $this->instantiate_site_health();

		$fields = $email_reporting_site_health->get_debug_fields();

		$this->assertSame(
			__( '⚠️ some failed in last run', 'google-site-kit' ),
			$fields['email_reports_deliverability']['value'],
			'Email Reports deliverability should flag partial failures when the latest batch has mixed results.'
		);
		$this->assertSame(
			gmdate( 'c', $timestamp ),
			$fields['email_reports_last_sent']['value'],
			'Email Reports last sent should use the latest successful send in the most recent batch.'
		);
	}

	public function test_get_debug_fields__reports_all_failed_deliverability() {
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-failed',
				'status'        => Email_Log::STATUS_FAILED,
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', strtotime( '2024-07-01 08:00:00' ) ),
			)
		);
		$this->create_email_log_post(
			array(
				'batch_id'      => 'batch-failed',
				'status'        => Email_Log::STATUS_FAILED,
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', strtotime( '2024-07-01 08:05:00' ) ),
			)
		);

		$email_reporting_site_health = $this->instantiate_site_health();

		$fields = $email_reporting_site_health->get_debug_fields();

		$this->assertSame(
			__( '❌ all failed in last run', 'google-site-kit' ),
			$fields['email_reports_deliverability']['value'],
			'Email Reports deliverability should report failures when every email in the latest batch failed.'
		);
		$this->assertSame(
			__( 'Never', 'google-site-kit' ),
			$fields['email_reports_last_sent']['value'],
			'Email Reports last sent should be "Never" when no emails were successfully sent in the latest batch.'
		);
	}

	public function test_get_debug_fields__returns_not_available_when_disabled() {
		$this->settings->set(
			array(
				'enabled' => false,
			)
		);

		// Seed data that would otherwise be surfaced when enabled.
		$this->create_email_log_post(
			array(
				'batch_id'      => 'disabled-batch',
				'status'        => Email_Log::STATUS_SENT,
				'post_date_gmt' => '2024-08-01 12:00:00',
			)
		);

		$email_reporting_site_health = $this->instantiate_site_health();
		$fields                      = $email_reporting_site_health->get_debug_fields();

		$this->assertSame(
			__( 'Disabled', 'google-site-kit' ),
			$fields['email_reports_status']['value'],
			'Email Reports status should indicate "Disabled" when the feature is turned off.'
		);
		$this->assertSame(
			__( 'Not available', 'google-site-kit' ),
			$fields['email_reports_subscribers']['value'],
			'Email Reports subscribers should remain "Not available" while the feature is disabled.'
		);
		$this->assertSame(
			__( 'Not available', 'google-site-kit' ),
			$fields['email_reports_deliverability']['value'],
			'Email Reports deliverability should remain "Not available" while the feature is disabled.'
		);
		$this->assertSame(
			__( 'Not available', 'google-site-kit' ),
			$fields['email_reports_last_sent']['value'],
			'Email Reports last sent should remain "Not available" while the feature is disabled.'
		);
	}

	/**
	 * Creates an email log post with the provided data.
	 *
	 * @param array $args Arguments for the post.
	 * @return int Post ID.
	 */
	private function create_email_log_post( array $args ) {
		$defaults = array(
			'batch_id'      => 'test-batch',
			'status'        => Email_Log::STATUS_SENT,
			'post_date_gmt' => gmdate( 'Y-m-d H:i:s' ),
		);

		$args = array_merge( $defaults, $args );

		$post_id = wp_insert_post(
			array(
				'post_type'      => Email_Log::POST_TYPE,
				'post_status'    => $args['status'],
				'post_title'     => 'Email Log',
				'post_date_gmt'  => $args['post_date_gmt'],
				'post_date'      => get_date_from_gmt( $args['post_date_gmt'] ),
				'post_author'    => 0,
				'post_content'   => '',
				'post_excerpt'   => '',
				'comment_status' => 'closed',
				'ping_status'    => 'closed',
			),
			true
		);

		$this->assertIsInt( $post_id, 'Failed to create email log post.' );

		global $wpdb;

		$post_date     = get_date_from_gmt( $args['post_date_gmt'] );
		$post_date_gmt = $args['post_date_gmt'];

		$wpdb->update(
			$wpdb->posts,
			array(
				'post_status'       => $args['status'],
				'post_date'         => $post_date,
				'post_date_gmt'     => $post_date_gmt,
				'post_modified'     => $post_date,
				'post_modified_gmt' => $post_date_gmt,
			),
			array( 'ID' => $post_id )
		);

		clean_post_cache( $post_id );

		update_post_meta( $post_id, Email_Log::META_BATCH_ID, $args['batch_id'] );

		return $post_id;
	}

	/**
	 * Helper to instantiate the Site Health handler with shared settings.
	 *
	 * @param User_Options|null $user_options Optional custom user options instance.
	 * @return Email_Reporting_Site_Health
	 */
	private function instantiate_site_health( $user_options = null ) {
		return new Email_Reporting_Site_Health(
			$this->settings,
			$user_options ?: $this->user_options
		);
	}

	/**
	 * Permanently deletes all email log posts to isolate test cases.
	 */
	private function delete_email_logs() {
		$post_ids = get_posts(
			array(
				'post_type'     => Email_Log::POST_TYPE,
				'post_status'   => array(
					Email_Log::STATUS_SENT,
					Email_Log::STATUS_FAILED,
					Email_Log::STATUS_SCHEDULED,
				),
				'numberposts'   => -1,
				'fields'        => 'ids',
				'no_found_rows' => true,
			)
		);

		foreach ( $post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
	}
}
