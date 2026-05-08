<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads;
use Google\Site_Kit\Tests\TestCase;

class Easy_Digital_DownloadsTest extends TestCase {

	/**
	 * Easy_Digital_Downloads instance.
	 *
	 * @var Easy_Digital_Downloads
	 */
	private $edd;

	public function set_up() {
		parent::set_up();
		$this->edd = new Easy_Digital_Downloads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_is_active() {
		$this->assertFalse( $this->edd->is_active() );
		define( 'EDD_VERSION', 1 );
		$this->assertTrue( $this->edd->is_active() );
	}



	public function test_get_event_names() {
		$events = $this->edd->get_event_names();
		$this->assertCount( 2, $events );
		$this->assertEquals( array( 'add_to_cart', 'purchase' ), $events );
	}


	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->edd->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}

	public function test_register_hook() {
		remove_all_actions( 'wp_footer' );

		$this->edd->register_hooks();
		$this->assertTrue( has_action( 'wp_footer' ), 'Expected wp_footer action to be registered.' );
	}

	/**
	 * @dataProvider enhanced_conversion_session_provider
	 */
	public function test_get_enhanced_conversions_data_from_session_returns_expected_data( $session_data, $expected ) {
		$reflection = new \ReflectionClass( $this->edd );
		$method     = $reflection->getMethod( 'get_enhanced_conversions_data_from_session' );
		$method->setAccessible( true );

		$result                     = $method->invoke( $this->edd, $session_data );
		$expected_without_user_data = $expected;
		unset( $expected_without_user_data['user_data'] );
		$this->assertEquals( $expected_without_user_data, $result );

		$this->enable_feature( 'gtagUserData' );

		$result = $method->invoke( $this->edd, $session_data );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * @dataProvider session_user_data_provider
	 */
	public function test_extract_user_data_from_session_returns_expected_data( $session_data, $expected ) {
		$reflection = new \ReflectionClass( $this->edd );
		$method     = $reflection->getMethod( 'extract_user_data_from_session' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->edd, $session_data );
		$this->assertSame( $expected, $result );
	}

	public function enhanced_conversion_session_provider() {
		return array(
			'non-array session'        => array(
				'invalid-session',
				array(),
			),
			'missing user data'        => array(
				array(
					'user_info'    => array(),
					'cart_details' => array(),
					'price'        => 0,
				),
				array(
					'value' => 0,
					'items' => array(),
				),
			),
			'complete user data array' => array(
				array(
					'user_info'    => array(
						'email'      => ' John+Doe@gmail.com ',
						'first_name' => ' John ',
						'last_name'  => ' DOE ',
						'address'    => array(
							'phone'   => ' 123-456-7890 ',
							'line1'   => ' 123 Main St ',
							'city'    => ' New York ',
							'state'   => ' NY ',
							'zip'     => ' 12345 ',
							'country' => 'US',
						),
					),
					'cart_details' => array(
						array(
							'name'       => 'Product',
							'id'         => '1234',
							'item_price' => '2.33',
						),
					),
					'price'        => 2.33,
				),
				array(
					'user_data' => array(
						'email'        => 'john+doe@gmail.com',
						'phone_number' => '123-456-7890',
						'address'      => array(
							'first_name'  => 'john',
							'last_name'   => 'doe',
							'street'      => '123 main st',
							'city'        => 'new york',
							'region'      => 'ny',
							'postal_code' => '12345',
							'country'     => 'US',
						),
					),
					'value'     => 2.33,
					'items'     => array(
						array(
							'item_id'   => '1234',
							'item_name' => 'Product',
							'price'     => '2.33',
						),
					),
				),
			),
		);
	}

	public function session_user_data_provider() {
		return array(
			'empty session'          => array(
				array(),
				array(),
			),
			'full user profile'      => array(
				array(
					'user_info' => array(
						'email'      => ' John.Doe@gmail.com ',
						'first_name' => ' John ',
						'last_name'  => ' DOE ',
						'address'    => array(
							'phone'   => ' 123-456-7890 ',
							'line1'   => ' 123 Main St ',
							'city'    => ' New York ',
							'state'   => ' NY ',
							'zip'     => ' 12345 ',
							'country' => 'US',
						),
					),
				),
				array(
					'email'        => 'johndoe@gmail.com',
					'phone_number' => '123-456-7890',
					'address'      => array(
						'first_name'  => 'john',
						'last_name'   => 'doe',
						'street'      => '123 main st',
						'city'        => 'new york',
						'region'      => 'ny',
						'postal_code' => '12345',
						'country'     => 'US',
					),
				),
			),
			'email only'             => array(
				array(
					'user_info' => array(
						'email' => ' john@example.com ',
					),
				),
				array(
					'email' => 'john@example.com',
				),
			),
			'no address keys'        => array(
				array(
					'user_info' => array(
						'email'      => ' John.Doe@gmail.com ',
						'first_name' => ' John ',
						'last_name'  => ' Doe ',
					),
				),
				array(
					'email'   => 'johndoe@gmail.com',
					'address' => array(
						'first_name' => 'john',
						'last_name'  => 'doe',
					),
				),
			),
			'partial address fields' => array(
				array(
					'user_info' => array(
						'email'   => 'john@example.com',
						'address' => array(
							'line1'   => ' 123 Main St ',
							'country' => 'US',
						),
					),
				),
				array(
					'email'   => 'john@example.com',
					'address' => array(
						'street'  => '123 main st',
						'country' => 'US',
					),
				),
			),
			'state without country'  => array(
				array(
					'user_info' => array(
						'email'   => 'john@example.com',
						'address' => array(
							'line1' => ' 123 Main St ',
							'state' => ' NY ',
						),
					),
				),
				array(
					'email'   => 'john@example.com',
					'address' => array(
						'street' => '123 main st',
						'region' => 'ny',
					),
				),
			),
			'phone number only'      => array(
				array(
					'user_info' => array(
						'email'   => 'john@example.com',
						'address' => array(
							'phone' => ' (123) 456-7890 ',
						),
					),
				),
				array(
					'email'        => 'john@example.com',
					'phone_number' => '(123) 456-7890',
				),
			),
		);
	}
}
