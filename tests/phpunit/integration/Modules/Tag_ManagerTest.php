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
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\UserAuthenticationTrait;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\ContainerVersion;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Tag;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 */
class Tag_ManagerTest extends TestCase {
	use UserAuthenticationTrait;
	use Module_With_Scopes_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Service_Entity_ContractTests;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * User object.
	 *
	 * @var WP_User
	 */
	private $user;

	/**
	 * User Options object.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication object.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Tag Manager object.
	 *
	 * @var Tag_Manager
	 */
	private $tagmanager;

	public function set_up() {
		parent::set_up();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->user_options   = new User_Options( $this->context, $this->user->ID );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$this->tagmanager     = new Tag_Manager( $this->context, $this->options, $this->user_options, $this->authentication );
	}

	public function tear_down() {
		parent::tear_down();

		// We have to clean up for the test cases which register this script.
		wp_deregister_script( 'googlesitekit-modules-tagmanager' );
	}

	public function test_register() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$tagmanager->register();

		$this->assertEqualSets(
			$tagmanager->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_register__googlesitekit_ads_measurement_connection_checks() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

		$tagmanager->register();

		$this->assertEqualSets(
			array(
				array( $tagmanager, 'check_ads_measurement_connection' ),
			),
			apply_filters( 'googlesitekit_ads_measurement_connection_checks', array() )
		);
	}

