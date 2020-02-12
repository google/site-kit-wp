<?php
/**
 * Verification_MetaTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Site_Verification;
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

		$this->assertFalse( $user_options->get( Verification_Meta::OPTION ) );
		$this->assertEquals( '', $verification_meta->get() );
		$user_options->set( Verification_Meta::OPTION, 'test-verification-tag' );
		$this->assertEquals( 'test-verification-tag', $verification_meta->get() );
	}

	public function test_set() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$options      = new Options( $context );

		$options->set( Site_Verification::OPTION_VERIFICATION_META_TAGS, 'test-verification-meta-tags' );
		$verification_meta = new Verification_Meta( $user_options );

		$this->assertEquals( 'test-verification-meta-tags', $options->get( Site_Verification::OPTION_VERIFICATION_META_TAGS ) );
		$this->assertTrue( $verification_meta->set( 'test-verification-tag' ) );
		$this->assertEquals( 'test-verification-tag', $user_options->get( Verification_Meta::OPTION ) );
		$this->assertFalse( $options->get( Site_Verification::OPTION_VERIFICATION_META_TAGS ) );

		// Cache option is deleted when verification meta is saved.
		// User_Options->set() will return false if new value === old value.
		$options->set( Site_Verification::OPTION_VERIFICATION_META_TAGS, 'test-verification-meta-tags' );
		$this->assertEquals( 'test-verification-meta-tags', $options->get( Site_Verification::OPTION_VERIFICATION_META_TAGS ) );
		$this->assertFalse( $verification_meta->set( 'test-verification-tag' ) );
		$this->assertFalse( $options->get( Site_Verification::OPTION_VERIFICATION_META_TAGS ) );
	}

	public function test_has() {
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$verification_meta = new Verification_Meta( $user_options );

		$this->assertFalse( $verification_meta->has() );
		$user_options->set( Verification_Meta::OPTION, 'test-verification-tag' );
		$this->assertTrue( $verification_meta->has() );
	}
}
