<?php
/**
 * AdsTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\Ads\Settings;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_User;

/**
 * @group Modules
 * @group Ads
 */
class AdsTest extends TestCase {

	private $user_id;

	/**
	 * Ads object.
	 *
	 * @var Ads
	 */
	private $ads;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Authentication
	 */
	protected $authentication;
	use Fake_Site_Connection_Trait;

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		$this->user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $context );
		$this->user_options   = new User_Options( $context, $this->user_id );
		$this->authentication = new Authentication( $context, $this->options, $this->user_options );
		$this->ads            = new Ads( $context, $this->options, $this->user_options, $this->authentication );

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$this->authentication->verification()->set( true );

		$this->fake_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		self::enable_feature( 'adsPax' );
	}

	public function test_magic_methods() {
		$this->assertEquals( 'ads', $this->ads->slug );
		$this->assertEquals( 'Ads', $this->ads->name );
		$this->assertEquals( 'https://google.com/ads', $this->ads->homepage );
	}

	public function test_register() {
		remove_all_actions( 'template_redirect' );
		remove_all_filters( 'googlesitekit_inline_modules_data' );

		$this->ads->register();

		$this->assertTrue( has_action( 'template_redirect' ) );
		$this->assertTrue( has_filter( 'googlesitekit_inline_modules_data' ) );
	}

	public function test_is_connected__when_ads_conversion_id_is_set() {
		$this->assertFalse( $this->ads->is_connected() );

		$this->ads->get_settings()->set(
			array( 'conversionID' => 'AW-123456789' )
		);

		$this->assertTrue( $this->ads->is_connected() );
	}

	public function test_setup_assets() {
		$reflection = new \ReflectionClass( get_class( $this->ads ) );

		$setup_assets = $reflection->getMethod( 'setup_assets' );
		$setup_assets->setAccessible( true );

		$assets = $setup_assets->invokeArgs( $this->ads, array() );

		// Main ads script and googlesitekit-ads-pax-config should be registered.
		$this->assertEquals( count( $assets ), 2 );

		$this->ads->get_settings()->set(
			array(
				'conversionID' => 'AW-123456789',
				'ownerID'      => $this->user_id,
			)
		);

		$assets = $setup_assets->invokeArgs( $this->ads, array() );

		// Once Ads module is active and user has proper VIEW_AUTHENTICATED_DASHBOARD capability,
		// all pax scripts should be registered together with main module's JS file.
		$this->assertEquals( count( $assets ), 3 );
	}

	public function test_inline_modules_data__module_not_connected() {
		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayNotHasKey( 'ads', $inline_modules_data );
	}

	public function test_inline_modules_data__module_connected() {
		$this->ads->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'conversionID' => 'AW-12345',
			)
		);

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals(
			array(
				'supportedConversionEvents' => array(),
			),
			$inline_modules_data['ads']
		);
	}

	public function test_settings__reset_on_deactivation() {
		$this->ads->get_settings()->set( array( 'conversionID' => 'AW-123456789' ) );

		$this->ads->on_deactivation();

		$ads_settings = $this->ads->get_settings()->get();

		$this->assertFalse( $ads_settings );
	}

	public function test_get_debug_fields() {
		$this->ads->get_settings()->set( array( 'conversionID' => 'AW-123456789' ) );

		$this->assertEqualSets(
			array(
				'conversion_tracking_id',
			),
			array_keys( $this->ads->get_debug_fields() )
		);

		$this->assertEquals(
			array(
				'conversion_tracking_id' => array(
					'label' => 'Conversion Tracking ID',
					'value' => 'AW-123456789',
					'debug' => 'AW-1••••••••',
				),
			),
			$this->ads->get_debug_fields()
		);
	}

	/**
	 * @dataProvider template_redirect_data_provider
	 *
	 * @param array $settings
	 */
	public function test_template_redirect( $settings ) {
		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag() )->register();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		remove_all_actions( 'template_redirect' );
		$this->ads->register();
		$this->ads->get_settings()->set( $settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html );

		if ( empty( $settings['conversionID'] ) ) {
			$this->assertFalse( has_action( 'googlesitekit_setup_gtag' ) );
			$this->assertStringNotContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
			);
		} else {
			$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );
			$this->assertStringContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
			);
		}
	}

	public function template_redirect_data_provider() {
		return array(
			'empty ads conversion ID' => array( array( 'conversionID' => '' ) ),
			'valid ads conversion ID' => array( array( 'conversionID' => 'AW-123456789' ) ),
		);
	}

}
