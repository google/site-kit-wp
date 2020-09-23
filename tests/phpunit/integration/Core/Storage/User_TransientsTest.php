<?php
/**
 * User_TransientsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Plugin;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Transients;
use Google\Site_Kit\Tests\Core\Storage\User_Aware_Interface_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class User_TransientsTest extends TestCase {

	use User_Aware_Interface_ContractTests;

	protected function create_user_aware_instance( $user_id ) {
		return new User_Transients(
			new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			$user_id
		);
	}

	protected function using_external_cache( $callback ) {
		global $_wp_using_ext_object_cache;

		$old_wp_using_ext_object_cache = $_wp_using_ext_object_cache;
		$_wp_using_ext_object_cache    = true;

		$user_id         = $this->factory()->user->create();
		$user_transients = $this->create_user_aware_instance( $user_id );
		call_user_func( $callback, $user_transients, $user_id );

		$_wp_using_ext_object_cache = $old_wp_using_ext_object_cache;
	}

	public function test_get_using_external_cache() {
		$this->using_external_cache(
			function( $user_transients, $user_id ) {
				wp_cache_set( "wptests_user_{$user_id}_testkey", 'qwerty', 'transient', 1000 );
				$value = $user_transients->get( 'testkey' );
				$this->assertEquals( 'qwerty', $value );
			}
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_get_using_external_cache_in_network_mode() {
		$this->network_activate_site_kit();
		$this->using_external_cache(
			function( $user_transients, $user_id ) {
				wp_cache_set( "wptests_user_{$user_id}_testkey2", 'qwerty2', 'site-transient', 1000 );
				$value = $user_transients->get( 'testkey2' );
				$this->assertEquals( 'qwerty2', $value );
			}
		);
	}

	public function test_set_using_external_cache() {
		$this->using_external_cache(
			function( $user_transients, $user_id ) {
				$value = $user_transients->set( 'testkey3', 'qwerty3', 1000 );
				$this->assertEquals( 'qwerty3', wp_cache_get( "wptests_user_{$user_id}_testkey3", 'transient' ) );
			}
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_set_using_external_cache_in_network_mode() {
		$this->network_activate_site_kit();
		$this->using_external_cache(
			function( $user_transients, $user_id ) {
				$value = $user_transients->set( 'testkey4', 'qwerty4', 1000 );
				$this->assertEquals( 'qwerty4', wp_cache_get( "wptests_user_{$user_id}_testkey4", 'site-transient' ) );
			}
		);
	}

	public function test_delete_using_external_cache() {
		$this->using_external_cache(
			function( $user_transients, $user_id ) {
				wp_cache_set( "wptests_user_{$user_id}_testkey5", 'qwerty5', 'transient', 1000 );
				$this->assertEquals( 'qwerty5', wp_cache_get( "wptests_user_{$user_id}_testkey5", 'transient' ) );

				$user_transients->delete( 'testkey5' );
				$this->assertEquals( false, wp_cache_get( "wptests_user_{$user_id}_testkey5", 'transient' ) );
			}
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_delete_using_external_cache_in_network_mode() {
		$this->using_external_cache(
			function( $user_transients, $user_id ) {
				wp_cache_set( "wptests_user_{$user_id}_testkey6", 'qwerty6', 'site-transient', 1000 );
				$this->assertEquals( 'qwerty6', wp_cache_get( "wptests_user_{$user_id}_testkey6", 'site-transient' ) );

				$user_transients->delete( 'testkey6' );
				$this->assertEquals( false, wp_cache_get( "wptests_user_{$user_id}_testkey6", 'site-transient' ) );
			}
		);
	}

}
