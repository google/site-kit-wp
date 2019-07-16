<?php
/**
 * UninstallationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Uninstallation;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class UninstallationTest extends TestCase {

	public function test_register() {
		$uninstall = new Uninstallation();
		remove_all_actions( 'googlesitekit_uninstall' );

		$spy = new MethodSpy();
		$this->assertCount( 0, $spy->invocations );
		$this->force_set_property( $uninstall, 'reset', $spy );

		do_action( 'googlesitekit_uninstall' );
		$this->assertCount( 0, $spy->invocations );

		$uninstall->register();

		do_action( 'googlesitekit_uninstall' );
		$this->assertCount( 1, $spy->invocations );
		$this->assertCount( 1, $spy->invocations['all'] );
	}
}
