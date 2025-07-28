<?php
/**
 * Verification_MetaTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// No longer need to disable assertion message checks as messages have been added

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class Verification_MetaTest extends TestCase {

	public function test_get() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$verification_meta = new Verification_Meta( $user_options );

		$this->assertFalse( $user_options->get( Verification_Meta::OPTION ), 'Verification meta option should not exist initially.' );
		$this->assertEquals( '', $verification_meta->get(), 'Verification meta should return empty string when not set.' );
		$user_options->set( Verification_Meta::OPTION, 'test-verification-tag' );
		$this->assertEquals( 'test-verification-tag', $verification_meta->get(), 'Verification meta should return the set value.' );
	}

	public function test_set() {
		$user_id           = $this->factory()->user->create();
		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options      = new User_Options( $context, $user_id );
		$verification_meta = new Verification_Meta( $user_options );

		$this->assertTrue( $verification_meta->set( 'test-verification-tag' ), 'Setting verification meta should return true.' );
		$this->assertEquals( 'test-verification-tag', $user_options->get( Verification_Meta::OPTION ), 'User options should contain the set verification meta value.' );
	}

	public function test_has() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$verification_meta = new Verification_Meta( $user_options );

		$this->assertFalse( $verification_meta->has(), 'Verification meta should not exist initially.' );
		$user_options->set( Verification_Meta::OPTION, 'test-verification-tag' );
		$this->assertTrue( $verification_meta->has(), 'Verification meta should exist after being set.' );
	}
}
