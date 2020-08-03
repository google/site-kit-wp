<?php
/**
 * Has_Connected_AdminsTest
 *
 * @package   Google
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Has_Connected_Admins;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
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

	public function setUp() {
		parent::setUp();
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options      = new Options( $this->context );
		$this->user_options = new User_Options( $this->context );
	}

	public function test_get_without_option_value_yet() {
		$setting = new Has_Connected_Admins( $this->options, $this->user_options );

		delete_option( Has_Connected_Admins::OPTION );
		$this->assertFalse( $setting->get() );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		add_user_meta(
			$user_id,
			$this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ),
			'xxxxx'
		);

		$this->assertTrue( $setting->get() );
		$this->assertTrue( get_option( Has_Connected_Admins::OPTION ) );
	}

	public function test_get_with_option_value() {
		$setting = new Has_Connected_Admins( $this->options, $this->user_options );
		update_option( Has_Connected_Admins::OPTION, true );

		$this->assertTrue( $setting->get() );
	}

	public function test_option_is_adjusted_when_meta_is_changed() {
		$setting = new Has_Connected_Admins( $this->options, $this->user_options );

		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );

		$user_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		add_user_meta( $user_id, $meta_key, 'xxxxx' );
		$this->assertOptionExists( Has_Connected_Admins::OPTION );
		$this->assertTrue( $setting->get() );

		delete_user_meta( $user_id, $meta_key );
		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );
		$this->assertFalse( $setting->get() );
	}

	public function test_option_is_set_when_admin_meta_is_chagned() {
		$setting  = new Has_Connected_Admins( $this->options, $this->user_options );
		$meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );

		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		add_user_meta( $user_id, $meta_key, 'xxxxx' );
		$this->assertOptionNotExists( Has_Connected_Admins::OPTION );
		$this->assertFalse( $setting->get() );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		add_user_meta( $user_id, $meta_key, 'xxxxx' );
		$this->assertOptionExists( Has_Connected_Admins::OPTION );
		$this->assertTrue( $setting->get() );
	}

}
