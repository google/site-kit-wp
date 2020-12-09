<?php
/**
 * TestCase class.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Core\Util\JSON_File;
use Google\Site_Kit\Tests\Exception\RedirectException;
use PHPUnit_Framework_MockObject_MockObject;

class TestCase extends \WP_UnitTestCase {
	// Do not preserve global state since it doesn't support closures within globals.
	protected $preserveGlobalState = false;

	protected static $featureFlagsConfig;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		if ( ! self::$featureFlagsConfig ) {
			self::$featureFlagsConfig = new JSON_File( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'feature-flags.json' );
		}

		self::reset_feature_flags();
	}

	public static function tearDownAfterClass() {
		parent::tearDownAfterClass();
		self::reset_feature_flags();
	}

	protected static function reset_feature_flags() {
		Feature_Flags::set_mode( Feature_Flags::MODE_PRODUCTION );
		Feature_Flags::set_features( self::$featureFlagsConfig );
	}

	/**
	 * Runs the routine before each test is executed.
	 */
	public function setUp() {
		parent::setUp();

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
	public function tearDown() {
		parent::tearDown();
		// Clear screen related globals.
		unset( $GLOBALS['current_screen'], $GLOBALS['taxnow'], $GLOBALS['typenow'] );
	}

	/**
	 * Forcibly set a property of an object that would otherwise not be possible.
	 *
	 * @param object|string $class Class instance to set the property on, or class name containing the property.
	 * @param string $property Property name
	 * @param mixed $value New value to assign the property
	 *
	 * @throws \ReflectionException
	 */
	protected function force_set_property( $class, $property, $value ) {
		$reflection_property = new \ReflectionProperty( $class, $property );
		$reflection_property->setAccessible( true );
		$reflection_property->setValue( $class, $value );
	}

	/**
	 * Forcibly get a property's value from an object that would otherwise not be possible.
	 *
	 * @param object|string $class Class instance to get the property from, or class name containing the property.
	 * @param string $property Property name
	 *
	 * @return mixed
	 * @throws \ReflectionException
	 */
	protected function force_get_property( $class, $property ) {
		$reflection_property = new \ReflectionProperty( $class, $property );
		$reflection_property->setAccessible( true );

		return $reflection_property->getValue( $class );
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

	protected function checkRequirements() {
		parent::checkRequirements();

		/**
		 * Proper handling for MS group annotation handling was fixed in 5.1
		 * @see https://core.trac.wordpress.org/ticket/43863
		 */
		if ( version_compare( $GLOBALS['wp_version'], '5.1', '<' ) ) {
			$annotations = $this->getAnnotations();
			$groups      = array();

			if ( ! empty( $annotations['class']['group'] ) ) {
				$groups = array_merge( $groups, $annotations['class']['group'] );
			}
			if ( ! empty( $annotations['method']['group'] ) ) {
				$groups = array_merge( $groups, $annotations['method']['group'] );
			}

			if ( ! empty( $groups ) ) {
				if ( in_array( 'ms-required', $groups, true ) ) {
					if ( ! is_multisite() ) {
						$this->markTestSkipped( 'Test only runs on Multisite' );
					}
				}
				if ( in_array( 'ms-excluded', $groups, true ) ) {
					if ( is_multisite() ) {
						$this->markTestSkipped( 'Test does not run on Multisite' );
					}
				}
			}
		}
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

	protected function assertWPErrorWithMessage( $expected_message, $actual ) {
		$this->assertWPError( $actual );
		$this->assertEquals( $expected_message, $actual->get_error_message() );
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
}