	public function test_register__template_redirect_amp() {
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

	public function test_register__template_redirect_non_amp() {
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

		$this->assertStringContainsString( 'Google Tag Manager AMP snippet added by Site Kit', $output );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output );
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

		$this->assertStringContainsString( 'Google Tag Manager snippet added by Site Kit', $header );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $header );
			// If enabled, the no-JS fallback must not be output.
			$this->assertStringNotContainsString( '<noscript>', $footer );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $header );
			$this->assertStringContainsString( '<noscript>', $footer );
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
				'accounts',
				'create-container',
				'live-container-version',
			),
			$tagmanager->get_datapoints()
		);
	}

	public function test_get_assets() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$tagmanager = new Tag_Manager( $context );

		$assets = $tagmanager->get_assets();

		$this->assertCount( 1, $assets );

		$script = $assets[0];
		$script->register( $context );

		$dependency = wp_scripts()->registered['googlesitekit-modules-tagmanager'];

		$this->assertEquals( $context->url( 'dist/assets/' ) . 'js/googlesitekit-modules-tagmanager.js', $dependency->src );
		$this->assertEqualSets(
			array(
				'googlesitekit-api',
				'googlesitekit-data',
				'googlesitekit-datastore-site',
				'googlesitekit-modules',
				'googlesitekit-vendor',
				'googlesitekit-modules-analytics-4',
				'googlesitekit-components',
			),
			$dependency->deps
		);
	}

	public function test_get_assets__no_analytics() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$tagmanager = new Tag_Manager( $context );

		// Override the googlesitekit_module_exists filter to ensure the Analytics module is not available.
		remove_all_filters( 'googlesitekit_module_exists' );
		add_filter(
			'googlesitekit_module_exists',
			function ( $exists, $slug ) {
				return 'analytics-4' === $slug ? false : true;
			},
			10,
			2
		);

		$assets = $tagmanager->get_assets();

		$this->assertCount( 1, $assets );

		$script = $assets[0];
		$script->register( $context );

		$dependency = wp_scripts()->registered['googlesitekit-modules-tagmanager'];

		$this->assertEquals( $context->url( 'dist/assets/' ) . 'js/googlesitekit-modules-tagmanager.js', $dependency->src );

		$this->assertEqualSets(
			array(
				'googlesitekit-api',
				'googlesitekit-data',
				'googlesitekit-datastore-site',
				'googlesitekit-modules',
				'googlesitekit-vendor',
				'googlesitekit-components',
			),
			$dependency->deps
		);

		// This is implied from the above assertion, but let's be explicit about what we are trying to test.
		$this->assertNotContains(
			'googlesitekit-module-analytics-4',
			$dependency->deps
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

	/**
	 * @dataProvider data_ads_measurement_data
	 */
	public function test_check_ads_measurement_connection( $tags, $expected_result ) {
		$account_id            = '123456789';
		$container_id          = 'GTM-987654321';
		$internal_container_id = 'GTM-987654321';

		$this->tagmanager->get_settings()->merge(
			array(
				'containerID'         => $container_id,
				'accountID'           => $account_id,
				'internalContainerID' => $internal_container_id,
			)
		);

		$this->setup_user_authentication( 'valid-auth-token' );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->tagmanager->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$this->tagmanager->get_client(),
			function ( Request $request ) use ( $account_id, $container_id, $tags ) {
				if ( false !== strpos( $request->getUri(), "/accounts/{$account_id}/containers/{$container_id}/versions:live" ) ) {
					$data = new ContainerVersion();
					$data->setTag( $tags );
					return new FulfilledPromise(
						new Response( 200, array(), json_encode( $data->toSimpleObject() ) )
					);
				}

				return new FulfilledPromise( new Response( 200 ) );
			}
		);

		$this->assertSame( $expected_result, $this->tagmanager->check_ads_measurement_connection() );
	}

	public function data_ads_measurement_data(): array {
		$awct_tag = new Tag();
		$awct_tag->setType( 'awct' );

		return array(
			'returns_true_when_awct_tag_present' => array(
				'tags'            => array( $awct_tag ),
				'expected_result' => true,
			),
			'returns_false_when_no_tags_present' => array(
				'tags'            => array(),
				'expected_result' => false,
			),
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

	/**
	 * @return Module_With_Service_Entity
	 */
	protected function get_module_with_service_entity() {
		return new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return int The error code returned by the listAccountsContainers( "accounts/{account_id}" )
	 * endpoint when permission is denied.
	 */
	protected function get_service_entity_no_access_error_code() {
		return 404;
	}

	protected function set_up_check_service_entity_access( Module $module ) {
		$module->get_settings()->merge(
			array(
				'accountID'   => '123456789',
				'containerID' => 'GTM-123456',
			)
		);
	}

	protected function set_up_check_service_entity_access_tag_manager( Module $module ) {
		FakeHttp::fake_google_http_handler(
			$module->get_client(),
			function () {
				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode(
							array(
								'container' => array(
									array( 'publicId' => 'GTM-123456' ),
									array( 'publicId' => 'GTM-123457' ),
									array( 'publicId' => 'GTM-123458' ),
								),
							)
						)
					)
				);
			}
		);
	}

	// Module_With_Service_Entity_ContractTests does not cover all the cases for
	// this module, so we need to add a few more tests here.

	/**
	 * @param Context $context Plugin context
	 * @param string  $container_id Container ID
	 * @param string  $amp_container_id AMP Container ID
	 * @param boolean $expected Expected access
	 * @group Module_With_Service_Entity
	 * @dataProvider check_service_entity_access_provider
	 */
	public function test_check_service_entity_access_success( $context, $container_id, $amp_container_id, $expected ) {
		$module = new Tag_Manager( $context );

		$module->get_settings()->merge(
			array(
				'accountID'      => '123456789',
				'containerID'    => $container_id,
				'ampContainerID' => $amp_container_id,
			)
		);

		$this->set_up_check_service_entity_access_tag_manager( $module );

		$access = $module->check_service_entity_access();

		$this->assertNotWPError( $access );
		$this->assertEquals( $expected, $access );
	}

	public function check_service_entity_access_provider() {
		return array(
			// Non-AMP - Success
			array(
				new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
				'GTM-123456',
				'',
				true,
			),
			// Non-AMP - No Access
			array(
				new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
				'GTM-123459',
				'',
				false,
			),
			// AMP Primary - Success.
			array(
				$this->get_amp_primary_context(),
				'GTM-123456',
				'GTM-123457',
				true,
			),
			// AMP Primary - No Access.
			array(
				$this->get_amp_primary_context(),
				'GTM-123456',
				'GTM-123459',
				false,
			),
			// AMP Secondary - Success.
			array(
				$this->get_amp_secondary_context(),
				'GTM-123456',
				'GTM-123457',
				true,
			),
			// AMP Secondary - No Access.
			array(
				$this->get_amp_secondary_context(),
				'GTM-123459',
				'GTM-123450',
				false,
			),
		);
	}

	/**
	 * Sets up user authentication if an access token is provided.
	 *
	 * @param string   $access_token The access token to use.
	 * @param int    [ $user_id] The user ID to set up authentication for. Will default to the current user.
	 */
	protected function setup_user_authentication( $access_token, $user_id = null ) {
		if ( empty( $access_token ) ) {
			return;
		}

		if ( empty( $user_id ) ) {
			$user_id = $this->user->ID;
		}

		$this->set_user_access_token( $user_id, $access_token );
	}
}
