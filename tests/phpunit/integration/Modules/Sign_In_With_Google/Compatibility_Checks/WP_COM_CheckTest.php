<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks\WP_COM_CheckTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks;

use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\WP_COM_Check;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 * @group Compatibility_Checks
 */
class WP_COM_CheckTest extends TestCase {

	private $check;

	public function set_up() {
		parent::set_up();

		$this->check = new WP_COM_Check();
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'WPCOMSH_VERSION' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'WPCOMSH_VERSION' );
		}
	}

	public function test_get_slug() {
		$this->assertEquals( 'host_wordpress_dot_com', $this->check->get_slug(), 'Expected correct slug to be returned' );
	}

	public function test_run_returns_true_when_is_wpcom_defined_and_truthy() {
		if ( defined( 'WPCOMSH_VERSION' ) ) {
			$this->markTestSkipped( 'WPCOMSH_VERSION is already defined, cannot test dynamic definition' );
		}

		define( 'WPCOMSH_VERSION', true );

		$result = $this->check->run();
		$this->assertTrue( $result, 'Expected true when WPCOMSH_VERSION constant is defined and truthy' );
	}

	public function test_run_returns_false_when_is_wpcom_not_defined() {
		if ( defined( 'WPCOMSH_VERSION' ) ) {
			$this->markTestSkipped( 'WPCOMSH_VERSION is already defined in the test environment' );
		}

		$result = $this->check->run();
		$this->assertFalse( $result, 'Expected false when WPCOMSH_VERSION constant is not defined' );
	}

	public function test_run_returns_true_when_is_wpcom_defined_as_string() {
		if ( defined( 'WPCOMSH_VERSION' ) ) {
			$this->markTestSkipped( 'WPCOMSH_VERSION is already defined, cannot test dynamic definition' );
		}

		define( 'WPCOMSH_VERSION', 'yes' );

		$check  = new WP_COM_Check();
		$result = $check->run();

		$this->assertTrue( $result, 'Expected true when WPCOMSH_VERSION constant is defined as truthy string' );
	}

	public function test_run_returns_false_when_is_wpcom_defined_as_falsy() {
		if ( defined( 'WPCOMSH_VERSION' ) ) {
			$this->markTestSkipped( 'WPCOMSH_VERSION is already defined, cannot test dynamic definition' );
		}

		define( 'WPCOMSH_VERSION', false );

		$check  = new WP_COM_Check();
		$result = $check->run();

		$this->assertFalse( $result, 'Expected false when WPCOMSH_VERSION constant is defined as falsy value' );
	}

	public function test_run_returns_false_when_is_wpcom_defined_as_empty_string() {
		if ( defined( 'WPCOMSH_VERSION' ) ) {
			$this->markTestSkipped( 'WPCOMSH_VERSION is already defined, cannot test dynamic definition' );
		}

		define( 'WPCOMSH_VERSION', '' );

		$check  = new WP_COM_Check();
		$result = $check->run();

		$this->assertFalse( $result, 'Expected false when WPCOMSH_VERSION constant is defined as empty string' );
	}

	public function test_run_returns_false_when_is_wpcom_defined_as_zero() {
		if ( defined( 'WPCOMSH_VERSION' ) ) {
			$this->markTestSkipped( 'WPCOMSH_VERSION is already defined, cannot test dynamic definition' );
		}

		define( 'WPCOMSH_VERSION', 0 );

		$check  = new WP_COM_Check();
		$result = $check->run();

		$this->assertFalse( $result, 'Expected false when WPCOMSH_VERSION constant is defined as zero' );
	}
}
