<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_N_E_X_TTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Health;
use Google\Site_Kit\Tests\TestCase;

class Migration_N_E_X_TTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Google_Tag_Gateway_Settings
	 */
	protected $gtg_settings;

	/**
	 * @var Google_Tag_Gateway_Health
	 */
	protected $gtg_health;

	public function set_up() {
		parent::set_up();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options      = new Options( $this->context );
		$this->gtg_settings = new Google_Tag_Gateway_Settings( $this->options );
		$this->gtg_health   = new Google_Tag_Gateway_Health( $this->options );

		$this->gtg_health->register();
		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_N_E_X_T(
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

	public function test_migrate_no_gtg_settings() {
		$migration = $this->get_new_migration_instance();

		// Don't set any GTG settings.

		$migration->migrate();

		// Verify no settings or health data was created.
		$this->assertOptionNotExists( Google_Tag_Gateway_Settings::OPTION, 'GTG settings should not be created if they did not exist.' );
		$this->assertOptionNotExists( Google_Tag_Gateway_Health::OPTION, 'GTG health should not be created if settings did not exist.' );
	}

	public function test_migrate_gtg_enabled_true() {
		$migration = $this->get_new_migration_instance();

		// Set GTG settings with isEnabled: true and health data.
		$pre_migration_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => false,
		);

		// Set legacy data before registering the settings class to avoid sanitization.
		$this->options->set( Google_Tag_Gateway_Settings::OPTION, $pre_migration_settings );
		$this->gtg_settings->register();

		$migration->migrate();

		// Verify settings were kept with only isEnabled.
		$post_migration_settings = $this->gtg_settings->get();
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled' => true,
			),
			$post_migration_settings,
			'GTG settings should keep only isEnabled when it is true.'
		);

		// Verify health data was migrated.
		$post_migration_health = $this->gtg_health->get();
		$this->assertEqualSetsWithIndex(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => false,
			),
			$post_migration_health,
			'Health data should be migrated to new health option.'
		);
	}

	public function test_migrate_gtg_enabled_false() {
		$migration = $this->get_new_migration_instance();

		// Set GTG settings with isEnabled: false and health data.
		$pre_migration_settings = array(
			'isEnabled'             => false,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => true,
		);

		// Set legacy data before registering the settings class to avoid sanitization.
		$this->options->set( Google_Tag_Gateway_Settings::OPTION, $pre_migration_settings );
		$this->gtg_settings->register();

		$migration->migrate();

		// Verify settings option was deleted.
		$this->assertOptionNotExists(
			Google_Tag_Gateway_Settings::OPTION,
			'GTG settings should be deleted when isEnabled is false.'
		);

		// Verify health data was still migrated.
		$post_migration_health = $this->gtg_health->get();
		$this->assertEqualSetsWithIndex(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => true,
			),
			$post_migration_health,
			'Health data should be migrated even when isEnabled is false.'
		);
	}

	public function test_migrate_gtg_null_health_values() {
		$migration = $this->get_new_migration_instance();

		// Set GTG settings with null health values.
		$pre_migration_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);

		// Set legacy data before registering the settings class to avoid sanitization.
		$this->options->set( Google_Tag_Gateway_Settings::OPTION, $pre_migration_settings );
		$this->gtg_settings->register();

		$migration->migrate();

		// Verify settings were kept with only isEnabled.
		$post_migration_settings = $this->gtg_settings->get();
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled' => true,
			),
			$post_migration_settings,
			'GTG settings should keep only isEnabled.'
		);

		// Verify health data was migrated with null values.
		$post_migration_health = $this->gtg_health->get();
		$this->assertEqualSetsWithIndex(
			array(
				'isUpstreamHealthy' => null,
				'isMpathHealthy'    => null,
			),
			$post_migration_health,
			'Health data should be migrated with null values.'
		);
	}

	public function test_migrate_gtg_mixed_health_values() {
		$migration = $this->get_new_migration_instance();

		// Set GTG settings with mixed health values.
		$pre_migration_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => false,
			'isScriptAccessEnabled' => true,
		);

		// Set legacy data before registering the settings class to avoid sanitization.
		$this->options->set( Google_Tag_Gateway_Settings::OPTION, $pre_migration_settings );
		$this->gtg_settings->register();

		$migration->migrate();

		// Verify health data was migrated correctly.
		$post_migration_health = $this->gtg_health->get();
		$this->assertEqualSetsWithIndex(
			array(
				'isUpstreamHealthy' => false,
				'isMpathHealthy'    => true,
			),
			$post_migration_health,
			'Health data should be migrated with correct values.'
		);
	}

	public function test_migrate_gtg_empty_settings() {
		$migration = $this->get_new_migration_instance();

		// Register settings class first (needed for set()).
		$this->gtg_settings->register();

		// Set empty GTG settings.
		$this->gtg_settings->set( array() );

		$migration->migrate();

		// Verify settings option was deleted (empty array means default state).
		$this->assertOptionNotExists(
			Google_Tag_Gateway_Settings::OPTION,
			'GTG settings should be deleted when settings are empty.'
		);

		// Verify no health data was created.
		$this->assertOptionNotExists(
			Google_Tag_Gateway_Health::OPTION,
			'GTG health should not be created when settings are empty.'
		);
	}

	public function test_migrate_sets_db_version() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => true,
		);

		// Set legacy data before registering the settings class to avoid sanitization.
		$this->options->set( Google_Tag_Gateway_Settings::OPTION, $pre_migration_settings );
		$this->gtg_settings->register();

		$migration->migrate();

		// Verify DB version was set.
		$this->assertSame(
			Migration_N_E_X_T::DB_VERSION,
			$this->options->get( Migration_N_E_X_T::DB_VERSION_OPTION ),
			'DB version should be set after migration.'
		);
	}

	public function test_migrate_runs_once() {
		$migration = $this->get_new_migration_instance();

		$pre_migration_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => true,
		);

		// Set legacy data before registering the settings class to avoid sanitization.
		$this->options->set( Google_Tag_Gateway_Settings::OPTION, $pre_migration_settings );
		$this->gtg_settings->register();

		// Run migration once.
		$migration->migrate();

		// Modify settings after migration.
		$this->gtg_settings->set( array( 'isEnabled' => false ) );

		// Run migration again.
		$migration->migrate();

		// Verify settings were not re-migrated (still false, not deleted).
		$this->assertOptionExists(
			Google_Tag_Gateway_Settings::OPTION,
			'Migration should not run again after DB version is set.'
		);
		$this->assertEqualSetsWithIndex(
			array( 'isEnabled' => false ),
			$this->gtg_settings->get(),
			'Settings should not be re-migrated.'
		);
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_N_E_X_T::DB_VERSION_OPTION );
	}
}
