<?php
/**
 * Tag_ManagerTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Storage\Options;
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

		$tagmanager->register();

		$this->assertEqualSets(
			$tagmanager->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
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

		$tagmanager->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_AMP,
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
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_true' );
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

		$tagmanager->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_WEB,
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
		$tagmanager->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_AMP,
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
		$tagmanager->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_WEB,
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

		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_WEB,
			)
		);

		$this->assertTrue( $tagmanager->is_connected() );
	}

	public function test_is_connected_primary_amp() {
		$context    = $this->get_amp_primary_context();
		$tagmanager = new Tag_Manager( $context );

		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_AMP,
			)
		);

		$this->assertTrue( $tagmanager->is_connected() );
	}

	public function test_is_connected_secondary_amp() {
		$context    = $this->get_amp_secondary_context();
		$tagmanager = new Tag_Manager( $context );

		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_WEB,
			)
		);

		// Should still fail because both 'web' and 'amp' containers are required.
		$this->assertFalse( $tagmanager->is_connected() );

		$tagmanager->set_data(
			'container-id',
			array(
				'containerID'  => 'GTM-999999',
				'usageContext' => Tag_Manager::USAGE_CONTEXT_AMP,
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

	public function test_prepare_info_for_js() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $tagmanager->prepare_info_for_js();

		$this->assertEqualSets(
			array(
				'slug',
				'name',
				'description',
				'cta',
				'sort',
				'homepage',
				'learnMore',
				'required',
				'autoActivate',
				'internal',
				'screenID',
				'settings',
				'provides',
			),
			array_keys( $info )
		);

		$this->assertEquals( 'tagmanager', $info['slug'] );
		$this->assertArrayHasKey( 'accountID', $info['settings'] );
		$this->assertArrayHasKey( 'containerID', $info['settings'] );
	}

	public function test_get_datapoints() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'connection',
				'account-id',
				'container-id',
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
