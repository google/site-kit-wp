<?php
/**
 * Has_Multiple_AdminsTest
 *
 * @package   Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Has_Multiple_Admins;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class Has_Multiple_AdminsTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Transients
	 */
	protected $transients;

	public function set_up() {
		parent::set_up();
		$this->context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->transients = new Transients( $this->context );
	}

	public function test_get() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );

		// Should return FALSE since we don't have multiple admins yet.
		$this->assertFalse( $has_multiple_admins->get() );

		// Create a second admin, the first one (with ID=1) we already have.
		$this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Delete the transient and check that we have multiple admins now.
		$this->transients->delete( Has_Multiple_Admins::OPTION );
		$this->assertTrue( $has_multiple_admins->get() );
	}
}
