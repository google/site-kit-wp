<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\Verification_EvidenceTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Verification_Evidence;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class Verification_EvidenceTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options instance for the current user.
	 *
	 * @var User_Options
	 */
	private $user_options;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $this->context, $user_id );
	}

	/**
	 * @dataProvider data_get
	 */
	public function test_get( $file_token, $meta_token, $expected ) {
		if ( $file_token ) {
			$this->user_options->set( Verification_File::OPTION, $file_token );
		}
		if ( $meta_token ) {
			$this->user_options->set( Verification_Meta::OPTION, $meta_token );
		}

		$verification_evidence = new Verification_Evidence( $this->context );

		$this->assertEquals( $expected, $verification_evidence->get(), 'Verification evidence should reflect the stored tokens in order of preference.' );
	}

	public function data_get() {
		return array(
			'no tokens'       => array( '', '', Verification_Evidence::NONE ),
			'file token only' => array( 'file-token', '', Verification_Evidence::FILE ),
			'meta token only' => array( '', 'meta-token', Verification_Evidence::META ),
			'both tokens'     => array( 'file-token', 'meta-token', Verification_Evidence::FILE ),
		);
	}

	public function test_get__file_unsupported() {
		$this->user_options->set( Verification_File::OPTION, 'file-token' );

		// File verification is not supported for sites installed in a subdirectory.
		add_filter(
			'googlesitekit_canonical_home_url',
			function () {
				return 'https://example.com/subdirectory/';
			}
		);

		$verification_evidence = new Verification_Evidence( $this->context );

		$this->assertEquals( Verification_Evidence::NONE, $verification_evidence->get(), 'A file token should not be reported when file verification is unsupported.' );

		$this->user_options->set( Verification_Meta::OPTION, 'meta-token' );

		$this->assertEquals( Verification_Evidence::META, $verification_evidence->get(), 'The meta token should be reported when file verification is unsupported.' );
	}

	public function test_get__reflects_newly_stored_token() {
		$verification_evidence = new Verification_Evidence( $this->context );

		$this->assertEquals( Verification_Evidence::NONE, $verification_evidence->get(), 'Verification evidence should be none before a token is stored.' );

		$this->user_options->set( Verification_File::OPTION, 'file-token' );

		$this->assertEquals( Verification_Evidence::FILE, $verification_evidence->get(), 'Verification evidence should reflect a token stored after instantiation.' );
	}

	public function test_get__ignores_other_users() {
		$other_user_options = new User_Options( $this->context, $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$other_user_options->set( Verification_File::OPTION, 'other-file-token' );
		$other_user_options->set( Verification_Meta::OPTION, 'other-meta-token' );

		$verification_evidence = new Verification_Evidence( $this->context );

		$this->assertEquals( Verification_Evidence::NONE, $verification_evidence->get(), 'Tokens stored for other users should be ignored.' );
	}
}
