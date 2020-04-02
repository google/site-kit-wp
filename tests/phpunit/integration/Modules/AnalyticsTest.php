<?php
/**
 * AnalyticsTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Screen_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class AnalyticsTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Screen_ContractTests;
	use Module_With_Settings_ContractTests;

	public function test_register() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_module_screens' );
		remove_all_filters( 'googlesitekit_analytics_adsense_linked' );

		$analytics->register();

		// Test registers scopes.
		$this->assertEquals(
			$analytics->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);

		// Test registers screen.
		$this->assertContains(
			$analytics->get_screen(),
			apply_filters( 'googlesitekit_module_screens', array() )
		);

		$this->assertFalse( get_option( 'googlesitekit_analytics_adsense_linked' ) );
		$this->assertFalse( $analytics->is_connected() );
	}

	public function test_prepare_info_for_js() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $analytics->prepare_info_for_js();

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

		$this->assertEquals( 'analytics', $info['slug'] );
		$this->assertArrayHasKey( 'accountID', $info['settings'] );
		$this->assertArrayHasKey( 'propertyID', $info['settings'] );
		$this->assertArrayHasKey( 'profileID', $info['settings'] );
		$this->assertArrayHasKey( 'internalWebPropertyID', $info['settings'] );
		$this->assertArrayHasKey( 'useSnippet', $info['settings'] );
		$this->assertArrayHasKey( 'trackingDisabled', $info['settings'] );
	}

	public function test_is_connected() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Requires get_data to be connected.
		$this->assertFalse( $analytics->is_connected() );
	}

	public function test_scopes() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics',
				'https://www.googleapis.com/auth/analytics.readonly',
				'https://www.googleapis.com/auth/analytics.manage.users',
				'https://www.googleapis.com/auth/analytics.edit',
				'https://www.googleapis.com/auth/analytics.provision',
			),
			$analytics->get_scopes()
		);
	}

	public function test_on_deactivation() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options   = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );
		$options->set( 'googlesitekit_analytics_adsense_linked', 'test-linked-value' );

		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
		$this->assertOptionNotExists( 'googlesitekit_analytics_adsense_linked' );
	}

	public function test_get_datapoints() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'connection',
				'account-id',
				'property-id',
				'profile-id',
				'internal-web-property-id',
				'use-snippet',
				'create-account-ticket',
				'goals',
				'accounts-properties-profiles',
				'properties-profiles',
				'profiles',
				'tag-permission',
				'report',
				'settings',
				'tracking-disabled',
				'anonymize-ip',
			),
			$analytics->get_datapoints()
		);
	}

	public function test_amp_data_load_analytics_component() {
		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$analytics->register();

		$data = array( 'amp_component_scripts' => array() );

		$result = apply_filters( 'amp_post_template_data', $data );
		$this->assertSame( $data, $result );

		$analytics->set_data( 'use-snippet', array( 'useSnippet' => true ) );
		$analytics->set_data( 'property-id', array( 'propertyID' => '12345678' ) );

		$result = apply_filters( 'amp_post_template_data', $data );
		$this->assertArrayHasKey( 'amp-analytics', $result['amp_component_scripts'] );
	}

	/**
	 * @dataProvider tracking_disabled_provider
	 *
	 * @param array $settings
	 * @param bool $logged_in
	 * @param \Closure $assert_opt_out_presence
	 */
	public function test_tracking_disabled( $settings, $logged_in, $assert_opt_out_presence ) {
		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();
		remove_all_actions( 'wp_enqueue_scripts' );
		// Remove irrelevant script from throwing errors in CI from readfile().
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		// Set the current user (can be 0 for no user)
		wp_set_current_user( $logged_in ? $this->factory()->user->create() : 0 );

		$analytics = new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$analytics->register();
		$analytics->set_data( 'settings', $settings );

		$head_html = $this->capture_action( 'wp_head' );
		// Sanity check.
		$this->assertNotEmpty( $head_html );
		// Whether or not tracking is disabled does not affect output of snippet.
		if ( $settings['useSnippet'] ) {
			$this->assertContains( "id={$settings['propertyID']}", $head_html );
		} else {
			$this->assertNotContains( "id={$settings['propertyID']}", $head_html );
		}

		$assert_opt_out_presence( $head_html );
	}

	public function tracking_disabled_provider() {
		$base_settings = array(
			'accountID'             => 123456789,
			'propertyID'            => 'UA-21234567-8',
			'internalWebPropertyID' => 212345678,
			'profileID'             => 321234567,
			'useSnippet'            => true,
			'trackingDisabled'      => array( 'loggedinUsers' ),
		);

		$assert_contains_opt_out     = function ( $html ) {
			$this->assertContains( 'ioo : function() { return true', $html );
		};
		$assert_not_contains_opt_out = function ( $html ) {
			$this->assertNotContains( 'ioo : function() { return true', $html );
		};

		return array(
			// Tracking is active by default for non-logged-in users.
			array(
				$base_settings,
				false,
				$assert_not_contains_opt_out,
			),
			// Tracking is not active for non-logged-in users if snippet is disabled,
			// but opt-out is not added because tracking is not disabled.
			array(
				array_merge( $base_settings, array( 'useSnippet' => false ) ),
				false,
				$assert_not_contains_opt_out,
			),
			// Tracking is not active for logged-in users by default (opt-out expected).
			array(
				$base_settings,
				true,
				$assert_contains_opt_out,
			),
			// Tracking is not active if snippet is disabled for logged in users,
			// but opt-out is not added because tracking is not disabled.
			array(
				array_merge( $base_settings, array( 'useSnippet' => false ) ),
				true,
				$assert_contains_opt_out,
			),
			// Tracking is active for logged-in users if enabled via settings.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array() ) ),
				true,
				$assert_not_contains_opt_out,
			),
			// Tracking is still active for guests if disabled for logged in users.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array( 'loggedinUsers' ) ) ),
				false,
				$assert_not_contains_opt_out,
			),
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Screen
	 */
	protected function get_module_with_screen() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Analytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
