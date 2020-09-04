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
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'is_amp', 'input' ) )->getMock();
		$mock_context->method( 'input' )->will( $this->returnValue( $context->input() ) );
		$mock_context->method( 'is_amp' )->will( $this->returnValue( true ) );

		$tagmanager = new Tag_Manager( $context );
		$this->force_set_property( $tagmanager, 'context', $mock_context );

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
	}

	public function test_register_template_redirect_non_amp() {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'is_amp', 'input' ) )->getMock();
		$mock_context->method( 'input' )->will( $this->returnValue( $context->input() ) );
		$mock_context->method( 'is_amp' )->will( $this->returnValue( false ) );

		$tagmanager = new Tag_Manager( $context );
		$this->force_set_property( $tagmanager, 'context', $mock_context );

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
	}

	public function test_is_connected_web() {
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'get_amp_mode' ) )->getMock();
		$mock_context->method( 'get_amp_mode' )->will( $this->returnValue( false ) );

		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $tagmanager, 'context', $mock_context );

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
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'get_amp_mode' ) )->getMock();
		$mock_context->method( 'get_amp_mode' )->will( $this->returnValue( Context::AMP_MODE_PRIMARY ) );

		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $tagmanager, 'context', $mock_context );

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
		$mock_context = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'get_amp_mode' ) )->getMock();
		$mock_context->method( 'get_amp_mode' )->will( $this->returnValue( Context::AMP_MODE_SECONDARY ) );

		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $tagmanager, 'context', $mock_context );

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
				'group',
				'feature',
				'module_tags',
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
