<?php
/**
 * AdSenseTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
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
		$context = $this->get_amp_primary_context();
		$adsense = new AdSense( $context );

		remove_all_actions( 'template_redirect' );
		$adsense->register();

		remove_all_actions( 'wp_body_open' );
		remove_all_filters( 'the_content' );
		remove_all_filters( 'amp_post_template_data' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );

		// Tag not hooked when blocked.
		remove_all_actions( 'wp_body_open' );
		remove_all_filters( 'the_content' );
		remove_all_filters( 'amp_post_template_data' );
		add_filter( 'googlesitekit_adsense_tag_amp_blocked', '__return_true' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		// Tag hooked when AMP specifically not blocked.
		add_filter( 'googlesitekit_adsense_tag_amp_blocked', '__return_false' );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );
	}

	public function test_register_template_redirect_non_amp() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$adsense = new AdSense( $context );

		remove_all_actions( 'template_redirect' );
		$adsense->register();

		remove_all_actions( 'wp_head' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_head' ) );

		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ) );

		// Tag not hooked when blocked.
		remove_all_actions( 'wp_head' );
		add_filter( 'googlesitekit_adsense_tag_blocked', '__return_true' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_head' ) );

		// Tag hooked when only AMP blocked.
		remove_all_actions( 'wp_head' );
		add_filter( 'googlesitekit_adsense_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_adsense_tag_amp_blocked', '__return_true' );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ) );
	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_non_amp( $enabled ) {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_head' );
		$adsense->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_adsense_tag_block_on_consent', '__return_true' );
		}

		$output = $this->capture_action( 'wp_head' );
		$this->assertContains( 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', $output );

		if ( $enabled ) {
			$this->assertRegExp( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertNotRegExp( '/\sdata-block-on-consent\b/', $output );
		}
	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_amp( $enabled ) {
		$adsense = new AdSense( $this->get_amp_primary_context() );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_body_open' );
		$adsense->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_adsense_tag_amp_block_on_consent', '__return_true' );
		}

		$output = $this->capture_action( 'wp_body_open' );
		$this->assertContains( 'data-ad-client="ca-pub-12345678"', $output );

		if ( $enabled ) {
			$this->assertRegExp( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertNotRegExp( '/\sdata-block-on-consent\b/', $output );
		}
	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_amp_content( $enabled ) {
		$adsense = new AdSense( $this->get_amp_primary_context() );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'the_content' );
		$adsense->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_adsense_tag_amp_block_on_consent', '__return_true' );
		}

		// We need to fake the global to allow the hook to add the tag.
		global $wp_query;
		$wp_query->in_the_loop = true;

		$output = apply_filters( 'the_content', 'test content' );
		$this->assertContains( 'data-ad-client="ca-pub-12345678"', $output );

		if ( $enabled ) {
			$this->assertRegExp( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertNotRegExp( '/\sdata-block-on-consent\b/', $output );
		}
	}

	public function block_on_consent_provider() {
		return array(
			'default (disabled)' => array(
				false,
			),
			'enabled'            => array(
				true,
			),
		);
	}

	/**
	 * @dataProvider data_amp_auto_ads_tag_in_the_loop
	 * @param Context $context
	 */
	public function test_amp_auto_ads_tag_in_the_loop( $context ) {
		$adsense = new AdSense( $context );
		$adsense->get_settings()->merge(
			array(
				'clientID'   => 'ca-pub-12345678',
				'useSnippet' => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'the_content' );
		$adsense->register();

		do_action( 'template_redirect' );

		// Confirm that the tag is not added if we're not in the loop.
		$output = apply_filters( 'the_content', 'test content' );
		$this->assertNotContains( 'data-ad-client="ca-pub-12345678"', $output );

		// We need to fake the global to allow the hook to add the tag.
		global $wp_query;
		$wp_query->in_the_loop = true;

		// Confirm that the tag is added when in the loop.
		$output = apply_filters( 'the_content', 'test content' );
		$this->assertContains( 'data-ad-client="ca-pub-12345678"', $output );
	}

	public function data_amp_auto_ads_tag_in_the_loop() {
		return array(
			'primary'   => array(
				$this->get_amp_primary_context(),
			),
			'secondary' => array(
				$this->get_amp_secondary_context(),
			),
		);
	}

	public function test_get_module_scope() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertContains(
			'https://www.googleapis.com/auth/adsense.readonly',
			$adsense->get_scopes()
		);
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
				'notifications',
				'tag-permission',
				'accounts',
				'alerts',
				'clients',
				'urlchannels',
				'earnings',
				'adunits',
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
