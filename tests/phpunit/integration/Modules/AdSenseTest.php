<?php
/**
 * AdSenseTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Screen_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;
use ReflectionMethod;

/**
 * @group Modules
 */
class AdSenseTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Screen_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;

	public function test_register() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_module_screens' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
		$this->assertEmpty( apply_filters( 'googlesitekit_module_screens', array() ) );

		$adsense->register();

		$this->assertNotEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
		$this->assertContains( $adsense->get_screen(), apply_filters( 'googlesitekit_module_screens', array() ) );
	}

	public function test_register_template_redirect_amp() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'is_amp', 'input' ) )->getMock();
		$mock_context->method( 'input' )->will( $this->returnValue( $context->input() ) );
		$mock_context->method( 'is_amp' )->will( $this->returnValue( true ) );

		$adsense = new AdSense( $context );
		$this->force_set_property( $adsense, 'context', $mock_context );

		remove_all_actions( 'template_redirect' );
		$adsense->register();

		remove_all_actions( 'wp_body_open' );
		remove_all_filters( 'the_content' );
		remove_all_filters( 'amp_post_template_data' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		$adsense->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$adsense->set_data( 'client-id', array( 'clientID' => 'ca-pub-12345678' ) );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );
	}

	public function test_register_template_redirect_non_amp() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'is_amp', 'input' ) )->getMock();
		$mock_context->method( 'input' )->will( $this->returnValue( $context->input() ) );
		$mock_context->method( 'is_amp' )->will( $this->returnValue( false ) );

		$adsense = new AdSense( $context );
		$this->force_set_property( $adsense, 'context', $mock_context );

		remove_all_actions( 'template_redirect' );
		$adsense->register();

		remove_all_actions( 'wp_head' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_head' ) );

		$adsense->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$adsense->set_data( 'client-id', array( 'clientID' => 'ca-pub-12345678' ) );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ) );
	}

	public function test_get_module_scope() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertContains(
			'https://www.googleapis.com/auth/adsense.readonly',
			$adsense->get_scopes()
		);
	}

	public function test_prepare_info_for_js() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $adsense->prepare_info_for_js();

		$this->assertEqualSets(
			array(
				'slug',
				'name',
				'description',
				'cta',
				'sort',
				'homepage',
				'learnMore',
				'group',
				'feature',
				'module_tags',
				'required',
				'autoActivate',
				'internal',
				'screenID',
				'settings',
				'provides',
				'accountURL',
				'signupURL',
				'rootURL',
			),
			array_keys( $info )
		);

		$this->assertEquals( 'adsense', $info['slug'] );
		$this->assertStringStartsWith( 'https://www.google.com/adsense/', $info['accountURL'] );
		$this->assertStringStartsWith( 'https://www.google.com/adsense/', $info['signupURL'] );
		$this->assertStringStartsWith( 'https://www.google.com/adsense/', $info['rootURL'] );
	}

	public function test_is_connected() {
		$adsense  = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$settings = $options->get( Settings::OPTION );

		$this->assertFalse( $settings['accountSetupComplete'] );
		$this->assertFalse( $settings['siteSetupComplete'] );
		$this->assertFalse( $adsense->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'accountSetupComplete' => true,
				'siteSetupComplete'    => true,
			)
		);
		$this->assertTrue( $adsense->is_connected() );
	}

	public function test_on_deactivation() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$options->set( Settings::OPTION, 'test-value' );
		$this->assertOptionExists( Settings::OPTION );

		$adsense->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'connection',
				'account-id',
				'client-id',
				'use-snippet',
				'account-status',
				'account-url',
				'reports-url',
				'notifications',
				'tag-permission',
				'accounts',
				'alerts',
				'clients',
				'urlchannels',
				'earnings',
				'setup-complete',
			),
			$adsense->get_datapoints()
		);
	}

	/**
	 * @dataProvider data_parse_account_id
	 */
	public function test_parse_account_id( $client_id, $expected ) {
		$class  = new \ReflectionClass( AdSense::class );
		$method = $class->getMethod( 'parse_account_id' );
		$method->setAccessible( true );

		$result = $method->invokeArgs(
			new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ),
			array( $client_id )
		);
		$this->assertSame( $expected, $result );
	}

	public function data_parse_account_id() {
		return array(
			array(
				'ca-pub-2358017',
				'pub-2358017',
			),
			array(
				'ca-pub-13572468',
				'pub-13572468',
			),
			array(
				'ca-xyz-13572468',
				'',
			),
			array(
				'ca-13572468',
				'',
			),
			array(
				'GTM-13572468',
				'',
			),
			array(
				'13572468',
				'',
			),
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module|Module_With_Screen
	 */
	protected function get_module_with_screen() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module|Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_parse_earnings_orderby() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$reflected_parse_earnings_orderby_method = new ReflectionMethod( 'Google\Site_Kit\Modules\AdSense', 'parse_earnings_orderby' );
		$reflected_parse_earnings_orderby_method->setAccessible( true );

		// When there is no orderby in the request.
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, array() );
		$this->assertTrue( is_array( $result ) );
		$this->assertEmpty( $result );

		// When a single order object is used.
		$order  = array(
			'fieldName' => 'views',
			'sortOrder' => 'ASCENDING',
		);
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, $order );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 1, count( $result ) );
		$this->assertEquals( '+views', $result[0] );

		// When multiple orders are passed.
		$orders = array(
			array(
				'fieldName' => 'pages',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => 'sessions',
				'sortOrder' => 'ASCENDING',
			),
		);
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertEquals( '-pages', $result[0] );
		$this->assertEquals( '+sessions', $result[1] );

		// Check that it skips invalid orders.
		$orders = array(
			array(
				'fieldName' => 'views',
				'sortOrder' => '',
			),
			array(
				'fieldName' => 'pages',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => '',
				'sortOrder' => 'DESCENDING',
			),
			array(
				'fieldName' => 'sessions',
				'sortOrder' => 'ASCENDING',
			),
		);
		$result = $reflected_parse_earnings_orderby_method->invoke( $adsense, $orders );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 2, count( $result ) );
		$this->assertEquals( '-pages', $result[0] );
		$this->assertEquals( '+sessions', $result[1] );
	}

}
