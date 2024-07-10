<?php
/**
 * TestCase class.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Closure;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Tests\Exception\RedirectException;
use PHPUnit_Framework_MockObject_MockObject;
use WP_UnitTestCase;

class TestCase extends WP_UnitTestCase {
	// Do not preserve global state since it doesn't support closures within globals.
	protected $preserveGlobalState = false;

	protected static $featureFlagsConfig;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		if ( ! self::$featureFlagsConfig ) {
			self::$featureFlagsConfig = json_decode(
				file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'feature-flags.json' ),
				true
			);
		}

		self::reset_feature_flags();
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();
		self::reset_feature_flags();
	}

	protected static function reset_feature_flags() {
		Feature_Flags::set_features( self::$featureFlagsConfig );
	}

	/**
	 * Runs the routine before each test is executed.
	 */
	public function set_up() {
		parent::set_up();

		// At this point all hooks are isolated between tests.

		/**
		 * Catch redirections with an exception.
		 * This prevents subsequent calls to exit/die and allows us to make assertions about the redirect.
		 */
		add_filter(
			'wp_redirect_status',
			function ( $status, $location ) { // phpcs:ignore WordPressVIPMinimum.Hooks.AlwaysReturnInFilter.MissingReturnStatement
				$e = new RedirectException( "Intercepted attempt to redirect to $location" );
				$e->set_location( $location );
				$e->set_status( $status );
				throw $e;
			},
			10,
			2
		);
	}

	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tear_down() {
		parent::tear_down();
		// Clear screen related globals.
		unset( $GLOBALS['current_screen'], $GLOBALS['taxnow'], $GLOBALS['typenow'] );
	}

	/**
	 * Enables a feature.
	 *
	 * @param string $feature Feature to enable.
	 * @return Closure Function to reset the enabled state.
	 */
	protected function enable_feature( $feature ) {
		$enable_callback = function ( $enabled, $feature_name ) use ( $feature ) {
			if ( $feature_name === $feature ) {
				return true;
			}
			return $enabled;
		};

		add_filter( 'googlesitekit_is_feature_enabled', $enable_callback, 10, 2 );

		return function () use ( $enable_callback ) {
			remove_filter( 'googlesitekit_is_feature_enabled', $enable_callback, 10 );
		};
	}

	/**
	 * Forcibly set a property of an object that would otherwise not be possible.
	 *
	 * @param object|string $class_instance Class instance to set the property on, or class name containing the property.
	 * @param string $property Property name
	 * @param mixed $value New value to assign the property
	 *
	 * @throws \ReflectionException
	 */
	protected function force_set_property( $class_instance, $property, $value ) {
		$reflection_property = new \ReflectionProperty( $class_instance, $property );
		$reflection_property->setAccessible( true );
		$reflection_property->setValue( $class_instance, $value );
	}

	/**
	 * Forcibly get a property's value from an object that would otherwise not be possible.
	 *
	 * @param object|string $class_instance Class instance to get the property from, or class name containing the property.
	 * @param string $property Property name
	 *
	 * @return mixed
	 * @throws \ReflectionException
	 */
	protected function force_get_property( $class_instance, $property ) {
		$reflection_property = new \ReflectionProperty( $class_instance, $property );
		$reflection_property->setAccessible( true );

		return $reflection_property->getValue( $class_instance );
	}

	/**
	 * Get the current TestCase instance.
	 *
	 * @see TestCase_Context_Trait
	 *
	 * @return TestCase
	 */
	protected function get_testcase() {
		return $this;
	}

	/**
	 * Capture the output of an action.
	 *
	 * @param string $tag The name of the action to be executed.
	 * @param mixed $arg,... Optional. Additional arguments which are passed on to the
	 *                        functions hooked to the action. Default empty.
	 *
	 * @return false|string
	 */
	protected function capture_action( $tag, $arg = '' ) {
		ob_start();

		call_user_func_array( 'do_action', func_get_args() );

		return ob_get_clean();
	}

	/**
	 * Gets a mock Context instance fixed to a primary AMP mode.
	 *
	 * @param string $main_file Main file for Context to use. Defaults to main plugin file.
	 * @param Input  $input     Input instance. Defaults to new Input.
	 * @return Context
	 */
	protected function get_amp_primary_context( $main_file = GOOGLESITEKIT_PLUGIN_MAIN_FILE, $input = null ) {
		$mock_context = $this->new_mock_amp_context( $main_file, $input );
		$mock_context->method( 'is_amp' )->willReturn( true );
		$mock_context->method( 'get_amp_mode' )->willReturn( Context::AMP_MODE_PRIMARY );

		return $mock_context;
	}

	/**
	 * Gets a mock Context instance fixed to a secondary AMP mode.
	 *
	 * @param string $main_file Main file for Context to use. Defaults to main plugin file.
	 * @param Input  $input     Input instance. Defaults to new Input.
	 * @return Context
	 */
	protected function get_amp_secondary_context( $main_file = GOOGLESITEKIT_PLUGIN_MAIN_FILE, $input = null ) {
		$mock_context = $this->new_mock_amp_context( $main_file, $input );
		$mock_context->method( 'is_amp' )->willReturn( true );
		$mock_context->method( 'get_amp_mode' )->willReturn( Context::AMP_MODE_SECONDARY );

		return $mock_context;
	}

	/**
	 * Creates a new mock AMP Context instance.
	 *
	 * @param mixed ...$args Constructor arguments to pass to the mocked Context.
	 * @return PHPUnit_Framework_MockObject_MockObject
	 */
	private function new_mock_amp_context( ...$args ) {
		return $this->getMockBuilder( Context::class )
					->setConstructorArgs( $args )
					->setMethods( array( 'is_amp', 'get_amp_mode' ) )
					->getMock();
	}

	protected function network_activate_site_kit() {
		add_filter(
			'pre_site_option_active_sitewide_plugins',
			function () {
				return array( GOOGLESITEKIT_PLUGIN_BASENAME => true );
			}
		);
	}

	/**
	 * Asserts that the associative array subset is within the given array.
	 *
	 * Replacement for PHPUnit's deprecated assertArraySubset in PHPUnit 8.
	 *
	 * @param array  $subset            Partial array.
	 * @param array  $array_to_check    Array to check includes the partial.
	 * @param string $message Optional. Message to display when the assertion fails.
	 */
	protected function assertArrayIntersection( array $subset, array $array_to_check, $message = '' ) {
		$intersection = array_intersect_key( $array_to_check, $subset );

		$this->assertEqualSetsWithIndex( $subset, $intersection, $message );
	}

	protected function assertOptionNotExists( $option ) {
		$this->assertNull(
			$this->queryOption( $option ),
			"Failed to assert that option '$option' does not exist."
		);
	}

	protected function assertOptionExists( $option ) {
		$this->assertNotNull(
			$this->queryOption( $option ),
			"Failed to assert that option '$option' exists."
		);
	}

	protected function assertTransientNotExists( $transient ) {
		$this->assertNull(
			$this->queryOption( "_transient_$transient" ),
			"Failed to assert that transient '$transient' does not exist."
		);
	}

	protected function assertTransientExists( $transient ) {
		$this->assertNotNull(
			$this->queryOption( "_transient_$transient" ),
			"Failed to assert that transient '$transient' exists."
		);
	}

	protected function assertWPErrorWithMessage( $expected_message, $actual ) {
		$this->assertWPError( $actual );
		$this->assertEquals( $expected_message, $actual->get_error_message() );
	}

	protected function assertPostMetaNotExists( $post_id, $meta_key ) {
		$this->assertNull(
			$this->queryPostMeta( $post_id, $meta_key ),
			"Failed to assert that '$meta_key' does not exist for post ID: $post_id."
		);
	}

	protected function assertPostMetaExists( $post_id, $meta_key ) {
		$this->assertNotNull(
			$this->queryPostMeta( $post_id, $meta_key ),
			"Failed to assert that '$meta_key' exists for post ID: $post_id."
		);
	}

	protected function assertPostMetaHasValue( $post_id, $meta_key, $meta_value ) {
		$meta = $this->queryPostMeta( $post_id, $meta_key );
		$this->assertNotNull( $meta );
		$this->assertEquals( $meta_value, $meta['meta_value'], "Failed to assert that post $post_id has \"$meta_key\" meta with \"$meta_value\" value." );
	}

	protected function queryPostMeta( $post_id, $meta_key ) {
		global $wpdb;

		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s",
				$post_id,
				$meta_key
			),
			ARRAY_A
		);
	}

	protected function queryOption( $option ) {
		global $wpdb;

		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->options} WHERE `option_name` = %s",
				$option
			),
			ARRAY_A
		);
	}

	protected function assertSettingRegistered( $name ) {
		global $wp_registered_settings;

		$this->assertArrayHasKey(
			$name,
			$wp_registered_settings,
			"Failed to assert that a setting '$name' is registered."
		);
	}

	protected function assertSettingNotRegistered( $name ) {
		global $wp_registered_settings;

		$this->assertArrayNotHasKey(
			$name,
			$wp_registered_settings,
			"Failed to assert that a setting '$name' is not registered."
		);
	}

	/**
	 * Subscribes to HTTP requests made via WP HTTP.
	 *
	 * Ideally this should hook on to `http_api_debug` rather than `pre_http_request`
	 * but the former action doesn't fire for blocked HTTP requests until WP 5.3.
	 * {@link https://github.com/WordPress/WordPress/commit/eeba1c1244ee17424c8953dc416527a97560f6cc}
	 *
	 * @param Closure $listener Function to be invoked for all WP HTTP requests.
	 *                          $listener will be called with $url, $args.
	 * @param mixed   $response Mock response object.
	 * @return Closure Function to unsubscribe the added listener.
	 */
	protected function subscribe_to_wp_http_requests( Closure $listener, $response = null ) {
		$capture_callback = function ( $_, $args, $url ) use ( $listener, $response ) {
			$listener( $url, $args );

			return $response ?: $_;
		};

		add_filter( 'pre_http_request', $capture_callback, 0, 3 );

		return function () use ( $capture_callback ) {
			remove_filter( 'pre_http_request', $capture_callback, 0 );
		};
	}
}
