<?php
/**
 * Enhanced_ConversionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Ads
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Modules\Ads\Enhanced_Conversions;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class Enhanced_ConversionsTest extends TestCase {

	public function test_get_user_data() {
		$enhanced_conversions = new Enhanced_Conversions();

		$user = $this->factory()->user->create_and_get(
			array(
				'role'       => 'subscriber',
				'user_email' => 'john@doe.com',
				'first_name' => 'John',
				'last_name'  => 'Doe',
			)
		);

		wp_set_current_user( $user->ID );

		$expected = array(
			'sha256_email_address' => $enhanced_conversions::get_formatted_email( $user->user_email ),
			'address'              => array(
				'sha256_first_name' => $enhanced_conversions::get_formatted_value( $user->user_firstname ),
				'sha256_last_name'  => $enhanced_conversions::get_formatted_value( $user->user_lastname ),
			),
		);

		// Use reflection method to access the protected method.
		$reflection = new \ReflectionClass( $enhanced_conversions );
		$method     = $reflection->getMethod( 'get_user_data' );
		$method->setAccessible( true );
		$user_data = $method->invoke( $enhanced_conversions );

		$this->assertEquals( $expected, $user_data, 'User data does not match expected values.' );
	}

	public function test_get_user_data_partial_info() {
		$enhanced_conversions = new Enhanced_Conversions();

		// Create user with only email (no first_name or last_name).
		$user = $this->factory()->user->create_and_get(
			array(
				'user_email' => 'test@example.com',
			)
		);

		wp_set_current_user( $user->ID );

		$expected = array(
			'sha256_email_address' => $enhanced_conversions::get_formatted_email( $user->user_email ),
			// No 'address' key should be present since name fields are empty.
		);

		// Use reflection method to access the protected method.
		$reflection = new \ReflectionClass( $enhanced_conversions );
		$method     = $reflection->getMethod( 'get_user_data' );
		$method->setAccessible( true );
		$user_data = $method->invoke( $enhanced_conversions );

		$this->assertEquals( $expected, $user_data, 'User data should only contain email when name fields are empty.' );
		$this->assertArrayNotHasKey( 'address', $user_data, 'Address key should not be present when name fields are empty.' );
	}

	public function test_get_user_data_not_logged_in() {
		$enhanced_conversions = new Enhanced_Conversions();

		// Ensure no user is logged in.
		wp_set_current_user( 0 );

		// Use reflection method to access the protected method.
		$reflection = new \ReflectionClass( $enhanced_conversions );
		$method     = $reflection->getMethod( 'get_user_data' );
		$method->setAccessible( true );
		$user_data = $method->invoke( $enhanced_conversions );

		$this->assertEquals( array(), $user_data, 'User data should be empty when user is not logged in.' );
	}

	public function test_get_formatted_value() {
		$enhanced_conversions = new Enhanced_Conversions();

		$test_cases = array(
			'  example value ',
			'john Doe',
			'mixedCaseValue',
			'12345  ',
			'special!@#value$%^',
		);

		foreach ( $test_cases as $input ) {
			$expected = $enhanced_conversions::get_hashed_value(
				$enhanced_conversions::get_normalized_value( $input )
			);

			$formatted = $enhanced_conversions::get_formatted_value( $input );

			$this->assertEquals( $expected, $formatted, "Failed for input: '$input'" );
		}
	}

	public function test_get_formatted_email() {
		$enhanced_conversions = new Enhanced_Conversions();

		$test_cases = array(
			' foo@bar.com ',
			' FOO@BAR.COM  ',
			'Foo@Bar.Com ',
			'fo.o@bar.com ',
			' foo.bar@gmail.com ',
			' foo.bar@googlemail.com ',
			'"fo.o@ba.r"@gmail.com ',
			' "fo.o@ba.r"@googlemail.com',
		);

		foreach ( $test_cases as $input ) {
			$expected = $enhanced_conversions::get_hashed_value(
				$enhanced_conversions::get_normalized_email( $input )
			);

			$formatted = $enhanced_conversions::get_formatted_email( $input );

			$this->assertEquals( $expected, $formatted, "Failed for input: '$input'" );
		}
	}

	public function test_get_normalized_value() {
		$enhanced_conversions = new Enhanced_Conversions();

		$test_cases = array(
			' Example Value '       => 'example value',
			' John Doe'             => 'john doe',
			'MixedCaseValue '       => 'mixedcasevalue',
			'  12345 '              => '12345',
			'  '                    => '',
			'  Special!@#Value$%^ ' => 'special!@#value$%^',
		);

		foreach ( $test_cases as $input => $expected ) {
			$normalized = $enhanced_conversions::get_normalized_value( $input );
			$this->assertEquals( $expected, $normalized, "Failed for input: '$input'" );
		}
	}

	public function test_get_normalized_email() {
		$enhanced_conversions = new Enhanced_Conversions();

		$test_cases = array(
			' foo@bar.com '               => 'foo@bar.com',
			' FOO@BAR.COM  '              => 'foo@bar.com',
			'Foo@Bar.Com '                => 'foo@bar.com',
			'fo.o@bar.com '               => 'fo.o@bar.com',
			' foo.bar@gmail.com '         => 'foobar@gmail.com',
			' foo.bar@googlemail.com '    => 'foobar@googlemail.com',
			'"fo.o@ba.r"@gmail.com '      => '"foo@bar"@gmail.com',
			' "fo.o@ba.r"@googlemail.com' => '"foo@bar"@googlemail.com',
		);

		foreach ( $test_cases as $input => $expected ) {
			$normalized = $enhanced_conversions::get_normalized_email( $input );
			$this->assertEquals( $expected, $normalized, "Failed for input: '$input'" );
		}
	}

	public function test_get_hashed_value() {
		$enhanced_conversions = new Enhanced_Conversions();

		$test_cases = array(
			'example value',
			'john doe',
			'mixedcasevalue',
			'12345',
			'special!@#value$%^',
		);

		foreach ( $test_cases as $input ) {
			$hashed = $enhanced_conversions::get_hashed_value( $input );
			$this->assertEquals( hash( 'sha256', $input ), $hashed, "Failed for input: '$input'" );
		}
	}
}
