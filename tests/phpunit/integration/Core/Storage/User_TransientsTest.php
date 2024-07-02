<?php
/**
 * User_TransientsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Plugin;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\User_Transients;
use Google\Site_Kit\Tests\Core\Storage\User_Aware_Interface_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class User_TransientsTest extends TestCase {

	use User_Aware_Interface_ContractTests;

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var bool
	 */
	protected static $old_wp_using_ext_object_cache;

	public static function wpSetUpBeforeClass() {
		self::$old_wp_using_ext_object_cache = wp_using_ext_object_cache();
	}

	public static function wpTearDownAfterClass() {
		wp_using_ext_object_cache( self::$old_wp_using_ext_object_cache );
	}

	public function set_up() {
		parent::set_up();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	protected function create_user_aware_instance() {
		$user_id = $this->factory()->user->create();

		return array(
			new User_Transients( $this->context, $user_id ),
			$user_id,
		);
	}

	protected function using_external_cache() {
		wp_using_ext_object_cache( true );
		return $this->create_user_aware_instance();
	}

	protected function using_user_options() {
		wp_using_ext_object_cache( false );
		list( $user_transients, $user_id ) = $this->create_user_aware_instance();

		return array(
			$user_transients,
			new User_Options( $this->context, $user_id ),
		);
	}

	public function test_get_using_external_cache() {
		list( $user_transients, $user_id ) = $this->using_external_cache();
		wp_cache_set( "wptests_user_{$user_id}_testkey", 'qwerty', 'transient', 1000 );
		$this->assertEquals( 'qwerty', $user_transients->get( 'testkey' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_get_using_external_cache() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		list( $user_transients, $user_id ) = $this->using_external_cache();
		wp_cache_set( "user_{$user_id}_testkey2", 'qwerty2', 'site-transient', 1000 );
		$this->assertEquals( 'qwerty2', $user_transients->get( 'testkey2' ) );
	}

	public function test_set_using_external_cache() {
		list( $user_transients, $user_id ) = $this->using_external_cache();
		$user_transients->set( 'testkey3', 'qwerty3', 1000 );
		$this->assertEquals( 'qwerty3', wp_cache_get( "wptests_user_{$user_id}_testkey3", 'transient' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_set_using_external_cache() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		list( $user_transients, $user_id ) = $this->using_external_cache();
		$user_transients->set( 'testkey4', 'qwerty4', 1000 );
		$this->assertEquals( 'qwerty4', wp_cache_get( "user_{$user_id}_testkey4", 'site-transient' ) );
	}

	public function test_delete_using_external_cache() {
		list( $user_transients, $user_id ) = $this->using_external_cache();
		wp_cache_set( "wptests_user_{$user_id}_testkey5", 'qwerty5', 'transient', 1000 );
		$this->assertEquals( 'qwerty5', wp_cache_get( "wptests_user_{$user_id}_testkey5", 'transient' ) );

		$user_transients->delete( 'testkey5' );
		$this->assertFalse( wp_cache_get( "wptests_user_{$user_id}_testkey5", 'transient' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_delete_using_external_cache() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		list( $user_transients, $user_id ) = $this->using_external_cache();
		wp_cache_set( "user_{$user_id}_testkey6", 'qwerty6', 'site-transient', 1000 );
		$this->assertEquals( 'qwerty6', wp_cache_get( "user_{$user_id}_testkey6", 'site-transient' ) );

		$user_transients->delete( 'testkey6' );
		$this->assertFalse( wp_cache_get( "user_{$user_id}_testkey6", 'site-transient' ) );
	}

	public function test_get_using_user_options() {
		list( $user_transients, $user_options ) = $this->using_user_options();

		// Test when timeout is valid.
		$user_options->set( 'googlesitekit_transient_testkey7', 'qwerty7' );
		$user_options->set( 'googlesitekit_transient_timeout_testkey7', time() + 1000 );

		$value = $user_transients->get( 'testkey7' );
		$this->assertEquals( 'qwerty7', $value );

		// Test when timeout is expired.
		$user_options->set( 'googlesitekit_transient_testkey8', 'qwerty8' );
		$user_options->set( 'googlesitekit_transient_timeout_testkey8', time() - 1000 );

		$this->assertNotEmpty( $user_options->get( 'googlesitekit_transient_testkey8' ) );

		$value = $user_transients->get( 'testkey8' );
		$this->assertFalse( $value );
		$this->assertEmpty( $user_options->get( 'googlesitekit_transient_testkey8' ) );

		// Test when timeout is not set.
		$user_options->set( 'googlesitekit_transient_testkey9', 'qwerty9' );

		$this->assertNotEmpty( $user_options->get( 'googlesitekit_transient_testkey9' ) );

		$value = $user_transients->get( 'testkey9' );
		$this->assertFalse( $value );
		$this->assertEmpty( $user_options->get( 'googlesitekit_transient_testkey9' ) );
	}

	public function test_set_using_user_options() {
		list( $user_transients, $user_options ) = $this->using_user_options();

		$this->assertEmpty( $user_options->get( 'googlesitekit_transient_testkey10' ) );
		$this->assertEmpty( $user_options->get( 'googlesitekit_transient_timeout_testkey10' ) );

		$user_transients->set( 'testkey10', 'qwerty10', 1000 );
		$this->assertEquals( 'qwerty10', $user_options->get( 'googlesitekit_transient_testkey10' ) );

		$timeout = $user_options->get( 'googlesitekit_transient_timeout_testkey10' );
		$this->assertGreaterThan( time(), $timeout );
		$this->assertLessThanOrEqual( time() + 1000, $timeout );
	}

	public function test_delete_using_user_options() {
		list( $user_transients, $user_options ) = $this->using_user_options();

		$user_options->set( 'googlesitekit_transient_testkey11', 'qwerty11' );
		$user_options->set( 'googlesitekit_transient_timeout_testkey11', time() + 1000 );

		$user_transients->delete( 'testkey11' );

		$this->assertFalse( $user_options->get( 'googlesitekit_transient_testkey11' ) );
		$this->assertFalse( $user_options->get( 'googlesitekit_transient_timeout_testkey11' ) );
	}
}
