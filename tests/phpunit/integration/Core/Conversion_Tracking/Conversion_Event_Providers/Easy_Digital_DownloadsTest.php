<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
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

	/**
	 * The provider's script handle.
	 *
	 * @var string
	 */
	private $handle;

	public function set_up() {
		parent::set_up();

		$this->edd    = new Easy_Digital_Downloads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->handle = 'googlesitekit-events-provider-' . Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG;
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_is_active() {
		$this->assertFalse( $this->edd->is_active(), 'EDD provider should not be active before plugin constant.' );
		define( 'EDD_VERSION', 1 );
		$this->assertTrue( $this->edd->is_active(), 'EDD provider should be active after plugin constant.' );
	}



	public function test_get_event_names() {
		$events = $this->edd->get_event_names();
		$this->assertCount( 2, $events, 'EDD provider should expose two events.' );
		$this->assertEquals( array( 'add_to_cart', 'purchase' ), $events, 'EDD events should include add to cart and purchase.' );
	}


	public function test_register_script() {
		$handle = 'googlesitekit-events-provider-' . Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ), 'EDD script should not be registered initially.' );

		$script = $this->edd->register_script();
		$this->assertInstanceOf( Script::class, $script, 'EDD provider should return a script.' );
		$this->assertTrue( wp_script_is( $handle, 'registered' ), 'EDD script should be registered.' );
	}

	public function test_register_hook() {
		remove_all_actions( 'wp_footer' );

		$this->edd->register_hooks();
		$this->assertTrue( has_action( 'wp_footer' ), 'Expected wp_footer action to be registered.' );
	}

	/**
	 * @dataProvider data_currencies
	 */
	public function test_get_currency( $store_currency, $expected ) {
		$edd = $this->create_provider( $store_currency );

		$reflection = new \ReflectionClass( $edd );
		$method     = $reflection->getMethod( 'get_currency' );
		$method->setAccessible( true );

		$this->assertSame(
			$expected,
			$method->invoke( $edd ),
			'get_currency() should return a currency gtag accepts, or nothing at all.'
		);
	}

	public function data_currencies() {
		return array(
			'a currency code'                    => array( 'EUR', 'EUR' ),
			'a lowercase currency code'          => array( 'eur', 'EUR' ),
			'a currency code with a symbol'      => array( 'EUR €', '' ),
			'a currency symbol'                  => array( '€', '' ),
			'a code of the wrong length'         => array( 'EURO', '' ),
			'an empty currency'                  => array( '', '' ),
			'a currency that is not even a code' => array( array( 'EUR' ), '' ),
			'no currency at all'                 => array( null, '' ),
		);
	}

	public function test_add_inline_data__currency() {
		$this->assertStringContainsString(
			'window._googlesitekit.edddata.currency = "EUR";',
			$this->get_inline_script( $this->create_provider( 'EUR' ) ),
			'The provider should add the store currency, JSON-encoded.'
		);
	}

	public function test_add_inline_data__unusable_currency() {
		$this->assertStringNotContainsString(
			'edddata.currency',
			$this->get_inline_script( $this->create_provider( 'Euros' ) ),
			'The provider should add no currency at all when the store currency is not one gtag accepts.'
		);
	}

	public function test_add_inline_data__no_purchase_outside_the_success_page() {
		$inline_script = $this->get_inline_script( $this->create_provider( 'EUR' ) );

		$this->assertStringNotContainsString(
			'edddata.purchase',
			$inline_script,
			'The provider should add no purchase data outside the success page.'
		);
		$this->assertStringContainsString(
			'edddata.currency',
			$inline_script,
			'The provider should still add the currency outside the success page.'
		);
	}

	public function test_add_inline_data__no_purchase_on_the_success_page_without_a_session() {
		$this->assertStringNotContainsString(
			'edddata.purchase',
			$this->get_inline_script( $this->create_provider( 'EUR', true, null ) ),
			'The provider should add no purchase data on the success page when there is no purchase session.'
		);
	}

	public function test_add_inline_data__purchase_on_the_success_page() {
		$edd = $this->create_provider(
			'EUR',
			true,
			array(
				'price'        => 2.33,
				'cart_details' => array(
					array(
						'name'       => 'Product',
						'id'         => '1234',
						'item_price' => '2.33',
					),
				),
			)
		);

		$inline_script = $this->get_inline_script( $edd );

		$this->assertStringContainsString(
			'window._googlesitekit.edddata.purchase = {"items":[{"item_id":"1234","item_name":"Product","price":"2.33"}],"value":2.33};',
			$inline_script,
			'The provider should add the purchase data on the success page.'
		);
		$this->assertSame(
			1,
			substr_count( $inline_script, 'window._googlesitekit.edddata = window._googlesitekit.edddata || {};' ),
			'The provider should set up the edddata namespace exactly once, however many fields it adds to it.'
		);
	}

	public function test_add_inline_data__nothing_to_add() {
		$this->assertSame(
			'',
			$this->get_inline_script( $this->create_provider() ),
			'The provider should add no inline script when it has no data for it.'
		);
	}

	/**
	 * Creates a provider with the methods that read from Easy Digital Downloads stubbed.
	 *
	 * The plugin is not installed here, so those methods are the seam the tests
	 * control instead. Everything the provider does with what they return is the
	 * real implementation.
	 *
	 * @param mixed $currency         What the store reports as its currency.
	 * @param bool  $is_success_page  Whether the current request is the purchase success page.
	 * @param mixed $purchase_session What the store reports as the current purchase.
	 *
	 * @return Easy_Digital_Downloads The provider, reporting what the arguments describe.
	 */
	private function create_provider( $currency = null, $is_success_page = false, $purchase_session = null ) {
		$edd = $this->getMockBuilder( Easy_Digital_Downloads::class )
			->setConstructorArgs( array( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
			->setMethods( array( 'read_store_currency', 'is_success_page', 'read_purchase_session' ) )
			->getMock();

		$edd->method( 'read_store_currency' )->willReturn( $currency );
		$edd->method( 'is_success_page' )->willReturn( $is_success_page );
		$edd->method( 'read_purchase_session' )->willReturn( $purchase_session );

		return $edd;
	}

	/**
	 * Runs the provider's `wp_footer` callback and returns the inline script it added.
	 *
	 * @param Easy_Digital_Downloads $edd The provider to run.
	 *
	 * @return string The inline script, or an empty string when the provider added none.
	 */
	private function get_inline_script( $edd ) {
		$edd->register_script();

		// WordPress core and the active theme hook `wp_footer` too. Clear it, so the
		// `do_action()` below runs only the callback `register_hooks()` adds.
		remove_all_actions( 'wp_footer' );
		$edd->register_hooks();

		do_action( 'wp_footer' );

		return join( "\n", (array) wp_scripts()->get_data( $this->handle, 'before' ) );
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
		$this->assertEquals( $expected_without_user_data, $result, 'EDD session data should omit user data when feature disabled.' );

		$this->enable_feature( 'gtagUserData' );

		$result = $method->invoke( $this->edd, $session_data );
		$this->assertEquals( $expected, $result, 'EDD session data should include expected conversion data.' );
	}

	/**
	 * @dataProvider session_user_data_provider
	 */
	public function test_extract_user_data_from_session_returns_expected_data( $session_data, $expected ) {
		$reflection = new \ReflectionClass( $this->edd );
		$method     = $reflection->getMethod( 'extract_user_data_from_session' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->edd, $session_data );
		$this->assertSame( $expected, $result, 'EDD session user data should match expected user data.' );
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
