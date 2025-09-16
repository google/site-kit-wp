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
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Health;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Core\Tags\GTag;
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
			apply_filters( 'googlesitekit_auth_scopes', array() ),
			'Tag Manager scopes should be registered with the auth scopes filter.'
		);
	}

	public function test_register__googlesitekit_ads_measurement_connection_checks() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

		$tagmanager->register();

		$this->assertEquals(
			array(
				array( $tagmanager, 'check_ads_measurement_connection' ),
			),
			apply_filters( 'googlesitekit_ads_measurement_connection_checks', array() ),
			'Tag Manager should register its ads measurement connection check method.'
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
		$this->assertFalse( has_action( 'amp_print_analytics' ), 'AMP analytics action should not be hooked when module is not connected.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'WP footer action should not be hooked when module is not connected.' );
		$this->assertFalse( has_action( 'amp_post_template_footer' ), 'AMP post template footer action should not be hooked when module is not connected.' );
		$this->assertFalse( has_filter( 'amp_post_template_data' ), 'AMP post template data filter should not be hooked when module is not connected.' );

		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'     => true,
				'ampContainerID' => 'GTM-999999',
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'amp_print_analytics' ), 'AMP analytics action should be hooked when module is connected.' );
		$this->assertTrue( has_action( 'wp_footer' ), 'WP footer action should be hooked when module is connected.' );
		$this->assertTrue( has_action( 'amp_post_template_footer' ), 'AMP post template footer action should be hooked when module is connected.' );
		$this->assertTrue( has_filter( 'amp_post_template_data' ), 'AMP post template data filter should be hooked when module is connected.' );

		remove_all_actions( 'amp_print_analytics' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_filters( 'amp_post_template_data' );

		// Tag not hooked when blocked.
		add_filter( 'googlesitekit_tagmanager_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'amp_print_analytics' ), 'AMP analytics action should not be hooked when tag is blocked.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'WP footer action should not be hooked when tag is blocked.' );
		$this->assertFalse( has_action( 'amp_post_template_footer' ), 'AMP post template footer action should not be hooked when tag is blocked.' );
		$this->assertFalse( has_filter( 'amp_post_template_data' ), 'AMP post template data filter should not be hooked when tag is blocked.' );

		// Tag not hooked when only AMP blocked
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_tagmanager_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'amp_print_analytics' ), 'AMP analytics action should not be hooked when only AMP is blocked.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'WP footer action should not be hooked when only AMP is blocked.' );
		$this->assertFalse( has_action( 'amp_post_template_footer' ), 'AMP post template footer action should not be hooked when only AMP is blocked.' );
		$this->assertFalse( has_filter( 'amp_post_template_data' ), 'AMP post template data filter should not be hooked when only AMP is blocked.' );
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
		$this->assertFalse( has_action( 'wp_head' ), 'WP head action should not be hooked when module is not connected.' );
		$this->assertFalse( has_action( 'wp_body_open' ), 'WP body open action should not be hooked when module is not connected.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'WP footer action should not be hooked when module is not connected.' );

		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'  => true,
				'containerID' => 'GTM-999999',
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_head' ), 'WP head action should be hooked when module is connected.' );
		$this->assertTrue( has_action( 'wp_body_open' ), 'WP body open action should be hooked when module is connected.' );
		$this->assertTrue( has_action( 'wp_footer' ), 'WP footer action should be hooked when module is connected.' );

		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_body_open' );
		remove_all_actions( 'wp_footer' );

		// Tag not hooked when blocked.
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'wp_head' ), 'WP head action should not be hooked when tag is blocked.' );
		$this->assertFalse( has_action( 'wp_body_open' ), 'WP body open action should not be hooked when tag is blocked.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'WP footer action should not be hooked when tag is blocked.' );

		// Tag hooked when only AMP blocked.
		add_filter( 'googlesitekit_tagmanager_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_tagmanager_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );

		$this->assertTrue( has_action( 'wp_head' ), 'WP head action should be hooked when only AMP is blocked.' );
		$this->assertTrue( has_action( 'wp_body_open' ), 'WP body open action should be hooked when only AMP is blocked.' );
		$this->assertTrue( has_action( 'wp_footer' ), 'WP footer action should be hooked when only AMP is blocked.' );
	}

	/**
	 * @dataProvider gtg_status_provider
	 * @param array $gtg_settings
	 */
	public function test_register__template_redirect_non_amp_google_tag_gateway( array $gtg_settings ) {
		self::enable_feature( 'googleTagGateway' );

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options    = new Options( $context );
		$gtag       = new GTag( $options );
		$tagmanager = new Tag_Manager( $context, $options );

		remove_all_actions( 'template_redirect' );
		$gtag->register();
		$tagmanager->register();

		// Configure module as connected.
		$tagmanager->get_settings()->merge(
			array(
				'useSnippet'  => true,
				'containerID' => 'GTM-999999',
			)
		);

		// Configure GTG status.
		$google_tag_gateway_settings = new Google_Tag_Gateway_Settings( $options );
		$google_tag_gateway_settings->register();
		$google_tag_gateway_settings->merge( $gtg_settings );
		$google_tag_gateway_health = new Google_Tag_Gateway_Health( $options );
		$google_tag_gateway_health->register();
		$google_tag_gateway_health->merge( $gtg_settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );

		if ( $google_tag_gateway_settings->is_google_tag_gateway_active() ) {
			$this->assertTrue(
				has_action( 'googlesitekit_setup_gtag' ),
				'gtag setup action should be present when Google tag gateway is active.'
			);

			$this->assertStringContainsString(
				'gtag("config", "GTM-999999")',
				$head_html,
				'Head output should contain gtag config when Google tag gateway is active.'
			);
		} else {
			$this->assertFalse(
				has_action( 'googlesitekit_setup_gtag' ),
				'gtag setup action should not be present when Google tag gateway is not active.'
			);

			$expected = "
			( function( w, d, s, l, i ) {
				w[l] = w[l] || [];
				w[l].push( {'gtm.start': new Date().getTime(), event: 'gtm.js'} );
				var f = d.getElementsByTagName( s )[0],
					j = d.createElement( s ), dl = l != 'dataLayer' ? '&l=' + l : '';
				j.async = true;
				j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
				f.parentNode.insertBefore( j, f );
			} )( window, document, 'script', 'dataLayer', 'GTM-999999' );
			";

			// Normalize whitespace in both strings.
			$normalized_expected = preg_replace( '/\s+/', ' ', trim( $expected ) );
			$normalized_actual   = preg_replace( '/\s+/', ' ', trim( $head_html ) );

			$this->assertStringContainsString(
				$normalized_expected,
				$normalized_actual,
				'Head output should contain Tag Manager script when Google tag gateway is not active.'
			);
		}
	}

	public function gtg_status_provider() {
		return array(
			'Google tag gateway active'     => array(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
				),
			),
			'Google tag gateway not active' => array(
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => false,
					'isScriptAccessEnabled' => false,
				),
			),
		);
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

		$this->assertStringContainsString( 'Google Tag Manager AMP snippet added by Site Kit', $output, 'Output should contain the Google Tag Manager AMP snippet.' );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output, 'Output should contain block-on-consent attribute when enabled.' );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output, 'Output should not contain block-on-consent attribute when disabled.' );
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

		$this->assertStringContainsString( 'Google Tag Manager snippet added by Site Kit', $header, 'Header should contain the Google Tag Manager snippet.' );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $header, 'Header should contain block-on-consent attribute when enabled.' );
			// If enabled, the no-JS fallback must not be output.
			$this->assertStringNotContainsString( '<noscript>', $footer, 'Footer should not contain noscript fallback when block-on-consent is enabled.' );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $header, 'Header should not contain block-on-consent attribute when disabled.' );
			$this->assertStringContainsString( '<noscript>', $footer, 'Footer should contain noscript fallback when block-on-consent is disabled.' );
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

		$this->assertFalse( $tagmanager->is_connected(), 'Tag Manager should not be connected initially.' );

		$tagmanager->get_settings()->merge(
			array(
				'containerID' => 'GTM-999999',
			)
		);

		$this->assertTrue( $tagmanager->is_connected(), 'Tag Manager should be connected when container ID is set.' );
	}

	public function test_is_connected_primary_amp() {
		$context    = $this->get_amp_primary_context();
		$tagmanager = new Tag_Manager( $context );

		$this->assertFalse( $tagmanager->is_connected(), 'Tag Manager should not be connected initially in primary AMP context.' );

		$tagmanager->get_settings()->merge(
			array(
				'ampContainerID' => 'GTM-999999',
			)
		);

		$this->assertTrue( $tagmanager->is_connected(), 'Tag Manager should be connected when AMP container ID is set in primary AMP context.' );
	}

	public function test_is_connected_secondary_amp() {
		$context    = $this->get_amp_secondary_context();
		$tagmanager = new Tag_Manager( $context );

		$this->assertFalse( $tagmanager->is_connected(), 'Tag Manager should not be connected initially.' );

		$tagmanager->get_settings()->merge(
			array(
				'containerID' => 'GTM-999999',
			)
		);

		// Should still fail because both 'web' and 'amp' containers are required.
		$this->assertFalse( $tagmanager->is_connected(), 'Tag Manager should not be connected with only web container ID in secondary AMP context.' );

		$tagmanager->get_settings()->merge(
			array(
				'ampContainerID' => 'GTM-999999',
			)
		);

		$this->assertTrue( $tagmanager->is_connected(), 'Tag Manager should be connected when both container IDs are set.' );
	}

	public function test_on_deactivation() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options    = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );

		$tagmanager->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION, 'Tag Manager settings should be removed on deactivation.' );
	}

	public function test_scopes() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/tagmanager.readonly',
			),
			$tagmanager->get_scopes(),
			'Tag Manager should have the correct readonly scope.'
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
			$tagmanager->get_datapoints(),
			'Tag Manager should have the correct datapoints.'
		);
	}

	public function test_get_assets() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$tagmanager = new Tag_Manager( $context );

		$assets = $tagmanager->get_assets();

		$this->assertCount( 1, $assets, 'Tag Manager should have exactly one asset.' );

		$script = $assets[0];
		$script->register( $context );

		$dependency = wp_scripts()->registered['googlesitekit-modules-tagmanager'];

		$this->assertEquals( $context->url( 'dist/assets/' ) . 'js/googlesitekit-modules-tagmanager.js', $dependency->src, 'Tag Manager script should have the correct source URL.' );
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
			$dependency->deps,
			'Tag Manager script should have the correct dependencies.'
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

		$this->assertCount( 1, $assets, 'Tag Manager should have exactly one asset when Analytics module is not available.' );

		$script = $assets[0];
		$script->register( $context );

		$dependency = wp_scripts()->registered['googlesitekit-modules-tagmanager'];

		$this->assertEquals( $context->url( 'dist/assets/' ) . 'js/googlesitekit-modules-tagmanager.js', $dependency->src, 'Tag Manager script should have the correct source URL when Analytics module is not available.' );

		$this->assertEqualSets(
			array(
				'googlesitekit-api',
				'googlesitekit-data',
				'googlesitekit-datastore-site',
				'googlesitekit-modules',
				'googlesitekit-vendor',
				'googlesitekit-components',
			),
			$dependency->deps,
			'Tag Manager script should have the correct dependencies when Analytics module is not available.'
		);

		// This is implied from the above assertion, but let's be explicit about what we are trying to test.
		$this->assertNotContains(
			'googlesitekit-module-analytics-4',
			$dependency->deps,
			'Tag Manager script should not depend on Analytics module when it is not available.'
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
			Tag_Manager::sanitize_container_name( $input ),
			'Container name should be sanitized correctly.'
		);
	}

	/**
	 * @dataProvider data_ads_measurement_data
	 * @param $tag Tag[] Array of container tag instances.
	 * @param $expected_result bool
	 */
	public function test_check_ads_measurement_connection( $tag, $expected_result ) {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user_id );
		$authentication = new Authentication( $context, $options, $user_options );
		$tagmanager     = new Tag_Manager( $context, $options, $user_options, $authentication );

		$account_id            = '123456789';
		$container_id          = 'GTM-987654321';
		$internal_container_id = '234567891';

		$tagmanager->get_settings()->merge(
			array(
				'containerID'         => $container_id,
				'accountID'           => $account_id,
				'internalContainerID' => $internal_container_id,
			)
		);

		$this->set_user_access_token( $user_id, 'valid-auth-token' );

		$authentication->get_oauth_client()->set_granted_scopes(
			$tagmanager->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$tagmanager->get_client(),
			function ( Request $request ) use ( $account_id, $internal_container_id, $tag ) {
				$uri = $request->getUri();

				if (
					'tagmanager.googleapis.com' !== $uri->getHost()
					|| false === strpos( $uri->getPath(), "/accounts/{$account_id}/containers/{$internal_container_id}/versions:live" )
				) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				$data = new ContainerVersion();
				$data->setTag( $tag );

				return new FulfilledPromise(
					new Response( 200, array(), json_encode( $data->toSimpleObject() ) )
				);
			}
		);

		$this->assertSame( $expected_result, $tagmanager->check_ads_measurement_connection(), 'Ads measurement connection check should return expected result based on container tags.' );
	}

	public function data_ads_measurement_data() {
		$awct_tag = new Tag();
		$awct_tag->setType( 'awct' );

		return array(
			'awct tag present' => array(
				'container tag'   => array( $awct_tag ),
				'expected_result' => true,
			),
			'no tags present'  => array(
				'container tag'   => array(),
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
	 * @param string $container_id Container ID
	 * @param string $amp_container_id AMP Container ID
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

		$this->assertNotWPError( $access, 'Service entity access check should not return an error.' );
		$this->assertEquals( $expected, $access, 'Service entity access should match expected result.' );
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
}
