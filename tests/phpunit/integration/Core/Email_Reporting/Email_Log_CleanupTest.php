<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Log_CleanupTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Cleanup;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

class Email_Log_CleanupTest extends TestCase {

	/**
	 * Cleanup handler instance.
	 *
	 * @var Email_Log_Cleanup
	 */
	private $cleanup;

	/**
	 * Settings instance.
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Inserted post IDs for cleanup.
	 *
	 * @var array
	 */
	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$this->settings = new Email_Reporting_Settings( $options );
		$this->cleanup  = new Email_Log_Cleanup( $this->settings );

		$email_log = new Email_Log( $context );
		$register  = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register->setAccessible( true );
		$register->invoke( $email_log );
	}

	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			if ( get_post( $post_id ) ) {
				wp_delete_post( $post_id, true );
			}
		}

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
			) as $meta_key
		) {
			if ( function_exists( 'unregister_meta_key' ) ) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}

		$this->created_post_ids = array();

		parent::tear_down();
	}

	public function test_handle_cleanup_action_skips_when_disabled() {
		$this->settings->set( array( 'enabled' => false ) );

		$old_post_id = $this->create_email_log_post( time() - ( 7 * MONTH_IN_SECONDS ) );

		$this->cleanup->handle_cleanup_action();

		$this->assertNotNull( get_post( $old_post_id ), 'Cleanup should skip when feature disabled.' );
	}

	public function test_handle_cleanup_action_deletes_only_old_posts() {
		$this->settings->set( array( 'enabled' => true ) );

		$threshold        = time();
		$old_timestamp    = strtotime( '-7 months', $threshold );
		$recent_timestamp = strtotime( '-1 month', $threshold );

		$old_post_id    = $this->create_email_log_post( $old_timestamp );
		$recent_post_id = $this->create_email_log_post( $recent_timestamp );

		$this->cleanup->handle_cleanup_action();

		$this->assertNull( get_post( $old_post_id ), 'Posts older than six months should be removed.' );
		$this->assertNotNull( get_post( $recent_post_id ), 'Recent posts should remain after cleanup.' );
	}

	private function create_email_log_post( $timestamp ) {
		$post_id = wp_insert_post(
			array(
				'post_type'     => Email_Log::POST_TYPE,
				'post_status'   => Email_Log::STATUS_SENT,
				'post_title'    => 'Email Log ' . $timestamp,
				'post_date'     => gmdate( 'Y-m-d H:i:s', $timestamp ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', $timestamp ),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			$this->fail( 'Failed to create email log post: ' . $post_id->get_error_message() );
		}

		$this->assertIsInt( $post_id, 'Expected email log post to be created.' );

		$this->created_post_ids[] = $post_id;

		return $post_id;
	}
}
