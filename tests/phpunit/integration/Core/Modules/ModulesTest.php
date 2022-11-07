<?php
/**
 * ModulesTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Build_Mode;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Idea_Hub;
use Google\Site_Kit\Modules\Idea_Hub\Settings as Idea_Hub_Settings;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Site_Verification;
use Google\Site_Kit\Modules\Thank_With_Google;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\FakeHttpClient;
use WP_REST_Request;

/**
 * @group Modules
 */
class ModulesTest extends TestCase {

	public function test_get_available_modules() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$available = array_map(
			function ( $instance ) {
				return get_class( $instance );
			},
			$modules->get_available_modules()
		);

		$this->assertEqualSetsWithIndex(
			array(
				'adsense'            => 'Google\\Site_Kit\\Modules\\AdSense',
				'analytics'          => 'Google\\Site_Kit\\Modules\\Analytics',
				'analytics-4'        => 'Google\\Site_Kit\\Modules\\Analytics_4',
				'optimize'           => 'Google\\Site_Kit\\Modules\\Optimize',
				'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
				'search-console'     => 'Google\\Site_Kit\\Modules\\Search_Console',
				'site-verification'  => 'Google\\Site_Kit\\Modules\\Site_Verification',
				'tagmanager'         => 'Google\\Site_Kit\\Modules\\Tag_Manager',
			),
			$available
		);
	}

	public function test_get_available_modules__missing_dependency() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		add_filter(
			'googlesitekit_available_modules',
			function( $modules ) {
				return array_filter(
					$modules,
					function( $module ) {
						// Remove Analytics from the list of available modules.
						return 'analytics' !== $module;
					}
				);
			}
		);

		$available = array_map(
			function ( $instance ) {
				return get_class( $instance );
			},
			$modules->get_available_modules()
		);

		// Analytics is no longer present due to the filter above.
		// Analytics-4 and Optimize are no longer present due to their dependency on Analytics.
		$this->assertEqualSetsWithIndex(
			array(
				'adsense'            => 'Google\\Site_Kit\\Modules\\AdSense',
				'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
				'search-console'     => 'Google\\Site_Kit\\Modules\\Search_Console',
				'site-verification'  => 'Google\\Site_Kit\\Modules\\Site_Verification',
				'tagmanager'         => 'Google\\Site_Kit\\Modules\\Tag_Manager',
			),
			$available
		);
	}

	public function test_get_active_modules() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$always_on_modules = array(
			'search-console'    => 'Google\\Site_Kit\\Modules\\Search_Console',
			'site-verification' => 'Google\\Site_Kit\\Modules\\Site_Verification',
		);

		$default_active_modules = array(
			'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
		);

		$this->assertEqualSetsWithIndex(
			$always_on_modules + $default_active_modules,
			array_map( 'get_class', $modules->get_active_modules() )
		);

		// Active modules other than always-on modules are stored in an option.

		// Active modules will fallback to legacy option if set.
		update_option( 'googlesitekit-active-modules', array( 'analytics' ) );

		$this->assertEqualSetsWithIndex(
			$always_on_modules + array(
				'analytics'   => 'Google\\Site_Kit\\Modules\\Analytics',
				'analytics-4' => 'Google\\Site_Kit\\Modules\\Analytics_4',
			),
			array_map( 'get_class', $modules->get_active_modules() )
		);

		// If the modern option is set, it will take precedence over legacy (set or not).
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'adsense' ) );

		$this->assertEquals(
			$always_on_modules + array(
				'adsense' => 'Google\\Site_Kit\\Modules\\AdSense',
			),
			array_map( 'get_class', $modules->get_active_modules() )
		);
	}

	public function test_should_enable_twg__feature_flag_not_enabled() {
		$this->assertEquals( false, Modules::should_enable_twg() );
	}

	public function test_should_enable_twg_development() {
		$this->enable_feature( 'twgModule' );
		Build_Mode::set_mode( Build_Mode::MODE_DEVELOPMENT );
		$this->assertEquals( true, Modules::should_enable_twg() );
		// Reset build mode.
		Build_Mode::set_mode( Build_Mode::MODE_PRODUCTION );
	}

	public function test_should_enable_twg_non_ssl() {
		$this->enable_feature( 'twgModule' );
		$this->assertEquals( false, Modules::should_enable_twg() );
	}

	public function test_should_enable_twg_ssl_home_url() {
		$this->enable_feature( 'twgModule' );

		$home_url_hook = function() {
			return 'http://non-https.site';
		};

		add_filter( 'home_url', $home_url_hook );
		$this->assertEquals( false, Modules::should_enable_twg() );
		remove_filter( 'home_url', $home_url_hook );

		$home_url_hook = function() {
			return 'https://with-https.site';
		};

		add_filter( 'home_url', $home_url_hook );
		$this->assertEquals( true, Modules::should_enable_twg() );
		remove_filter( 'home_url', $home_url_hook );
	}

	public function test_should_enable_twg_ssl() {
		$this->enable_feature( 'twgModule' );
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals( true, Modules::should_enable_twg() );
		// Reset HTTPS.
		unset( $_SERVER['HTTPS'] );
		$this->assertEquals( false, Modules::should_enable_twg() );
	}

	public function test_register() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module->set_force_active( true );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		$this->assertFalse( $fake_module->is_registered() );
		$modules->register();
		$this->assertTrue( $fake_module->is_registered() );

		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
		$this->assertTrue( has_filter( 'googlesitekit_features_request_data' ) );
		$this->assertContains(
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/list',
			apply_filters( 'googlesitekit_apifetch_preload_paths', array() )
		);

		$this->assertTrue( has_filter( 'googlesitekit_module_exists' ) );
		$this->assertTrue( apply_filters( 'googlesitekit_module_exists', null, 'fake-module' ) );
		$this->assertFalse( apply_filters( 'googlesitekit_module_exists', null, 'non-existent-module' ) );
	}

	public function test_get_module() {
		$modules   = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$available = $modules->get_available_modules();

		$search_console_module = $modules->get_module( 'search-console' );

		$this->assertEquals( $available['search-console'], $search_console_module );
	}

	public function test_get_module_exception() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module_slug = 'non-existent-module';

		$this->assertArrayNotHasKey( $module_slug, $modules->get_available_modules() );

		try {
			$modules->get_module( $module_slug );
		} catch ( \Exception $exception ) {
			// We expect an exception to be thrown, let's make sure it's the right one.
			$this->assertStringContainsString( $module_slug, $exception->getMessage() );

			return;
		}

		$this->fail( 'Failed to catch exception thrown for non-existent module in get_module.' );
	}

	public function test_get_module_dependencies() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertArrayHasKey( 'optimize', $modules->get_available_modules() );
		$dependencies = $modules->get_module_dependencies( 'optimize' );

		$this->assertContains( 'analytics', $dependencies );
	}

	public function test_get_module_dependencies_exception() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module_slug = 'non-existent-module';

		$this->assertArrayNotHasKey( $module_slug, $modules->get_available_modules() );

		try {
			$modules->get_module_dependencies( $module_slug );
		} catch ( \Exception $exception ) {
			// We expect an exception to be thrown, let's make sure it's the right one.
			$this->assertStringContainsString( $module_slug, $exception->getMessage() );

			return;
		}

		$this->fail( 'Failed to catch exception thrown for non-existent module in get_module_dependencies.' );
	}

	public function test_module_exists() {
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );
		$this->assertTrue( $modules->module_exists( 'fake-module' ) );

		$module_slug = 'non-existent-module';
		$this->assertFalse( $modules->module_exists( $module_slug ) );
	}

	public function test_get_module_dependants() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertArrayHasKey( 'analytics', $modules->get_available_modules() );
		$dependants = $modules->get_module_dependants( 'analytics' );

		$this->assertContains( 'optimize', $dependants );
	}

	public function test_get_module_dependants_exception() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module_slug = 'non-existent-module';

		$this->assertArrayNotHasKey( $module_slug, $modules->get_available_modules() );

		try {
			$modules->get_module_dependants( $module_slug );
		} catch ( \Exception $exception ) {
			// We expect an exception to be thrown, let's make sure it's the right one.
			$this->assertStringContainsString( $module_slug, $exception->getMessage() );

			return;
		}

		$this->fail( 'Failed to catch exception thrown for non-existent module in get_module_dependants.' );
	}

	public function test_is_module_active() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		delete_option( Modules::OPTION_ACTIVE_MODULES );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		// Modules can be active by presence in active modules option
		$this->assertFalse( $modules->is_module_active( 'fake-module' ) );
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'fake-module' ) );
		$this->assertTrue( $modules->is_module_active( 'fake-module' ) );

		delete_option( Modules::OPTION_ACTIVE_MODULES );

		// Some modules are always active
		$this->assertFalse( $modules->is_module_active( 'fake-module' ) );
		$fake_module->set_force_active( true );
		$this->assertTrue( $modules->is_module_active( 'fake-module' ) );
	}

	public function test_is_module_connected() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$valid_module_slug = 'search-console';
		$this->assertArrayHasKey( $valid_module_slug, $modules->get_available_modules() );
		$this->assertTrue( $modules->is_module_connected( $valid_module_slug ) );

		$non_existent_module_slug = 'non-existent-module';
		$this->assertArrayNotHasKey( $non_existent_module_slug, $modules->get_available_modules() );
		$this->assertFalse( $modules->is_module_connected( $non_existent_module_slug ) );
	}

	public function test_activate_module() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Attempting to activate a non-existent module returns false
		$this->assertArrayNotHasKey( 'fake-module', $modules->get_available_modules() );
		$this->assertFalse( $modules->activate_module( 'fake-module' ) );

		$activation_invocations = 0;
		$fake_module            = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module->set_on_activation_callback(
			function () use ( &$activation_invocations ) {
				$activation_invocations++;
			}
		);

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		$this->assertNotContains( 'fake-module', get_option( Modules::OPTION_ACTIVE_MODULES, array() ) );
		$this->assertEquals( 0, $activation_invocations );
		$this->assertTrue( $modules->activate_module( 'fake-module' ) );
		$this->assertEquals( 1, $activation_invocations );
		$this->assertContains( 'fake-module', get_option( Modules::OPTION_ACTIVE_MODULES, array() ) );

		// Subsequent calls to activate an active module do not call the on_activation method
		$this->assertTrue( $modules->activate_module( 'fake-module' ) );
		$this->assertEquals( 1, $activation_invocations );
	}

	public function test_deactivate_module() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Attempting to deactivate a non-existent module returns false
		$this->assertArrayNotHasKey( 'fake-module', $modules->get_available_modules() );
		$this->assertFalse( $modules->deactivate_module( 'fake-module' ) );

		$deactivation_invocations = 0;
		$fake_module              = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module->set_on_deactivation_callback(
			function () use ( &$deactivation_invocations ) {
				$deactivation_invocations++;
			}
		);

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'fake-module' ) );

		$this->assertContains( 'fake-module', get_option( Modules::OPTION_ACTIVE_MODULES, array() ) );

		// Force-active modules cannot be deactivated
		$fake_module->set_force_active( true );
		$this->assertFalse( $modules->deactivate_module( 'fake-module' ) );
		$this->assertEquals( 0, $deactivation_invocations );
		$this->assertContains( 'fake-module', get_option( Modules::OPTION_ACTIVE_MODULES, array() ) );

		$fake_module->set_force_active( false );
		$this->assertTrue( $modules->deactivate_module( 'fake-module' ) );
		$this->assertEquals( 1, $deactivation_invocations );
		$this->assertNotContains( 'fake-module', get_option( Modules::OPTION_ACTIVE_MODULES, array() ) );

		// Subsequent calls to deactivate an inactive module do not call the on_deactivation method
		$this->assertTrue( $modules->deactivate_module( 'fake-module' ) );
		$this->assertEquals( 1, $deactivation_invocations );
	}

	public function test_analytics_connects_using_analytics_configuration() {
		remove_all_actions( 'googlesitekit_authorize_user' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$modules = new Modules( $context );
		$modules->register();

		$this->assertNotContains( 'analytics', $modules->get_active_modules() );

		do_action(
			'googlesitekit_authorize_user',
			array(
				'analytics_configuration' => array(),
			)
		);

		// Check that we don't activate the Analytics module if the analytics_configuration is not passed.
		$this->assertNotContains(
			'analytics',
			array_keys( $modules->get_active_modules() )
		);

		do_action(
			'googlesitekit_authorize_user',
			array(
				'analytics_configuration' => array(
					'ga_account_id'               => '12345678',
					'ua_property_id'              => 'UA-12345678-1',
					'ua_internal_web_property_id' => '13579',
					'ua_profile_id'               => '987654',
				),
			)
		);

		// The Analytics module should be activated now.
		$this->assertContains(
			'analytics',
			array_keys( $modules->get_active_modules() )
		);
	}

	/**
	 * @dataProvider provider_googlesitekit_available_modules_filter
	 *
	 * @param callable      $filter   The filter to be applied at `googlesitekit_available_modules`
	 * @param array<string> $expected An array with the keys of the expected modules
	 */
	public function test_googlesitekit_available_modules_filter( callable $filter, $expected ) {
		add_filter( 'googlesitekit_available_modules', $filter );

		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertCount( count( $expected ), array_keys( $modules->get_available_modules() ) );

		foreach ( $expected as $module_slug ) {
			$this->assertArrayHasKey( $module_slug, $modules->get_available_modules() );
		}
	}

	public function provider_googlesitekit_available_modules_filter() {
		$default_modules = array(
			Site_Verification::MODULE_SLUG,
			Search_Console::MODULE_SLUG,
			AdSense::MODULE_SLUG,
			Analytics::MODULE_SLUG,
			Analytics_4::MODULE_SLUG,
			PageSpeed_Insights::MODULE_SLUG,
			Optimize::MODULE_SLUG,
			Tag_Manager::MODULE_SLUG,
		);

		yield 'should return all the modules if filter does not change the modules keys' => array(
			function ( $modules ) {
				return $modules;
			},
			$default_modules,
		);

		yield 'should remove all the modules from the register, except the ones flagged as force active' => array(
			function ( $modules ) {
				return array();
			},
			array( Site_Verification::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);

		yield 'should remove all module if `false` is used on the filter, except the ones flagged as force active' => array(
			function ( $modules ) {
				return false;
			},
			array( Site_Verification::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);

		yield 'should remove all module if `null` is used on the filter, except the ones flagged as force active' => array(
			function ( $modules ) {
				return null;
			},
			array( Site_Verification::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);

		yield 'should remove all module if `0` is used on the filter,  except the ones flagged as force active' => array(
			function ( $modules ) {
				return 0;
			},
			array( Site_Verification::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);

		yield "should remove all module if `''` is used on the filter,  except the ones flagged as force active" => array(
			function ( $modules ) {
				return '';
			},
			array( Site_Verification::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);

		yield 'should enable only analytics, search console and forced active modules' => array(
			function ( $modules ) {
				return array( Analytics::MODULE_SLUG, Search_Console::MODULE_SLUG );
			},
			array( Site_Verification::MODULE_SLUG, Analytics::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);

		yield 'should ignore non existing modules, and include modules flagged as forced active' => array(
			function ( $modules ) {
				return array( 'apollo-landing', 'orbital-phase' );
			},
			array( Site_Verification::MODULE_SLUG, Search_Console::MODULE_SLUG ),
		);
	}

	/**
	 * @dataProvider provider_feature_flag_modules
	 *
	 * @param string        $feature_flag    The name of the feature flag we are switching.
	 * @param bool          $feature_enabled Wether the flag should be enabled or disabled using
	 *                                       `googlesitekit_is_feature_enabled`
	 * @param string        $module_slug     The slug of the module we are forcing via
	 *                                       `googlesitekit_available_modules`
	 * @param array<string> $expected        The array of expected module slugs.
	 */
	public function test_feature_flag_enabled_modules( $feature_flag, $feature_enabled, $module_slug, array $expected ) {
		// This is needed for Thank with Google.
		$_SERVER['HTTPS'] = 'on';

		add_filter(
			'googlesitekit_is_feature_enabled',
			function ( $is_enabled, $feature ) use ( $feature_flag, $feature_enabled ) {
				if ( $feature === $feature_flag ) {
					return $feature_enabled;
				}

				return $is_enabled;
			},
			10,
			2
		);

		add_filter(
			'googlesitekit_available_modules',
			function ( $modules ) use ( $module_slug ) {
				$modules[] = $module_slug;

				return $modules;
			}
		);

		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertCount( count( $expected ), array_keys( $modules->get_available_modules() ) );
		foreach ( $expected as $slug ) {
			$this->assertArrayHasKey( $slug, $modules->get_available_modules() );
		}

		// Reset HTTPs.
		unset( $_SERVER['HTTPS'] );
	}

	public function provider_feature_flag_modules() {
		$default_modules = array(
			Site_Verification::MODULE_SLUG,
			Search_Console::MODULE_SLUG,
			AdSense::MODULE_SLUG,
			Analytics::MODULE_SLUG,
			Analytics_4::MODULE_SLUG,
			PageSpeed_Insights::MODULE_SLUG,
			Optimize::MODULE_SLUG,
			Tag_Manager::MODULE_SLUG,
		);

		yield 'should include the `idea-hub` module when enabled' => array(
			// Module feature flag.
			'ideaHubModule',
			// Module enabled or disabled
			true,
			Idea_Hub::MODULE_SLUG,
			// Expected
			array_merge( $default_modules, array( Idea_Hub::MODULE_SLUG ) ),
		);

		yield 'should not include the `idea-hub` module when enabled' => array(
			// Module feature flag.
			'ideaHubModule',
			// Module enabled or disabled
			false,
			Idea_Hub::MODULE_SLUG,
			// Expected
			$default_modules,
		);

		yield 'should include the `thank-with-google` module when enabled' => array(
			// Module feature flag.
			'twgModule',
			// Module enabled or disabled
			true,
			Thank_With_Google::MODULE_SLUG,
			// Expected
			array_merge( $default_modules, array( Thank_With_Google::MODULE_SLUG ) ),
		);

		yield 'should not include the `thank-with-google` module when enabled' => array(
			// Module feature flag.
			'twgModule',
			// Module enabled or disabled
			false,
			Thank_With_Google::MODULE_SLUG,
			// Expected
			$default_modules,
		);
	}

	public function test_get_shareable_modules() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->enable_feature( 'dashboardSharing' );

		$shareable_active_modules = array_map( 'get_class', $modules->get_shareable_modules() );

		$this->assertEqualSetsWithIndex(
			array(
				'search-console'     => 'Google\\Site_Kit\\Modules\\Search_Console',
				'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
			),
			$shareable_active_modules
		);
	}

	public function test_get_shared_ownership_modules() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->enable_feature( 'ideaHubModule' );
		$this->enable_feature( 'dashboardSharing' );

		// Check shared ownership for modules activated by default.
		$modules = new Modules( $context );
		$this->assertEqualSetsWithIndex(
			array(
				'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
			),
			array_map(
				'get_class',
				$modules->get_shared_ownership_modules()
			)
		);

		// Activate modules.
		update_option(
			'googlesitekit-active-modules',
			array(
				'pagespeed-insights',
				'analytics',
				'idea-hub',
			)
		);

		// Connect the Idea Hub module.
		$options = new Options( $context );
		$options->set(
			Idea_Hub_Settings::OPTION,
			array( 'tosAccepted' => true )
		);

		// Verify shared ownership for active and connected modules.
		$modules = new Modules( $context );
		$this->assertEqualSetsWithIndex(
			array(
				'idea-hub'           => 'Google\\Site_Kit\\Modules\\Idea_Hub',
				'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
			),
			array_map(
				'get_class',
				$modules->get_shared_ownership_modules()
			)
		);

		// Activate non-sharable modules only.
		update_option(
			'googlesitekit-active-modules',
			array(
				'tagmanager',
			)
		);

		// Confirm that no modules are available with shared ownership.
		$modules = new Modules( $context );
		$this->assertEmpty(
			$modules->get_shared_ownership_modules()
		);
	}

	public function test_is_module_recoverable() {
		$this->enable_feature( 'dashboardSharing' );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$modules = new Modules( $context );

		// Checks an invalid module returns false.
		$this->assertFalse( $modules->is_module_recoverable( 'invalid-module' ) );

		// Checks Module isn't an instance of Module_With_Owner.
		$this->assertFalse( $modules->is_module_recoverable( 'site-verification' ) );

		// Tests with shared_roles
		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		// Checks modules that don't have shared roles.
		$this->assertFalse( $modules->is_module_recoverable( 'search-console' ) );
		$this->assertFalse( $modules->is_module_recoverable( 'pagespeed-insights' ) );
		// Checks modules that has an owner.
		$this->assertTrue( $modules->is_module_recoverable( 'analytics' ) );

		$this->assertTrue( $modules->is_module_recoverable( new Analytics( $context ) ) );

		$administrator = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$options       = new Options( $context );
		$options->set( 'googlesitekit_analytics_settings', array( 'ownerID' => $administrator->ID ) );

		$this->assertTrue( $modules->is_module_recoverable( 'analytics' ) );
		$administrator_auth = new Authentication( $context, null, new User_Options( $context, $administrator->ID ) );
		$administrator_auth->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		// Checks the default return false.
		$this->assertFalse( $modules->is_module_recoverable( 'analytics' ) );
	}

	private function setup_modules_to_test_rest_endpoint() {
		$user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user->ID );
		$modules      = new Modules( $context, $options, $user_options );
		wp_set_current_user( $user->ID );

		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_filters( 'googlesitekit_rest_routes' );

		$modules->register();
		return $modules;
	}

	public function test_check_access_rest_endpoint__no_get_method() {
		$this->setup_modules_to_test_rest_endpoint();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_no_route', $response->get_data()['code'] );
	}

	public function test_check_access_rest_endpoint__requires_module_slug() {
		$this->setup_modules_to_test_rest_endpoint();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__requires_module_connected() {
		$this->setup_modules_to_test_rest_endpoint();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'analytics',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_connected', $response->get_data()['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__shareable_module_does_not_have_service_entity() {
		$this->enable_feature( 'dashboardSharing' );
		$this->setup_modules_to_test_rest_endpoint();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'pagespeed-insights',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( true, $response->get_data()['access'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__unshareable_module_does_not_have_service_entity() {
		$modules = $this->setup_modules_to_test_rest_endpoint();

		$optimize = $modules->get_module( 'optimize' );
		$optimize->get_settings()->merge( array( 'optimizeID' => 'GTM-XXXXX' ) );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'optimize',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module', $response->get_data()['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__success() {
		$modules = $this->setup_modules_to_test_rest_endpoint();

		$analytics = $modules->get_module( 'analytics' );
		$analytics->get_client()->setHttpClient( new FakeHttpClient() );
		$analytics->get_settings()->merge(
			array(
				'accountID'             => '12345678',
				'profileID'             => '12345678',
				'propertyID'            => '987654321',
				'internalWebPropertyID' => '1234567890',
			)
		);

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'analytics',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertArrayIntersection(
			array(
				'access' => true,
			),
			$response->get_data()
		);
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_data_rest_endpoint__requires_active_module() {
		$modules     = $this->setup_modules_to_test_rest_endpoint();
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		delete_option( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( $modules->is_module_active( 'fake-module' ) );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'] );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'] );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$request->set_body_params(
			array(
				'data' => array(
					'foo' => 'bar',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'] );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'] );
	}

	public function test_data_rest_endpoint__success() {
		$modules     = $this->setup_modules_to_test_rest_endpoint();
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'fake-module' ) );
		$this->assertTrue( $modules->is_module_active( 'fake-module' ) );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsObject( $data );
		$this->assertEquals( 'GET', $data->method );
		$this->assertEquals( 'test-request', $data->datapoint );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$request->set_body_params(
			array(
				'data' => array(
					'foo' => 'bar',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsObject( $data );
		$this->assertEquals( 'POST', $data->method );
		$this->assertEquals( 'test-request', $data->datapoint );
	}

	public function test_recover_module_rest_endpoint__no_get_method() {
		$this->setup_modules_to_test_rest_endpoint();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_no_route', $response->get_data()['code'] );
	}

	public function test_recover_module_rest_endpoint__requires_module_slugs() {
		$this->setup_modules_to_test_rest_endpoint();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_param', $response->get_data()['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__invalid_module_slug() {
		$this->setup_modules_to_test_rest_endpoint();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'non-existent-module' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['error']['non-existent-module']['code'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__requires_shareable_module() {
		$this->setup_modules_to_test_rest_endpoint();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_shareable', $response->get_data()['error']['search-console']['code'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__requires_recoverable_module() {
		$this->enable_feature( 'dashboardSharing' );
		$this->setup_modules_to_test_rest_endpoint();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_recoverable', $response->get_data()['error']['search-console']['code'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__requires_accessible_module() {
		$this->enable_feature( 'dashboardSharing' );
		$modules = $this->setup_modules_to_test_rest_endpoint();

		// Make search-console a recoverable module
		$search_console = $modules->get_module( 'search-console' );
		$search_console->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);
		$test_sharing_settings = array(
			'search-console' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_accessible', $response->get_data()['error']['search-console']['code'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__success() {
		$this->enable_feature( 'dashboardSharing' );
		$modules = $this->setup_modules_to_test_rest_endpoint();

		// Make search-console a recoverable module
		$search_console = $modules->get_module( 'search-console' );
		$search_console->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);
		$test_sharing_settings = array(
			'search-console' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		// Make search-console service requests accessible
		$search_console->get_client()->setHttpClient( new FakeHttpClient() );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals(
			array(
				'success' => array(
					'search-console' => true,
				),
				'error'   => (object) array(),
			),
			$response->get_data()
		);
		$this->assertEquals( 200, $response->get_status() );
	}

	private function setup_all_admin_module_ownership_change() {
		$this->enable_feature( 'dashboardSharing' );
		$user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user->ID );
		$modules      = new Modules( $context, $options, $user_options );
		wp_set_current_user( $user->ID );

		// Activate modules.
		update_option(
			'googlesitekit-active-modules',
			array(
				'pagespeed-insights',
			)
		);

		$modules->register();
		$module = $modules->get_module( 'pagespeed-insights' );
		return array(
			$module->get_settings(),
			$user->ID,
		);
	}

	public function test_all_admin_module_ownership_change__add_settings() {
		list( $pagespeed_insights_settings, $first_admin_id ) = $this->setup_all_admin_module_ownership_change();

		$test_sharing_settings = array(
			'pagespeed-insights' => array(),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $first_admin_id );

		$second_admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $second_admin->ID );

		$test_updated_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $second_admin->ID );
	}

	public function test_all_admin_module_ownership_change__add_shared_roles() {
		list( $pagespeed_insights_settings, $first_admin_id ) = $this->setup_all_admin_module_ownership_change();

		$test_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $first_admin_id );

		$second_admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $second_admin->ID );

		// Test adding a new shared role updates the owner.
		$test_updated_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'editor' ),
				'management'  => 'owner',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $second_admin->ID );
	}

	public function test_all_admin_module_ownership_change__reorder_shared_roles() {
		list( $pagespeed_insights_settings, $first_admin_id ) = $this->setup_all_admin_module_ownership_change();

		$test_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $first_admin_id );

		$second_admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $second_admin->ID );

		// Test changing the order of shared roles does not update the owner.
		$test_updated_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'subscriber', 'editor' ),
				'management'  => 'owner',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $first_admin_id );
	}

	public function test_all_admin_module_ownership_change__remove_shared_roles() {
		list( $pagespeed_insights_settings, $first_admin_id ) = $this->setup_all_admin_module_ownership_change();

		$test_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $first_admin_id );

		$second_admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $second_admin->ID );

		// Test removing a shared role updates the owner.
		$test_updated_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'subscriber' ),
				'management'  => 'owner',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $second_admin->ID );
	}

	public function test_all_admin_module_ownership_change__update_management() {
		list( $pagespeed_insights_settings, $first_admin_id ) = $this->setup_all_admin_module_ownership_change();
		$settings = $pagespeed_insights_settings->get();

		$test_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $first_admin_id );

		$second_admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $second_admin->ID );

		$test_updated_sharing_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $pagespeed_insights_settings->get();
		$this->assertEquals( $settings['ownerID'], $second_admin->ID );
	}

	public function test_non_all_admin_module_ownership_change() {
		$this->enable_feature( 'dashboardSharing' );
		$user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user->ID );
		$modules      = new Modules( $context, $options, $user_options );
		wp_set_current_user( $user->ID );

		// Activate modules.
		update_option(
			'googlesitekit-active-modules',
			array(
				'analytics',
			)
		);

		$modules->register();

		$test_sharing_settings = array(
			'analytics' => array(),
		);
		$module                = $modules->get_module( 'analytics' );
		$settings              = $module->get_settings()->get();
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$this->assertEquals( $settings['ownerID'], 0 );

		$test_updated_sharing_settings = array(
			'analytics' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $module->get_settings()->get();
		$this->assertEquals( $settings['ownerID'], 0 );
	}

	public function test_non_all_admin_module_ownership_change_shared_roles() {
		$this->enable_feature( 'dashboardSharing' );
		$user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user->ID );
		$modules      = new Modules( $context, $options, $user_options );
		wp_set_current_user( $user->ID );

		// Activate modules.
		update_option(
			'googlesitekit-active-modules',
			array(
				'analytics',
			)
		);

		$modules->register();

		$test_sharing_settings = array(
			'analytics' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
		);
		$module                = $modules->get_module( 'analytics' );
		$settings              = $module->get_settings()->get();
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$this->assertEquals( $settings['ownerID'], 0 );

		$test_updated_sharing_settings = array(
			'analytics' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $module->get_settings()->get();
		$this->assertEquals( $settings['ownerID'], 0 );
	}

	public function test_non_all_admin_module_ownership_change_management() {
		$this->enable_feature( 'dashboardSharing' );
		$user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user->ID );
		$modules      = new Modules( $context, $options, $user_options );
		wp_set_current_user( $user->ID );

		// Activate modules.
		update_option(
			'googlesitekit-active-modules',
			array(
				'analytics',
			)
		);

		$modules->register();

		$test_sharing_settings = array(
			'analytics' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		$module                = $modules->get_module( 'pagespeed-insights' );
		$settings              = $module->get_settings()->get();
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$this->assertEquals( $settings['ownerID'], 0 );

		$test_updated_sharing_settings = array(
			'analytics' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		update_option( 'googlesitekit_dashboard_sharing', $test_updated_sharing_settings );

		$settings = $module->get_settings()->get();
		$this->assertEquals( $settings['ownerID'], 0 );
	}

	public function test_get_shareable_modules_owners() {
		$this->enable_feature( 'dashboardSharing' );

		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Activate modules.
		update_option(
			'googlesitekit-active-modules',
			array(
				'pagespeed-insights',
				'search-console',
				'analytics',
			)
		);

		// Add an owner for the search-console module.
		$search_console = $modules->get_module( 'search-console' );
		$search_console->get_settings()->merge(
			array(
				'propertyID' => '123456789',
				'ownerID'    => 1,
			)
		);

		// Connect the analytics module and give it an owner.
		$analytics = $modules->get_module( 'analytics' );
		$analytics->get_client()->setHttpClient( new FakeHttpClient() );
		$analytics->get_settings()->merge(
			array(
				'accountID'             => '12345678',
				'profileID'             => '12345678',
				'propertyID'            => '987654321',
				'internalWebPropertyID' => '1234567890',
				'ownerID'               => 2,
			)
		);

		$expected_module_owners = array(
			'search-console'     => 1,
			'analytics'          => 2,
			'pagespeed-insights' => 0,
		);
		$this->assertEqualSetsWithIndex( $expected_module_owners, $modules->get_shareable_modules_owners() );
	}

	public function test_shared_ownership_module_default_settings() {
		$this->enable_feature( 'dashboardSharing' );

		remove_all_filters( 'option_' . Module_Sharing_Settings::OPTION );
		remove_all_filters( 'default_option_' . Module_Sharing_Settings::OPTION );

		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$modules->register();

		$expected = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);

		$settings = apply_filters( 'option_' . Module_Sharing_Settings::OPTION, array() );
		$this->assertEqualSetsWithIndex( $expected, $settings );

		$settings = apply_filters( 'default_option_' . Module_Sharing_Settings::OPTION, array(), '', '' );
		$this->assertEqualSetsWithIndex( $expected, $settings );
	}

	public function test_delete_dashboard_sharing_settings() {
		$this->enable_feature( 'dashboardSharing' );

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$modules          = new Modules( $context );
		$sharing_settings = $modules->get_module_sharing_settings();

		$modules->register();

		$default_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);

		$settings = $sharing_settings->get();
		$this->assertEqualSets(
			$default_settings,
			$settings
		);

		$updated_settings = array(
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
		);

		$sharing_settings->set( $updated_settings );
		$settings = $sharing_settings->get();
		$this->assertEqualSets(
			$updated_settings,
			$settings
		);

		$modules->delete_dashboard_sharing_settings();
		$settings = $sharing_settings->get();
		$this->assertEqualSets(
			$default_settings,
			$settings
		);
	}

}
