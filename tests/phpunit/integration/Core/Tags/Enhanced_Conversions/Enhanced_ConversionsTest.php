<?php
/**
 * Enhanced_ConversionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Enhanced_Conversions
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Enhanced_Conversions;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Core\Tags\Enhanced_Conversions\Enhanced_Conversions;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\TestCase;

class Enhanced_ConversionsTest extends TestCase {
	use ModulesHelperTrait;

	/**
	 * Enhanced_Conversions instance.
	 *
	 * @var Enhanced_Conversions
	 */
	private $enhanced_conversions;

	public function set_up() {
		parent::set_up();

		$this->enhanced_conversions = new Enhanced_Conversions();
	}

	public function test_get_user_data() {
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
			'sha256_email_address' => $this->enhanced_conversions::get_formatted_email( $user->user_email ),
			'address'              => array(
				'sha256_first_name' => $this->enhanced_conversions::get_formatted_value( $user->user_firstname ),
				'sha256_last_name'  => $this->enhanced_conversions::get_formatted_value( $user->user_lastname ),
			),
		);

		// Use reflection method to access the protected method.
		$reflection = new \ReflectionClass( $this->enhanced_conversions );
		$method     = $reflection->getMethod( 'get_user_data' );
		$method->setAccessible( true );
		$user_data = $method->invoke( $this->enhanced_conversions );

		$this->assertEquals( $expected, $user_data, 'User data does not match expected values.' );
	}

	public function test_get_user_data_partial_info() {
		// Create user with only email (no first_name or last_name).
		$user = $this->factory()->user->create_and_get(
			array(
				'user_email' => 'test@example.com',
			)
		);

		wp_set_current_user( $user->ID );

		$expected = array(
			'sha256_email_address' => $this->enhanced_conversions::get_formatted_email( $user->user_email ),
			// No 'address' key should be present since name fields are empty.
		);

		// Use reflection method to access the protected method.
		$reflection = new \ReflectionClass( $this->enhanced_conversions );
		$method     = $reflection->getMethod( 'get_user_data' );
		$method->setAccessible( true );
		$user_data = $method->invoke( $this->enhanced_conversions );

		$this->assertEquals( $expected, $user_data, 'User data should only contain email when name fields are empty.' );
		$this->assertArrayNotHasKey( 'address', $user_data, 'Address key should not be present when name fields are empty.' );
	}

	public function test_get_user_data_not_logged_in() {
		// Ensure no user is logged in.
		wp_set_current_user( 0 );

		// Use reflection method to access the protected method.
		$reflection = new \ReflectionClass( $this->enhanced_conversions );
		$method     = $reflection->getMethod( 'get_user_data' );
		$method->setAccessible( true );
		$user_data = $method->invoke( $this->enhanced_conversions );

		$this->assertEquals( array(), $user_data, 'User data should be empty when user is not logged in.' );
	}

	public function test_get_formatted_value() {
		$test_cases = array(
			'  example value ',
			'john Doe',
			'mixedCaseValue',
			'12345  ',
			'special!@#value$%^',
		);

		foreach ( $test_cases as $input ) {
			$expected = $this->enhanced_conversions::get_hashed_value(
				$this->enhanced_conversions::get_normalized_value( $input )
			);

			$formatted = $this->enhanced_conversions::get_formatted_value( $input );

			$this->assertEquals( $expected, $formatted, "Failed for input: '$input'" );
		}
	}

	public function test_get_formatted_email() {
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
			$expected = $this->enhanced_conversions::get_hashed_value(
				$this->enhanced_conversions::get_normalized_email( $input )
			);

			$formatted = $this->enhanced_conversions::get_formatted_email( $input );

			$this->assertEquals( $expected, $formatted, "Failed for input: '$input'" );
		}
	}

	public function test_get_normalized_value() {
		$test_cases = array(
			' Example Value '       => 'example value',
			' John Doe'             => 'john doe',
			'MixedCaseValue '       => 'mixedcasevalue',
			'  12345 '              => '12345',
			'  '                    => '',
			'  Special!@#Value$%^ ' => 'special!@#value$%^',
		);

		foreach ( $test_cases as $input => $expected ) {
			$normalized = $this->enhanced_conversions::get_normalized_value( $input );
			$this->assertEquals( $expected, $normalized, "Failed for input: '$input'" );
		}
	}

	public function test_get_normalized_email() {
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
			$normalized = $this->enhanced_conversions::get_normalized_email( $input );
			$this->assertEquals( $expected, $normalized, "Failed for input: '$input'" );
		}
	}

	public function test_get_hashed_value() {
		$test_cases = array(
			'example value',
			'john doe',
			'mixedcasevalue',
			'12345',
			'special!@#value$%^',
		);

		foreach ( $test_cases as $input ) {
			$hashed = $this->enhanced_conversions::get_hashed_value( $input );
			$this->assertEquals( hash( 'sha256', $input ), $hashed, "Failed for input: '$input'" );
		}
	}

	/**
	 * @dataProvider data_gtag_modules
	 */
	public function test_injects_gtag_script_with_user_data_when_gtag_services_are_connected( $module ) {
		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		$user = $this->factory()->user->create_and_get(
			array(
				'role'       => 'subscriber',
				'user_email' => 'john@doe.com',
				'first_name' => 'John',
				'last_name'  => 'Doe',
			)
		);

		wp_set_current_user( $user->ID );

		$gtag = new GTag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$gtag->add_tag( 'test-tag' );
		$gtag->register();

		$this->force_connect_modules( $module );

		$this->enhanced_conversions->register();

		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ), 'The googlesitekit_setup_gtag action should be registered.' );

		$head_html       = $this->capture_action( 'wp_head' );
		$expected_script = sprintf(
			'gtag("set","user_data",{"sha256_email_address":"%s","address":{"sha256_first_name":"%s","sha256_last_name":"%s"}})',
			Enhanced_Conversions::get_formatted_email( 'john@doe.com' ),
			Enhanced_Conversions::get_formatted_value( 'John' ),
			Enhanced_Conversions::get_formatted_value( 'Doe' )
		);

		$this->assertStringContainsString( $expected_script, $head_html, 'The inline script containing user data should be in the HTML.' );
	}

	public function data_gtag_modules() {
		return array(
			array(
				Analytics_4::MODULE_SLUG,
			),
			array(
				Ads::MODULE_SLUG,
			),
			array(
				Tag_Manager::MODULE_SLUG,
			),
		);
	}

	public function test_does_not_inject_user_data_when_no_service_is_connected() {
		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		$user = $this->factory()->user->create_and_get(
			array(
				'role'       => 'subscriber',
				'user_email' => 'john@doe.com',
				'first_name' => 'John',
				'last_name'  => 'Doe',
			)
		);

		wp_set_current_user( $user->ID );

		$gtag = new GTag( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$gtag->add_tag( 'test-tag' );
		$gtag->register();

		$this->enhanced_conversions->register();

		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ), 'The googlesitekit_setup_gtag action should be registered.' );

		$head_html = $this->capture_action( 'wp_head' );

		$this->assertStringNotContainsString( 'gtag("set","user_data"', $head_html, 'The inline script containing user data should not be in the HTML.' );
	}
}
