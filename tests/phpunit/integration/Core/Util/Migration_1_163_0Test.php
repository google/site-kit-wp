<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_1_163_0Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_1_163_0;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_163_0Test extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Sign_In_With_Google_Settings
	 */
	protected $sign_in_with_google_settings;

	public function set_up() {
		parent::set_up();

		$this->context                      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options                      = new Options( $this->context );
		$this->sign_in_with_google_settings = new Sign_In_With_Google_Settings( $this->options );

		$this->sign_in_with_google_settings->register();
		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_1_163_0(
			$this->context,
			$this->options
		);
	}

	public function test_register() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ), 'Migration should register admin_init action.' );
	}

	public function test_migrate_one_tap_settings() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'clientID'         => '1234567890.googleusercontent.com',
			'text'             => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
			'theme'            => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
			'shape'            => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			'oneTapEnabled'    => false,
			'oneTapOnAllPages' => false,
		);

		$this->sign_in_with_google_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->sign_in_with_google_settings->get();

		$this->assertArrayNotHasKey( 'oneTapOnAllPages', $post_migration_settings, 'oneTapOnAllPages setting should be removed from Sign in with Google settings.' );
		$this->assertArrayHasKey( 'oneTapEnabled', $post_migration_settings, 'oneTapEnabled setting should remain in Sign in with Google settings.' );
		$this->assertArrayHasKey( 'clientID', $post_migration_settings, 'Other (unrelated) settings should remain in Sign in with Google settings.' );
		$this->assertArrayHasKey( 'shape', $post_migration_settings, 'Other (unrelated) settings should remain in Sign in with Google settings.' );
	}

	public function test_migrate_one_tap_settings_when_all_are_false() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'clientID'         => '1234567890.googleusercontent.com',
			'text'             => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
			'theme'            => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
			'shape'            => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			'oneTapEnabled'    => false,
			'oneTapOnAllPages' => false,
		);

		$this->sign_in_with_google_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->sign_in_with_google_settings->get();

		$this->assertFalse( $post_migration_settings['oneTapEnabled'], 'One-tap should not be enabled after migration if it was not enabled previously.' );
	}

	public function test_migrate_one_tap_settings_when_enabled_on_all_pages_was_false() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'clientID'         => '1234567890.googleusercontent.com',
			'text'             => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
			'theme'            => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
			'shape'            => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			'oneTapEnabled'    => true,
			'oneTapOnAllPages' => false,
		);

		$this->sign_in_with_google_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->sign_in_with_google_settings->get();

		$this->assertFalse( $post_migration_settings['oneTapEnabled'], 'One-tap should not be enabled after migration even if enabled previously, because "One-tap on all pages" was not previously enabled.' );
	}

	public function test_migrate_one_tap_settings_when_enabled_on_all_pages_was_true() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'clientID'         => '1234567890.googleusercontent.com',
			'text'             => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
			'theme'            => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
			'shape'            => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			'oneTapEnabled'    => true,
			'oneTapOnAllPages' => true,
		);

		$this->sign_in_with_google_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->sign_in_with_google_settings->get();

		$this->assertTrue( $post_migration_settings['oneTapEnabled'], 'One-tap should be enabled after migration because "One-tap on all pages" was previously enabled.' );
	}

	public function test_migrate_one_tap_settings_when_enabled_on_all_pages_not_present() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'clientID'      => '1234567890.googleusercontent.com',
			'text'          => Sign_In_With_Google_Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
			'theme'         => Sign_In_With_Google_Settings::THEME_LIGHT['value'],
			'shape'         => Sign_In_With_Google_Settings::SHAPE_RECTANGULAR['value'],
			'oneTapEnabled' => true,
		);

		$this->sign_in_with_google_settings->set( $pre_migration_settings );

		$migration->migrate();

		$post_migration_settings = $this->sign_in_with_google_settings->get();

		$this->assertFalse( $post_migration_settings['oneTapEnabled'], 'One-tap should not be enabled after migration because "One-tap on all pages" was not found.' );
	}

	protected function get_db_version() {
		return $this->options->get( Migration_1_163_0::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_1_163_0::DB_VERSION_OPTION );
	}
}
