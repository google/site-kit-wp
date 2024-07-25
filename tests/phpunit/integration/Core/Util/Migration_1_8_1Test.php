<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_1_8_1Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Migration_1_8_1;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_8_1Test extends TestCase {
	use Fake_Site_Connection_Trait;

	const FILE_VERIFICATION = Verification_File::OPTION;
	const META_VERIFICATION = Verification_Meta::OPTION;

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * @var Migration_1_8_1
	 */
	protected $migration;

	private $temp_api_request_issued;
	private $temp_received_identifiers;

	public function set_up() {
		parent::set_up();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$this->migration      = new Migration_1_8_1( $this->context, $this->options, $this->user_options, $this->authentication );

		$this->temp_api_request_issued   = false;
		$this->temp_received_identifiers = null;
	}

	public function test_register() {
		remove_all_actions( 'admin_init' );
		$this->migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
	}

	public function test_migrate_without_using_proxy() {
		$this->fake_site_connection();
		$this->stub_mark_notifications_response();

		$this->migration->migrate();
		$this->assertNotIssuedAPIRequest();
		$this->assertNotEquals( Migration_1_8_1::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_without_credentials() {
		$this->stub_mark_notifications_response();

		$this->migration->migrate();
		$this->assertNotIssuedAPIRequest();
		$this->assertNotEquals( Migration_1_8_1::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_without_users() {
		$this->fake_proxy_site_connection();
		$this->stub_mark_notifications_response();

		$this->migration->migrate();
		$this->assertNotIssuedAPIRequest();
		$this->assertEquals( Migration_1_8_1::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_without_problem_cases() {
		$valid_authenticated_user = $this->create_user( 'administrator', self::FILE_VERIFICATION );
		$this->create_user( 'subscriber', false );

		$this->fake_proxy_site_connection();
		$this->stub_mark_notifications_response();

		$this->migration->migrate();
		$this->assertNotIssuedAPIRequest();
		$this->assertHasSiteKitUserOptions( $valid_authenticated_user->ID );
		$this->assertEquals( Migration_1_8_1::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_with_problem_cases() {
		$valid_authenticated_user = $this->create_user( 'administrator', self::META_VERIFICATION );
		$this->create_user( 'subscriber', false );
		$this->create_user( 'subscriber', false );
		$this->create_user( 'administrator', false );

		$problem_cases = array(
			$this->create_user( 'subscriber', self::META_VERIFICATION ),
			$this->create_user( 'editor', self::FILE_VERIFICATION ),
		);

		// Set Google profile data for one of the problematic users (see below).
		$profile = new Profile( new User_Options( $this->context, $problem_cases[0]->ID ) );
		$profile->set(
			array(
				'email' => 'wapuu.wordpress@gmail.com',
				'photo' => 'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
			)
		);

		// Ensure the functionality uses Google profile email preferably, but
		// falls back to WordPress user email if Google profile data not
		// present.
		$expected_identifiers = array(
			'wapuu.wordpress@gmail.com',
			$problem_cases[1]->user_email,
		);

		$this->fake_proxy_site_connection();
		$this->stub_mark_notifications_response();

		$this->migration->migrate();
		$this->assertIssuedAPIRequest();
		$this->assertSentAPIRequestIdentifiers( $expected_identifiers );
		$this->assertHasSiteKitUserOptions( $valid_authenticated_user->ID );
		foreach ( $problem_cases as $user ) {
			$this->assertNotHasSiteKitUserOptions( $user->ID );
		}
		$this->assertEquals( Migration_1_8_1::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate_with_problem_cases_and_api_error() {
		$problem_cases = array(
			$this->create_user( 'subscriber', self::META_VERIFICATION ),
			$this->create_user( 'editor', self::FILE_VERIFICATION ),
		);

		$this->fake_proxy_site_connection();
		$this->stub_mark_notifications_response( 'invalid_notification_id' );

		$this->migration->migrate();
		$this->assertIssuedAPIRequest();
		// Despite API error, users have been determined and cleared correctly.
		$this->assertSentAPIRequestIdentifiers(
			array_map(
				function ( $user ) {
					return $user->user_email;
				},
				$problem_cases
			)
		);
		foreach ( $problem_cases as $user ) {
			$this->assertNotHasSiteKitUserOptions( $user->ID );
		}
		$this->assertEquals( Migration_1_8_1::DB_VERSION, $this->get_db_version() );
	}

	private function create_user( $role, $verification_type = false ) {
		$user = $this->factory()->user->create_and_get( array( 'role' => $role ) );

		// Store original User_Options instance user to restore below.
		$backup_user_id = $this->user_options->get_user_id();
		$this->user_options->switch_user( (int) $user->ID );

		// If user should be verified, set the respective token.
		if ( ! empty( $verification_type ) ) {
			$this->user_options->set( $verification_type, 'a1b2c3d4' );
			// Also set access token to simulate user being fully authenticated.
			$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-access-token' );
		}

		// Restore original user.
		$this->user_options->switch_user( $backup_user_id );

		return $user;
	}

	private function stub_mark_notifications_response( $error_code = false ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $error_code ) {
				$google_proxy = new Google_Proxy( $this->context );
				if ( $google_proxy->url( '/notifications/mark/' ) !== $url ) {
					return $preempt;
				}

				$this->temp_api_request_issued   = true;
				$this->temp_received_identifiers = isset( $args['body']['identifiers'] ) ? $args['body']['identifiers'] : null;

				$response_code = 200;
				$response_body = array( 'success' => true );
				if ( $error_code ) {
					$response_code = 400;
					$response_body = array( 'error' => $error_code );
				}

				return array(
					'headers'       => array(),
					'body'          => json_encode(
						$response_body
					),
					'response'      => array(
						'code'    => $response_code,
						'message' => get_status_header_desc( $response_code ),
					),
					'cookies'       => array(),
					'http_response' => null,
				);
			},
			10,
			3
		);
	}

	private function assertIssuedAPIRequest() {
		$this->assertTrue( $this->temp_api_request_issued, 'Failed asserting that API request was issued.' );
	}

	private function assertNotIssuedAPIRequest() {
		$this->assertFalse( $this->temp_api_request_issued, 'Failed asserting that API request was issued.' );
	}

	private function assertSentAPIRequestIdentifiers( $expected ) {
		$this->assertNotNull( $this->temp_received_identifiers, 'No user identifiers received.' );

		if ( ! empty( $this->temp_received_identifiers ) ) {
			$actual = explode( ',', $this->temp_received_identifiers );
		} else {
			$actual = array();
		}

		// Do not use assertEqualSets here only because the message parameter
		// is not supported there.
		sort( $expected );
		sort( $actual );
		$this->assertEquals( $expected, $actual, 'Failed asserting that received identifiers matched.' );
	}

	private function assertHasSiteKitUserOptions( $user_id ) {
		global $wpdb;

		$prefix = $this->user_options->get_meta_key( 'googlesitekit\_%' );

		$site_kit_user_options = $wpdb->get_col(
			$wpdb->prepare( "SELECT meta_value FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s", $user_id, $prefix )
		);
		$this->assertNotEmpty( $site_kit_user_options, 'Failed asserting that user has Site Kit options.' );
	}

	private function assertNotHasSiteKitUserOptions( $user_id ) {
		global $wpdb;

		$prefix = $this->user_options->get_meta_key( 'googlesitekit\_%' );

		$site_kit_user_options = $wpdb->get_col(
			$wpdb->prepare( "SELECT meta_value FROM $wpdb->usermeta WHERE user_id = %d AND meta_key LIKE %s", $user_id, $prefix )
		);
		$this->assertEmpty( $site_kit_user_options, 'Failed asserting that user does not have Site Kit options.' );
	}

	private function get_db_version() {
		return $this->options->get( 'googlesitekit_db_version' );
	}
}
