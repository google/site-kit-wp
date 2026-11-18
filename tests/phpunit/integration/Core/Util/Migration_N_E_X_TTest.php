<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_N_E_X_TTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Is_Widget_Area_Hidden;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\TestCase;

class Migration_N_E_X_TTest extends TestCase {

	protected Context $context;
	protected Options $options;

	public function set_up() {
		parent::set_up();

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $this->context );

		// Remove every option the migration reads or writes, so each test relies
		// only on the values it creates and stores.
		$this->options->delete( Migration_N_E_X_T::DB_VERSION_OPTION );
		$this->options->delete( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION );

		remove_all_filters( 'googlesitekit_is_module_connected' );
	}

	/**
	 * Gets a migration whose target version is above the current plugin version.
	 *
	 * The real target version is `n.e.x.t` until release, which
	 * `version_compare()` sorts below every numeric version.
	 */
	public function get_new_migration_instance() {
		return new class( $this->context, $this->options ) extends Migration_N_E_X_T {
			const DB_VERSION = GOOGLESITEKIT_VERSION . '.1';
		};
	}

	public function test_register() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertSame(
			0,
			has_action( 'admin_init', array( $migration, 'migrate' ) ),
			'The migration should add `migrate()` to the `admin_init` action at priority 0, so it runs in `Plugin.php` registration order.'
		);
	}

	public function test_migrate__deletes_the_option_when_analytics_is_connected() {
		$migration = $this->get_new_migration_instance();

		$this->set_analytics_connected( true );
		$this->options->set( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION, true );

		$migration->migrate();

		$this->assertFalse(
			$this->options->has( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION ),
			'Migration should delete the Key Metrics widget area hidden option when Analytics is connected.'
		);
	}

	public function test_migrate__keeps_the_option_when_analytics_is_not_connected() {
		$migration = $this->get_new_migration_instance();

		$this->set_analytics_connected( false );
		$this->options->set( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION, true );

		$migration->migrate();

		$this->assertTrue(
			$this->options->get( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION ),
			'Migration should keep the Key Metrics widget area hidden option when Analytics is not connected.'
		);
	}

	public function test_migrate__sets_db_version() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Migration_N_E_X_T::DB_VERSION_OPTION, '1.192.0' );

		$migration->migrate();

		$this->assertSame(
			$migration::DB_VERSION,
			$this->options->get( Migration_N_E_X_T::DB_VERSION_OPTION ),
			"Database version should update to the migration's target version after the migration runs."
		);
	}

	public function test_migrate__skips_when_the_db_version_is_current() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Migration_N_E_X_T::DB_VERSION_OPTION, $migration::DB_VERSION );
		$this->set_analytics_connected( true );
		$this->options->set( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION, true );

		$migration->migrate();

		$this->assertTrue(
			$this->options->get( Key_Metrics_Setup_Is_Widget_Area_Hidden::OPTION ),
			'Migration should leave the option alone when the database version already matches its target.'
		);
	}

	/**
	 * Sets whether the `googlesitekit_is_module_connected` filter reports Analytics as connected.
	 *
	 * @param bool $is_connected Whether Analytics is connected.
	 */
	protected function set_analytics_connected( $is_connected ) {
		add_filter(
			'googlesitekit_is_module_connected',
			function ( $connected, $slug ) use ( $is_connected ) {
				return Analytics_4::MODULE_SLUG === $slug ? $is_connected : $connected;
			},
			10,
			2
		);
	}
}
