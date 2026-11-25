<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\Server_Events_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Server_Events_Guard;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Server_Events_GuardTest extends TestCase {

	/**
	 * Plugin context, whose input reads `$_COOKIE` and `$_SERVER` at each call.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 module instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @var Conversion_Tracking_Settings
	 */
	private $conversion_tracking_settings;

	/**
	 * Measurement_Protocol_Settings instance that reads and writes the same option as the module's own instance.
	 *
	 * @var Measurement_Protocol_Settings
	 */
	private $measurement_protocol_settings;

	public function set_up() {
		parent::set_up();

		$this->context                       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$options                             = new Options( $this->context );
		$this->analytics                     = new Analytics_4( $this->context, $options );
		$this->conversion_tracking_settings  = new Conversion_Tracking_Settings( $options );
		$this->measurement_protocol_settings = new Measurement_Protocol_Settings( new Encrypted_Options( $options ) );

		$this->analytics->get_settings()->merge(
			array(
				'accountID'        => '12345678',
				'propertyID'       => '123456789',
				'webDataStreamID'  => '987654321',
				'measurementID'    => 'G-ABC123',
				'useSnippet'       => true,
				'trackingDisabled' => array( 'loggedinUsers' ),
			)
		);
		$this->conversion_tracking_settings->set( array( 'enabled' => true ) );
		$this->store_secret();
	}

	public function tear_down() {
		// `WP_UnitTestCase_Base` resets neither `$_COOKIE` nor these headers, so they would leak into later tests.
		$_COOKIE = array();
		unset( $_SERVER['HTTP_SEC_PURPOSE'], $_SERVER['HTTP_PURPOSE'], $_SERVER['HTTP_X_MOZ'] );

		parent::tear_down();
	}

	public function test_can_send__every_check_passes() {
		$this->assertTrue( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be allowed when every check passes.' );
	}

	/**
	 * @dataProvider data_settings_that_fail_a_check
	 *
	 * @param array $settings Analytics 4 settings that make one request check fail.
	 */
	public function test_can_send__settings_that_fail_a_check( $settings ) {
		$this->analytics->get_settings()->merge( $settings );
		// The stored secret follows the new settings, so that only the check under test fails.
		$this->store_secret();

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused when the Analytics settings fail a check.' );
	}

	public function data_settings_that_fail_a_check() {
		return array(
			'not connected'                             => array( array( 'accountID' => '' ) ),
			'a `propertyID` of letters'                 => array( array( 'propertyID' => 'abc' ) ),
			'a `propertyID` with a trailing newline'    => array( array( 'propertyID' => "123456789\n" ) ),
			'a Universal Analytics `measurementID`'     => array( array( 'measurementID' => 'UA-123' ) ),
			'a `measurementID` with a trailing newline' => array( array( 'measurementID' => "G-ABC123\n" ) ),
			'`useSnippet` off'                          => array( array( 'useSnippet' => false ) ),
		);
	}

	public function test_can_send__conversion_tracking_off() {
		$this->conversion_tracking_settings->set( array( 'enabled' => false ) );

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused while conversion tracking is off.' );
	}

	public function test_can_send__no_secret() {
		$this->measurement_protocol_settings->delete();

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused when no Measurement Protocol secret is stored.' );
	}

	public function test_can_send__tag_blocked() {
		add_filter( 'googlesitekit_analytics-4_tag_blocked', '__return_true' );

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused when the `googlesitekit_analytics-4_tag_blocked` filter blocks the tag.' );
	}

	public function test_can_send__environment_type_not_allowed() {
		if ( ! function_exists( 'wp_get_environment_type' ) ) {
			$this->markTestSkipped( 'Missing wp_get_environment_type() function.' );
		}

		$environment_type = wp_get_environment_type();
		add_filter(
			'googlesitekit_allowed_tag_environment_types',
			fn () => array_values( array_diff( array( 'local', 'development', 'staging', 'production' ), array( $environment_type ) ) )
		);

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused in an environment type where Site Kit places no tag.' );
	}

	public function test_can_send__logged_in_user_with_logged_in_users_excluded() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused for a logged-in user while `loggedinUsers` is set.' );
	}

	public function test_can_send__statistics_consent_denied() {
		$_COOKIE['custom_consent_statistics'] = 'deny';

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event should be refused when the visitor denied statistics consent.' );
	}

	/**
	 * @dataProvider data_statistics_consent_not_denied
	 *
	 * @param array       $cookies             Cookies of the request.
	 * @param string|null $consent_cookie_name Name of the statistics cookie, or null without the WP Consent API.
	 */
	public function test_can_send__statistics_consent_not_denied( $cookies, $consent_cookie_name ) {
		$_COOKIE = $cookies;

		$this->assertTrue( $this->create_guard( $consent_cookie_name )->can_send( 'sign_up:user:1' ), 'An event should be allowed unless the visitor denied statistics consent.' );
	}

	public function data_statistics_consent_not_denied() {
		return array(
			'an `allow` cookie'                          => array( array( 'custom_consent_statistics' => 'allow' ), 'custom_consent_statistics' ),
			'a `deny` cookie without the WP Consent API' => array( array( 'custom_consent_statistics' => 'deny' ), null ),
		);
	}

	public function test_can_send__without_the_wp_consent_api() {
		$args = $this->get_guard_args();
		// The real input passes the cookie name to `filter_input()`, which PHP 8.1 deprecates for `null`, so this test fails if the guard reads the cookie without a name.
		$args[0] = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$guard   = new Server_Events_Guard( ...$args );

		$this->assertTrue( $guard->can_send( 'sign_up:user:1' ), 'An event should be allowed on a site without the WP Consent API.' );
	}

	public function test_can_send__keeps_the_tracking_exclusion_stored_at_init() {
		$guard = $this->create_guard();
		remove_all_actions( 'init' );
		$guard->register();
		do_action( 'init' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertTrue( $guard->can_send( 'sign_up:user:1' ), 'The event of a visitor that a registration logs in after `init` should still be allowed.' );
	}

	public function test_can_send__stores_the_tracking_exclusion_at_the_end_of_init() {
		$guard   = $this->create_guard();
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		remove_all_actions( 'init' );
		// The last other callback of `init` logs the visitor in, so a value stored before it would allow their event.
		add_action( 'init', fn () => wp_set_current_user( $user_id ), PHP_INT_MAX - 1 );
		$guard->register();
		do_action( 'init' );

		wp_set_current_user( 0 );

		$this->assertFalse( $guard->can_send( 'sign_up:user:1' ), 'An event should be refused for a visitor that another `init` callback logs in.' );
	}

	public function test_can_send__keeps_the_first_tracking_exclusion_of_the_request() {
		$guard = $this->create_guard();

		$this->assertTrue( $guard->can_send( 'sign_up:user:1' ), 'The first event of a logged-out visitor should be allowed.' );

		// A registration can log the new user in between two of its events, before `init` ends.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertTrue( $guard->can_send( 'sign_up:user:2' ), 'A later event of the request should still be allowed after the registration logs the visitor in.' );
	}

	public function test_can_send__runs_the_request_checks_once() {
		$guard = $this->create_guard();
		$calls = 0;
		add_filter(
			'googlesitekit_analytics-4_tag_blocked',
			function ( $blocked ) use ( &$calls ) {
				++$calls;

				return $blocked;
			}
		);

		$guard->can_send( 'sign_up:user:1' );
		$guard->can_send( 'sign_up:user:2' );

		$this->assertSame( 1, $calls, 'The request checks should run once a request.' );
	}

	public function test_can_send__cron() {
		add_filter( 'wp_doing_cron', '__return_true' );

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event of a WP-Cron request should be refused.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_can_send__wp_cli() {
		define( 'WP_CLI', true );

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event of a WP-CLI command should be refused.' );
	}

	public function test_can_send__action_scheduler_queue() {
		$guard    = $this->create_guard();
		$can_send = null;
		add_action(
			'action_scheduler_run_queue',
			function () use ( $guard, &$can_send ) {
				$can_send = $guard->can_send( 'sign_up:user:1' );
			}
		);

		do_action( 'action_scheduler_run_queue', 'Async Request' );

		$this->assertFalse( $can_send, 'An event of a job that Action Scheduler runs should be refused.' );
	}

	/**
	 * @dataProvider data_prefetch_headers
	 *
	 * @param string $header Name of the header in `$_SERVER`.
	 * @param string $value  Value of the header.
	 */
	public function test_can_send__prefetch_request( $header, $value ) {
		$_SERVER[ $header ] = $value;

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'An event of a prefetch request should be refused.' );
	}

	public function data_prefetch_headers() {
		return array(
			'`Sec-Purpose: prefetch`'           => array( 'HTTP_SEC_PURPOSE', 'prefetch' ),
			'`Sec-Purpose: prefetch;prerender`' => array( 'HTTP_SEC_PURPOSE', 'prefetch;prerender' ),
			'`Purpose: prefetch`'               => array( 'HTTP_PURPOSE', 'prefetch' ),
			'`X-Moz: prefetch`'                 => array( 'HTTP_X_MOZ', 'prefetch' ),
		);
	}

	public function test_can_send__comment_by_someone_who_can_edit_it() {
		$this->exclude_no_user();
		$post_id         = self::factory()->post->create();
		$editor_id       = self::factory()->user->create( array( 'role' => 'editor' ) );
		$subscriber_id   = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$editor_comment  = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'user_id'         => $editor_id,
			)
		);
		$visitor_comment = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'user_id'         => $subscriber_id,
			)
		);
		$guard           = $this->create_guard();

		wp_set_current_user( $editor_id );
		$this->assertFalse( $guard->can_send( "comment_submit:comment:{$editor_comment}" ), 'A comment by someone who can edit it should send no event.' );

		wp_set_current_user( $subscriber_id );
		$this->assertTrue( $guard->can_send( "comment_submit:comment:{$visitor_comment}" ), 'A comment by a subscriber should send its event in the same request.' );
	}

	public function test_can_send__comment_by_an_author() {
		$this->exclude_no_user();
		$author_id     = self::factory()->user->create( array( 'role' => 'author' ) );
		$own_post_id   = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$other_post_id = self::factory()->post->create();
		$own_comment   = self::factory()->comment->create(
			array(
				'comment_post_ID' => $own_post_id,
				'user_id'         => $author_id,
			)
		);
		$other_comment = self::factory()->comment->create(
			array(
				'comment_post_ID' => $other_post_id,
				'user_id'         => $author_id,
			)
		);
		$guard         = $this->create_guard();
		wp_set_current_user( $author_id );

		$this->assertFalse( $guard->can_send( "comment_submit:comment:{$own_comment}" ), 'A comment on the author\'s own post, which they can edit, should send no event.' );
		$this->assertTrue( $guard->can_send( "comment_submit:comment:{$other_comment}" ), 'A comment on another author\'s post, which they can\'t edit, should send its event.' );
	}

	public function test_can_send__account_created_by_someone_who_can_create_users() {
		$this->exclude_no_user();
		$admin_id    = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$editor_id   = self::factory()->user->create( array( 'role' => 'editor' ) );
		$new_user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		if ( is_multisite() ) {
			// On multisite, only a super admin can create users, unless the network lets site admins add them.
			grant_super_admin( $admin_id );
		}
		$guard = $this->create_guard();

		wp_set_current_user( $admin_id );
		$this->assertFalse( $guard->can_send( "sign_up:user:{$new_user_id}" ), 'An account created by someone who can create users should send no event.' );

		wp_set_current_user( $editor_id );
		$this->assertTrue( $guard->can_send( "sign_up:user:{$new_user_id}" ), 'An account created by someone who can\'t create users should send its event.' );

		wp_set_current_user( 0 );
		$this->assertTrue( $guard->can_send( "sign_up:user:{$new_user_id}" ), 'An account that a logged-out visitor created should send its event.' );
	}

	public function test_can_send__download_by_an_administrator() {
		$this->exclude_no_user();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->assertTrue( $this->create_guard()->can_send( 'product_download:download:1' ), 'A download should send its event, whoever makes it.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_can_send__amp_form_submission() {
		$amp_http = new class() {
			/**
			 * Query vars that the AMP plugin moved out of the request.
			 *
			 * @var array
			 */
			public static $purged_amp_query_vars = array();
		};
		class_alias( get_class( $amp_http ), 'AMP_HTTP' );

		$this->assertTrue( $this->create_guard()->can_send( 'sign_up:user:1' ), 'A request with no AMP form mark should send its event.' );

		\AMP_HTTP::$purged_amp_query_vars['_wp_amp_action_xhr_converted'] = '1';

		$this->assertFalse( $this->create_guard()->can_send( 'sign_up:user:1' ), 'A form that the AMP plugin sent from an AMP page should send no event.' );
	}

	public function test_get_consent_cookie_name__without_the_wp_consent_api() {
		$guard = new Server_Events_Guard( ...$this->get_guard_args() );

		$this->assertNull( $this->get_accessible_method( $guard, 'get_consent_cookie_name' )->invoke( $guard ), 'There should be no statistics cookie to read without the WP Consent API.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_get_consent_cookie_name__with_the_wp_consent_api() {
		$this->load_wp_consent_api_stub();
		\WP_Consent_API::$config = new class() {
			public function consent_cookie_prefix() {
				return 'custom_consent';
			}
		};

		$guard       = new Server_Events_Guard( ...$this->get_guard_args() );
		$cookie_name = $this->get_accessible_method( $guard, 'get_consent_cookie_name' )->invoke( $guard );

		// A failed `assertSame()` adds a `ComparisonFailure` whose trace has this test case and its closures, which PHPUnit can't send out of a separate process.
		$this->assertTrue( 'custom_consent_statistics' === $cookie_name, "The cookie name should be the prefix of the WP Consent API, then `_statistics`, not `{$cookie_name}`." );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_get_consent_cookie_name__without_the_wp_consent_api_config() {
		$this->load_wp_consent_api_stub();
		$guard = new Server_Events_Guard( ...$this->get_guard_args() );

		$this->assertNull( $this->get_accessible_method( $guard, 'get_consent_cookie_name' )->invoke( $guard ), 'There should be no statistics cookie to read before the WP Consent API sets its config.' );
	}

	/**
	 * Loads a stub of the main class of the WP Consent API, with no config yet.
	 *
	 * A class alias stays until its process ends, so only a test that runs in a separate process calls this.
	 */
	private function load_wp_consent_api_stub() {
		$wp_consent_api = new class() {
			/**
			 * Config of the WP Consent API.
			 *
			 * @var object|null
			 */
			public static $config;
		};

		class_alias( get_class( $wp_consent_api ), 'WP_Consent_API' );
	}

	/**
	 * Turns the tracking exclusions off, so that only the event checks decide the event of a logged-in user.
	 */
	private function exclude_no_user() {
		$this->analytics->get_settings()->merge( array( 'trackingDisabled' => array() ) );
	}

	/**
	 * Stores a Measurement Protocol secret for the property and web data stream of the current settings.
	 */
	private function store_secret() {
		$settings = $this->analytics->get_settings()->get();

		$this->measurement_protocol_settings->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => $settings['propertyID'],
				'webDataStreamID' => $settings['webDataStreamID'],
				'secretID'        => 'test-secret-id',
			)
		);
	}

	/**
	 * Gets the arguments of the guard's constructor.
	 *
	 * @return array Arguments of `Server_Events_Guard::__construct()`.
	 */
	private function get_guard_args() {
		return array(
			$this->context,
			$this->analytics,
			$this->conversion_tracking_settings,
			$this->analytics->get_measurement_protocol_secret(),
			$this->analytics->get_tracking_exclusions(),
		);
	}

	/**
	 * Creates a `Server_Events_Guard` with a fixed statistics cookie name, so that a test needs no WP Consent API.
	 *
	 * @param string|null $consent_cookie_name Name of the statistics cookie, or null without the WP Consent API.
	 * @return Server_Events_Guard Instance under test.
	 */
	private function create_guard( $consent_cookie_name = 'custom_consent_statistics' ) {
		return new class( $consent_cookie_name, ...$this->get_guard_args() ) extends Server_Events_Guard {
			/**
			 * Name of the statistics cookie.
			 *
			 * @var string|null
			 */
			private $consent_cookie_name;

			/**
			 * Constructor.
			 *
			 * @param string|null $consent_cookie_name Name of the statistics cookie.
			 * @param mixed       ...$args             Arguments of `Server_Events_Guard::__construct()`.
			 */
			public function __construct( $consent_cookie_name, ...$args ) {
				$this->consent_cookie_name = $consent_cookie_name;
				parent::__construct( ...$args );
			}

			protected function get_consent_cookie_name() {
				return $this->consent_cookie_name;
			}
		};
	}
}
