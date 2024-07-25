<?php
/**
 * Has_Connected_AdminsTest
 *
 * @package   Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Has_Connected_Admins;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class Has_Connected_AdminsTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	public function set_up() {
		parent::set_up();
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options      = new Options( $this->context );
		$this->user_options = new User_Options( $this->context );
	}

	public function test_get_without_option_value_yet() {
		$setting = new Has_Connected_Admins( $this->options, $this->user_options );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		delete_option( Has_Connected_Admins::OPTION );
		// Even though there is an admin, the user is not connected until they have an access token.
		$this->assertFalse( $setting->get() );

		add_user_meta(
			$user_id,
			$this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ),
			'test-access-token'
		);

		$this->assertTrue( $setting->get() );
		$this->assertTrue( get_option( Has_Connected_Admins::OPTION ) );
	}

	public function test_get_with_option_value() {
		$setting = new Has_Connected_Admins( $this->options, $this->user_options );
		update_option( Has_Connected_Admins::OPTION, true );

		$this->assertTrue( $setting->get() );
	}

	public function test_option_is_set_when_access_token_added_and_deleted_together() {
		$setting  = new Has_Connected_Admins( $this->options, $this->user_options );
		$user_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );

		// Adding the access token meta sets the option.
		add_user_meta( $user_id, $meta_key, 'test-access-token' );
		$this->assertOptionExists( Has_Connected_Admins::OPTION );
		$this->assertTrue( $setting->get() );

		// Deleting an access token deletes the option as well.
		delete_user_meta( $user_id, $meta_key );
		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );
		$this->assertFalse( $setting->get() );
		// The option is now set as `false` as there are no longer any connected admins.
		$this->assertTrue( $setting->has() );
		$this->assertOptionExists( Has_Connected_Admins::OPTION );
		$this->assertFalse( $setting->get() );
	}

	public function test_option_is_set_for_administrators_only() {
		$setting   = new Has_Connected_Admins( $this->options, $this->user_options );
		$meta_key  = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );
		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		$admin_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );

		// Editors can't currently authenticate, but if they could it would not count as a connected admin.
		add_user_meta( $editor_id, $meta_key, 'test-access-token' );
		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );
		$this->assertFalse( $setting->get() );

		// Adding an access token for an admin will set the option to true.
		add_user_meta( $admin_id, $meta_key, 'test-access-token' );
		$this->assertOptionExists( Has_Connected_Admins::OPTION );
		$this->assertTrue( $setting->get() );
		// Even if the option is deleted, the setting will still return true.
		delete_option( Has_Connected_Admins::OPTION );
		$this->assertTrue( $setting->get() );
	}
}
