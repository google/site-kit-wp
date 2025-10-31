<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_LogTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Email_Reporting
 */
class Email_LogTest extends TestCase {

	/**
	 * Email log instance.
	 *
	 * @var Email_Log
	 */
	private $email_log;

	public function set_up() {
		parent::set_up();

		$this->email_log = new Email_Log( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $this->email_log );
	}

	public function tear_down() {
		if ( post_type_exists( Email_Log::POST_TYPE ) && function_exists( 'unregister_post_type' ) ) {
			unregister_post_type( Email_Log::POST_TYPE );
		}

		foreach ( array( 'googlesitekit_email_sent', 'googlesitekit_email_failed', 'googlesitekit_email_scheduled' ) as $status ) {
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

	public function test_registers_email_log_post_type() {
		$this->assertTrue( post_type_exists( Email_Log::POST_TYPE ), 'Email log post type should be registered.' );

		$post_type = get_post_type_object( Email_Log::POST_TYPE );
		$this->assertNotNull( $post_type, 'Post type object should be available.' );

		$this->assertFalse( $post_type->public, 'Post type should not be public.' );
		$this->assertFalse( $post_type->show_ui, 'Post type should not show UI.' );
		$this->assertFalse( $post_type->show_in_rest, 'Post type should not show in REST.' );
		$this->assertFalse( $post_type->has_archive, 'Post type should not have archive.' );
		$this->assertFalse( $post_type->rewrite, 'Post type should not register rewrite rules.' );
		$this->assertFalse( $post_type->publicly_queryable, 'Post type should not be publicly queryable.' );
		$this->assertTrue( $post_type->exclude_from_search, 'Post type should be excluded from search.' );
		$this->assertFalse( $post_type->query_var, 'Post type should not provide a query var.' );
		$this->assertFalse( $post_type->show_in_nav_menus, 'Post type should not show in nav menus.' );
		$this->assertFalse( $post_type->show_in_menu, 'Post type should not show in admin menus.' );
		$this->assertTrue( $post_type->map_meta_cap, 'Post type should map meta caps.' );
		$this->assertSame( 'post', $post_type->capability_type, 'Post type should use post capabilities.' );
	}

	public function test_post_author_is_persisted() {
		$user_id = self::factory()->user->create();
		$post_id = wp_insert_post(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => 'googlesitekit_email_scheduled',
				'post_title'  => 'Internal Log',
				'post_author' => $user_id,
			)
		);

		$this->assertIsInt( $post_id, 'Email log post should insert successfully.' );
		$this->assertGreaterThan( 0, $post_id, 'Email log post ID should be positive.' );

		$post = get_post( $post_id );
		$this->assertInstanceOf( 'WP_Post', $post, 'Inserted email log post should be retrievable.' );
		$this->assertSame( $user_id, (int) $post->post_author, 'Email log post author should persist when saved programmatically.' );

		wp_delete_post( $post_id, true );
	}

	public function test_registers_delivery_statuses() {
		foreach (
			array(
				'googlesitekit_email_sent',
				'googlesitekit_email_failed',
				'googlesitekit_email_scheduled',
			) as $status
		) {
			$status_object = get_post_status_object( $status );
			$this->assertNotNull( $status_object, sprintf( 'Status %s should be registered.', $status ) );

			$this->assertFalse( $status_object->public, 'Status should not be public.' );
			$this->assertTrue( $status_object->internal, 'Status should be internal.' );
			$this->assertTrue( $status_object->exclude_from_search, 'Status should be excluded from search.' );
			$this->assertFalse( $status_object->show_in_admin_all_list, 'Status should not show in admin all list.' );
			$this->assertFalse( $status_object->show_in_admin_status_list, 'Status should not show in status list.' );
			$this->assertIsArray( $status_object->label_count, 'Status label count should be registered.' );
		}
	}

	public function test_registers_meta_keys() {
		$meta = get_registered_meta_keys( 'post', Email_Log::POST_TYPE );

		$expected_keys = array(
			Email_Log::META_REPORT_FREQUENCY,
			Email_Log::META_BATCH_ID,
			Email_Log::META_SEND_ATTEMPTS,
			Email_Log::META_ERROR_DETAILS,
			Email_Log::META_REPORT_REFERENCE_DATES,
		);

		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $meta, sprintf( 'Meta key %s should be registered.', $key ) );
			$this->assertFalse( $meta[ $key ]['show_in_rest'], sprintf( 'Meta key %s should not show in REST.', $key ) );
			$this->assertTrue( $meta[ $key ]['single'], sprintf( 'Meta key %s should be single.', $key ) );
			$this->assertIsCallable( $meta[ $key ]['sanitize_callback'], sprintf( 'Meta key %s should have a sanitize callback.', $key ) );
		}
	}

	public function test_meta_sanitization_behaviour() {
		$meta = get_registered_meta_keys( 'post', Email_Log::POST_TYPE );

		$frequency_callback = $meta[ Email_Log::META_REPORT_FREQUENCY ]['sanitize_callback'];
		$this->assertSame( Email_Reporting_Settings::FREQUENCY_WEEKLY, call_user_func( $frequency_callback, 'Weekly' ), 'Sanitize frequency should accept weekly values.' );
		$this->assertSame( '', call_user_func( $frequency_callback, 'yearly' ), 'Sanitize frequency should reject unsupported values.' );

		$attempts_callback = $meta[ Email_Log::META_SEND_ATTEMPTS ]['sanitize_callback'];
		$this->assertSame( 0, call_user_func( $attempts_callback, -1 ), 'Sanitize attempts should clamp negative numbers to zero.' );
		$this->assertSame( 5, call_user_func( $attempts_callback, '5' ), 'Sanitize attempts should cast numeric strings.' );

		$batch_id_callback = $meta[ Email_Log::META_BATCH_ID ]['sanitize_callback'];
		$long_batch_id     = str_repeat( 'a', 300 );
		$sanitized_batch   = call_user_func( $batch_id_callback, $long_batch_id );
		$this->assertLessThanOrEqual( 191, strlen( $sanitized_batch ), 'Sanitize batch ID should enforce length limits.' );

		$error_callback = $meta[ Email_Log::META_ERROR_DETAILS ]['sanitize_callback'];

		$wp_error        = new WP_Error( 'test', 'Test Message', array( 'meta' => 'data' ) );
		$sanitized_error = call_user_func( $error_callback, $wp_error );
		$decoded_error   = json_decode( $sanitized_error, true );
		$this->assertIsArray( $decoded_error, 'Sanitize error details should encode WP_Error to JSON array.' );
		$this->assertArrayHasKey( 'errors', $decoded_error, 'Sanitized WP_Error JSON should include errors.' );
		$this->assertArrayHasKey( 'error_data', $decoded_error, 'Sanitized WP_Error JSON should include error data.' );

		$json_string = wp_json_encode( array( 'foo' => 'bar' ) );
		$this->assertSame( $json_string, call_user_func( $error_callback, $json_string ), 'Sanitize error details should preserve valid JSON strings.' );

		$wrapped_string = call_user_func( $error_callback, 'not json' );
		$this->assertIsArray( json_decode( $wrapped_string, true ), 'Sanitize error details should wrap non-JSON strings.' );

		$reference_callback = $meta[ Email_Log::META_REPORT_REFERENCE_DATES ]['sanitize_callback'];
		$reference_value    = call_user_func(
			$reference_callback,
			array(
				'startDate'        => '1700000000',
				'sendDate'         => 1800000000,
				'compareStartDate' => 'not-a-number',
			)
		);

		$decoded_reference = json_decode( $reference_value, true );
		$this->assertSame(
			array(
				'startDate'        => 1700000000,
				'sendDate'         => 1800000000,
				'compareStartDate' => 0,
				'compareEndDate'   => 0,
			),
			$decoded_reference,
			'Sanitize reference dates should coerce known keys to integers.'
		);

		$this->assertSame( '', call_user_func( $reference_callback, 'invalid' ), 'Sanitize reference dates should reject invalid types.' );
	}
}
