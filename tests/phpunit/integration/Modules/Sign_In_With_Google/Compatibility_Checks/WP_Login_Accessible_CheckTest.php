<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks\WP_Login_Accessible_CheckTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks;

use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\WP_Login_Accessible_Check;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Sign_In_With_Google
 * @group Compatibility_Checks
 */
class WP_Login_Accessible_CheckTest extends TestCase {

	private $check;

	public function set_up() {
		parent::set_up();

		$this->check = new WP_Login_Accessible_Check();
	}

	public function test_get_slug() {
		$this->assertEquals( 'wp_login_inaccessible', $this->check->get_slug(), 'Expected correct slug to be returned' );
	}

	public function test_run_returns_false_when_login_accessible() {
		// Mock wp_remote_head to return a 200 status code
		add_filter(
			'pre_http_request',
			function ( $preempt, $parsed_args, $url ) {
				if ( strpos( $url, 'wp-login.php' ) !== false ) {
					return array(
						'headers'  => array(),
						'body'     => '',
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$result = $this->check->run();

		$this->assertFalse( $result, 'Expected false when login page is accessible (200 status)' );
	}

	public function test_run_returns_true_when_login_returns_404() {
		// Mock wp_remote_head to return a 404 status code
		add_filter(
			'pre_http_request',
			function ( $preempt, $parsed_args, $url ) {
				if ( strpos( $url, 'wp-login.php' ) !== false ) {
					return array(
						'headers'  => array(),
						'body'     => '',
						'response' => array(
							'code'    => 404,
							'message' => 'Not Found',
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$result = $this->check->run();

		$this->assertTrue( $result, 'Expected true when login page returns 404' );
	}

	public function test_run_returns_false_when_login_returns_other_status_codes() {
		$status_codes = array( 301, 302, 403, 500, 503 );

		foreach ( $status_codes as $status_code ) {
			// Mock wp_remote_head to return various status codes
			add_filter(
				'pre_http_request',
				function ( $preempt, $parsed_args, $url ) use ( $status_code ) {
					if ( strpos( $url, 'wp-login.php' ) !== false ) {
						return array(
							'headers'  => array(),
							'body'     => '',
							'response' => array(
								'code'    => $status_code,
								'message' => 'Status Message',
							),
						);
					}
					return $preempt;
				},
				10,
				3
			);

			$result = $this->check->run();

			$this->assertFalse( $result, "Status code {$status_code} should return false" );

			remove_all_filters( 'pre_http_request' );
		}
	}

	public function test_run_returns_false_on_wp_error() {
		// Mock wp_remote_head to return a WP_Error
		add_filter(
			'pre_http_request',
			function ( $preempt, $parsed_args, $url ) {
				if ( strpos( $url, 'wp-login.php' ) !== false ) {
					return new WP_Error( 'http_request_failed', 'Connection failed' );
				}
				return $preempt;
			},
			10,
			3
		);

		$result = $this->check->run();

		$this->assertFalse( $result, 'Expected false when wp_remote_head returns WP_Error' );
	}

	public function test_run_uses_correct_login_url() {
		$login_url_called = '';

		// Mock wp_remote_head to capture the URL being called
		add_filter(
			'pre_http_request',
			function ( $preempt, $parsed_args, $url ) use ( &$login_url_called ) {
				$login_url_called = $url;
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				);
			},
			10,
			3
		);

		$this->check->run();

		$expected_url = wp_login_url();
		$this->assertEquals( $expected_url, $login_url_called, 'Expected correct wp_login_url to be called' );
	}
}
