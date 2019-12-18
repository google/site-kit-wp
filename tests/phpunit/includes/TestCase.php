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

use Google\Site_Kit\Tests\Exception\RedirectException;

class TestCase extends \WP_UnitTestCase {

	// Do not preserve global state since it doesn't support closures within globals.
	protected $preserveGlobalState = false;

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
		add_filter( 'wp_redirect_status', function ( $status, $location ) {
			$e = new RedirectException( "Intercepted attempt to redirect to $location" );
			$e->set_location( $location );
			$e->set_status( $status );
			throw $e;
		}, 10, 2 );
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
}
