<?php
/**
 * Profile_ReaderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class Profile_ReaderTest extends TestCase {

	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();

		$this->settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->settings->register();
	}

	/**
	 * Fails the test if any HTTP request is attempted, which verifying a token
	 * would require in order to fetch Google's signing certificates.
	 */
	private function fail_on_http_request() {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				$this->fail( "Unexpected HTTP request to $url; the token should not be verified without a client ID." );
			},
			10,
			3
		);
	}

	/**
	 * @dataProvider provide_falsy_client_ids
	 */
	public function test_get_profile_data__returns_error_for_a_falsy_client_id( $client_id ) {
		$this->settings->merge( array( 'clientID' => $client_id ) );
		$this->fail_on_http_request();

		$profile_reader = new Profile_Reader( $this->settings );
		$profile_data   = $profile_reader->get_profile_data( 'any.id.token' );

		$this->assertWPError( $profile_data, 'A falsy client ID should not be used to verify a token.' );
		$this->assertEquals( 'googlesitekit_siwg_no_client_id', $profile_data->get_error_code(), 'The error should identify the missing client ID as the cause.' );
	}

	public function provide_falsy_client_ids() {
		// A usable client ID is any truthy one; note that the string "0" is
		// not truthy in PHP.
		return array(
			'an empty string' => array( '' ),
			'null'            => array( null ),
			'false'           => array( false ),
			'zero'            => array( 0 ),
			'the string zero' => array( '0' ),
		);
	}

	public function test_get_profile_data__returns_error_when_the_client_id_is_unset() {
		$this->fail_on_http_request();

		$profile_reader = new Profile_Reader( $this->settings );
		$profile_data   = $profile_reader->get_profile_data( 'any.id.token' );

		$this->assertWPError( $profile_data, 'A missing client ID should not be used to verify a token.' );
		$this->assertEquals( 'googlesitekit_siwg_no_client_id', $profile_data->get_error_code(), 'The error should identify the missing client ID as the cause.' );
	}
}
