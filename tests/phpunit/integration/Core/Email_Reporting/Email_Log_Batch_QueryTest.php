<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Log_Batch_QueryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Email_Log_Batch_QueryTest extends TestCase {

	/**
	 * @var Email_Log_Batch_Query
	 */
	private $query;

	/**
	 * @var array
	 */
	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$this->query            = new Email_Log_Batch_Query();
		$this->created_post_ids = array();

		$this->register_email_log_dependencies();
	}

	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
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

		parent::tear_down();
	}

	public function test_get_pending_ids_excludes_completed_posts() {
		$batch_id = 'batch-pending';

		$scheduled_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );
		$retry_failed  = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, 1 );
		$max_failed    = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, Email_Log_Batch_Query::MAX_ATTEMPTS );
		$sent_id       = $this->create_log_post( $batch_id, Email_Log::STATUS_SENT, 1 );
		$other_batch   = $this->create_log_post( 'other-batch', Email_Log::STATUS_SCHEDULED, 0 );
		$_unused_posts = array( $max_failed, $sent_id, $other_batch );

		$pending_ids = $this->query->get_pending_ids( $batch_id );

		$this->assertEqualSets( array( $scheduled_id, $retry_failed ), $pending_ids, 'Only scheduled or retriable failed logs should be returned.' );
	}

	public function test_is_complete_reflects_pending_state() {
		$batch_id = 'batch-complete';
		$this->assertTrue( $this->query->is_complete( $batch_id ), 'Empty batches should be complete.' );

		$pending_id = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );
		$this->assertFalse( $this->query->is_complete( $batch_id ), 'Batches with scheduled logs should not be complete.' );

		$this->query->update_status( $pending_id, Email_Log::STATUS_SENT );
		$this->assertTrue( $this->query->is_complete( $batch_id ), 'After marking logs as sent, batch should be complete.' );
	}

	public function test_increment_attempt_and_update_status() {
		$batch_id = 'batch-mutate';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, 1 );

		$this->query->increment_attempt( $post_id );
		$this->assertSame( 2, (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Increment attempt should increase send attempts meta.' );

		$this->query->increment_attempt( $post_id );
		$this->assertSame( 3, (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Increment attempt can be called multiple times.' );

		$this->query->update_status( $post_id, Email_Log::STATUS_SENT );
		$this->assertSame( Email_Log::STATUS_SENT, get_post_status( $post_id ), 'Update status should persist new post status.' );
	}

	private function create_log_post( $batch_id, $status, $attempts ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => $status,
				'post_title'  => 'Log ' . uniqid(),
				'meta_input'  => array(
					Email_Log::META_BATCH_ID         => $batch_id,
					Email_Log::META_REPORT_FREQUENCY => Email_Reporting_Settings::FREQUENCY_WEEKLY,
					Email_Log::META_SEND_ATTEMPTS    => $attempts,
				),
			)
		);

		$this->created_post_ids[] = $post_id;

		return $post_id;
	}

	private function register_email_log_dependencies() {
		$email_log       = new Email_Log( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $email_log );
	}
}
