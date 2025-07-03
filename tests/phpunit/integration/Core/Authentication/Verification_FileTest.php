<?php
/**
 * Verification_FileTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class Verification_FileTest extends TestCase {

	public function test_get() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$verification_file = new Verification_File( $user_options );

		$this->assertFalse( $user_options->get( Verification_File::OPTION ) );
		$this->assertEquals( '', $verification_file->get() );
		$user_options->set( Verification_File::OPTION, 'a1b2c3d4f5' );
		$this->assertEquals( 'a1b2c3d4f5', $verification_file->get() );
	}

	public function test_set() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$verification_file = new Verification_File( $user_options );

		$this->assertTrue( $verification_file->set( 'a1b2c3d4f5' ) );
		$this->assertEquals( 'a1b2c3d4f5', $user_options->get( Verification_File::OPTION ) );
	}

	public function test_has() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$verification_file = new Verification_File( $user_options );

		$this->assertFalse( $verification_file->has() );
		$user_options->set( Verification_File::OPTION, 'a1b2c3d4f5' );
		$this->assertTrue( $verification_file->has() );
	}
}
