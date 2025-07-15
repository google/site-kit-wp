<?php
/**
 * Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class Tag_GuardTest extends TestCase {

	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Tag_Guard object.
	 *
	 * @var Tag_Guard
	 */
	private $guard;

	/**
	 * Site URL before tests.
	 *
	 * @var string
	 */
	private $reset_site_url;

	public function set_up() {
		parent::set_up();

		$this->settings       = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->guard          = new Tag_Guard( $this->settings );
		$this->reset_site_url = get_option( 'siteurl' );
	}

	public function tear_down() {
		parent::tear_down();
		update_option( 'home', $this->reset_site_url );
		update_option( 'siteurl', $this->reset_site_url );
		unset( $_SERVER['HTTPS'] );
		unset( $_SERVER['SCRIPT_NAME'] );
	}

	public function test_can_activate() {
		// Set up HTTPS environment and valid client ID.
		$_SERVER['HTTPS'] = 'on';
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );
		$this->settings->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );

		$this->assertTrue( $this->guard->can_activate() );
	}

	public function test_cant_activate_when_not_https() {
		// Set up HTTP environment (not HTTPS).
		unset( $_SERVER['HTTPS'] );
		update_option( 'siteurl', 'http://example.com/' );
		update_option( 'home', 'http://example.com/' );
		$this->settings->set( array( 'clientID' => '1234567890.googleusercontent.com' ) );

		$this->assertFalse( $this->guard->can_activate() );
	}

	public function test_cant_activate_when_clientid_is_empty() {
		// Set up HTTPS environment but empty client ID.
		$_SERVER['HTTPS'] = 'on';
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );
		$this->settings->set( array( 'clientID' => '' ) );

		$this->assertFalse( $this->guard->can_activate() );
	}

	public function test_cant_activate_when_clientid_is_null() {
		// Set up HTTPS environment but null client ID.
		$_SERVER['HTTPS'] = 'on';
		update_option( 'siteurl', 'https://example.com/' );
		update_option( 'home', 'https://example.com/' );
		$this->settings->set( array( 'clientID' => null ) );

		$this->assertFalse( $this->guard->can_activate() );
	}
}
