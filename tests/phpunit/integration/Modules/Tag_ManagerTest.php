<?php
/**
 * Tag_ManagerTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics\Settings as AnalyticsSettings;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Tag_ManagerTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Owner_ContractTests;

	public function test_register() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_analytics_can_use_snippet' );

		$tagmanager->register();

		$this->assertEqualSets(
			$tagmanager->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
		$this->assertTrue( has_filter( 'googlesitekit_analytics_can_use_snippet' ) );
	}

	public function test_analytics_can_use_snippet() {
		remove_all_filters( 'googlesitekit_analytics_can_use_snippet' );
		$context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options            = new Options( $context );
		$analytics_settings = new AnalyticsSettings( $options );
		$analytics_settings->delete();
		$tagmanager = new Tag_Manager( $context );
		$settings   = $tagmanager->get_settings();

		// The value should be `true` by default.
		$this->assertTrue( $analytics_settings->get()['canUseSnippet'] );
		// Delayed to differentiate between initial value and post-registration value.
		$tagmanager->register();
		$this->assertTrue( $analytics_settings->get()['canUseSnippet'] );
		// Should be `false` if there is a `gaPropertyID` set.
		$settings->merge( array( 'gaPropertyID' => 'UA-S1T3K1T-1' ) );
		$this->assertFalse( $analytics_settings->get()['canUseSnippet'] );
		// Should be `true` even with a `gaPropertyID` if GTM's snippet is disabled.
		$settings->merge( array( 'useSnippet' => false ) );
		$this->assertTrue( $analytics_settings->get()['canUseSnippet'] );
		// Still `true` if no `gaPropertyID` and no GTM snippet.
		$settings->merge( array( 'gaPropertyID' => '' ) );
		$this->assertTrue( $analytics_settings->get()['canUseSnippet'] );
	}

	public function test_register_template_redirect_amp() {
		$context    = $this->get_amp_primary_context();
		$tagmanager = new Tag_Manager( $context );

		remove_all_actions( 'template_redirect' );
		$tagmanager->register();

		remove_all_actions( 'amp_print_analytics' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_filters( 'amp_post_template_data' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'     => true,
				'ampContainerID' => 'GTM-999999',
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'amp_print_analytics' ) );
		$this->assertTrue( has_action( 'wp_footer' ) );
		$this->assertTrue( has_action( 'amp_post_template_footer' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );

		remove_all_actions( 'amp_print_analytics' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_filters( 'amp_post_template_data' );

		// Tag not hooked when blocked.
		add_filter( 'googlesitekit_tagmanager_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		// Tag not hooked when only AMP blocked
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_tagmanager_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );
	}

	public function test_register_template_redirect_non_amp() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$tagmanager = new Tag_Manager( $context );

		remove_all_actions( 'template_redirect' );
		$tagmanager->register();

		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_body_open' );
		remove_all_actions( 'wp_footer' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'wp_head' ) );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );

		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'  => true,
				'containerID' => 'GTM-999999',
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ) );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_action( 'wp_footer' ) );

		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_body_open' );
		remove_all_actions( 'wp_footer' );

		// Tag not hooked when blocked.
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'wp_head' ) );
		$this->assertFalse( has_action( 'wp_body_open' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );

		// Tag hooked when only AMP blocked.
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_tagmanager_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertTrue( has_action( 'wp_head' ) );
		$this->assertTrue( has_action( 'wp_body_open' ) );
		$this->assertTrue( has_action( 'wp_footer' ) );
	}

	/**
	 * @dataProvider block_on_consent_provider
	 * @param bool $enabled
	 */
	public function test_block_on_consent_amp( $enabled ) {
		$tagmanager = new Tag_Manager( $this->get_amp_primary_context() );
		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'     => true,
				'ampContainerID' => 'GTM-999999',
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_footer' );

		$tagmanager->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_tagmanager_tag_amp_block_on_consent', '__return_true' );
		}

		$output = $this->capture_action( 'wp_footer' );

		$this->assertContains( 'Google Tag Manager added by Site Kit', $output );

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
	public function test_block_on_consent_non_amp( $enabled ) {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'  => true,
				'containerID' => 'GTM-999999',
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );

		$tagmanager->register();

		do_action( 'template_redirect' );

		if ( $enabled ) {
			add_filter( 'googlesitekit_tagmanager_tag_block_on_consent', '__return_true' );
		}

		$header = $this->capture_action( 'wp_head' );
		$footer = $this->capture_action( 'wp_footer' );

		$this->assertContains( 'Google Tag Manager added by Site Kit', $header );

		if ( $enabled ) {
			$this->assertRegExp( '/\sdata-block-on-consent\b/', $header );
			// If enabled, the no-JS fallback must not be output.
			$this->assertNotContains( '<noscript>', $footer );
		} else {
			$this->assertNotRegExp( '/\sdata-block-on-consent\b/', $header );
			$this->assertContains( '<noscript>', $footer );
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

	public function test_is_connected_web() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->get_settings()->merge(
			array(
				'containerID' => 'GTM-999999',
			)
		);

		$this->assertTrue( $tagmanager->is_connected() );
	}

	public function test_is_connected_primary_amp() {
		$context    = $this->get_amp_primary_context();
		$tagmanager = new Tag_Manager( $context );

		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->get_settings()->merge(
			array(
				'ampContainerID' => 'GTM-999999',
			)
		);

		$this->assertTrue( $tagmanager->is_connected() );
	}

	public function test_is_connected_secondary_amp() {
		$context    = $this->get_amp_secondary_context();
		$tagmanager = new Tag_Manager( $context );

		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->get_settings()->merge(
			array(
				'containerID' => 'GTM-999999',
			)
		);

		// Should still fail because both 'web' and 'amp' containers are required.
		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->get_settings()->merge(
			array(
				'ampContainerID' => 'GTM-999999',
			)
		);

		$this->assertTrue( $tagmanager->is_connected() );
	}

	public function test_on_deactivation() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options    = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );

		$tagmanager->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_scopes() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/tagmanager.readonly',
			),
			$tagmanager->get_scopes()
		);
	}

	public function test_get_datapoints() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'accounts-containers',
				'containers',
				'tag-permission',
				'accounts',
				'create-container',
				'live-container-version',
			),
			$tagmanager->get_datapoints()
		);
	}

	/**
	 * @param string $input String to sanitize
	 * @param string $expected Expected output
	 * @dataProvider container_name_provider
	 */
	public function test_sanitize_container_name( $input, $expected ) {
		$this->assertEquals(
			$expected,
			Tag_Manager::sanitize_container_name( $input )
		);
	}

	public function container_name_provider() {
		return array(
			array(
				'Example Site Name',
				'Example Site Name',
			),
			array(
				'Exåmplé Sïtē Nàmę',
				'Example Site Name',
			),
			array(
				'_Example_Site_Name_',
				'Example_Site_Name_',
			),
			array(
				'Example Site & Name',
				'Example Site Name',
			),
			array(
				'Example Site &amp; Name',
				'Example Site Name',
			),
			array(
				'Example Site with 🔥 Name',
				'Example Site with Name',
			),
			array(
				'Example Site with "double quotes"',
				'Example Site with double quotes',
			),
			array(
				'Example Site with &quot;double quotes&quot;',
				'Example Site with double quotes',
			),
			array(
				'Example Site with \'single quotes\'',
				'Example Site with single quotes',
			),
			array(
				'Example Site with &#039;single quotes&#039;',
				'Example Site with single quotes',
			),
			array(
				'Example Site with `~!@#$%^&*()_+[]{}\\|;"<>,./?',
				'Example Site with _,.',
			),
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
