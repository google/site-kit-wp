<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_n_e_x_tTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
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
	 * @var Analytics_Settings
	 */
	protected $analytics_settings;

	public function set_up() {
		parent::set_up();

		$this->context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options            = new Options( $this->context );
		$this->analytics_settings = new Analytics_Settings( $this->options );

		$this->analytics_settings->register();
		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_n_e_x_t(
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

	public function test_migrate_when_setting_present() {
		$migration = $this->get_new_migration_instance();

		$analytics_data = array(
			'availableAudiences'                   => array( 'audience1', 'audience2' ),
			'availableAudiencesLastSyncedAt'       => 1678886400,
			'audienceSegmentationSetupCompletedBy' => 123,
			'adsConversionIDMigratedAtMs'          => 1678886400,
			'other_analytics_setting'              => 'value',
		);

		$this->analytics_settings->set( $analytics_data );

		$pre_migration_settings = $this->analytics_settings->get();

		$this->assertArrayHasKey( 'adsConversionIDMigratedAtMs', $pre_migration_settings, 'adsConversionIDMigratedAtMs setting should exist in Analytics settings before migration.' );

		$migration->migrate();

		$post_migration_settings = $this->analytics_settings->get();

		$this->assertArrayNotHasKey( 'adsConversionIDMigratedAtMs', $post_migration_settings, 'adsConversionIDMigratedAtMs setting should be removed from Analytics settings.' );
	}

	public function test_migrate_when_setting_not_present() {
		$migration = $this->get_new_migration_instance();

		$analytics_data = array(
			'availableAudiences'                   => array( 'audience1', 'audience2' ),
			'availableAudiencesLastSyncedAt'       => 1678886400,
			'audienceSegmentationSetupCompletedBy' => 123,
			'other_analytics_setting'              => 'value',
		);

		$this->analytics_settings->set( $analytics_data );

		$pre_migration_settings = $this->analytics_settings->get();

		$this->assertArrayNotHasKey( 'adsConversionIDMigratedAtMs', $pre_migration_settings, 'adsConversionIDMigratedAtMs setting should not exist in Analytics settings before migration.' );

		$migration->migrate();

		$post_migration_settings = $this->analytics_settings->get();

		$this->assertArrayNotHasKey( 'adsConversionIDMigratedAtMs', $post_migration_settings, 'adsConversionIDMigratedAtMs setting should not be present in Analytics settings after migration.' );
	}

	protected function get_db_version() {
		return $this->options->get( Migration_n_e_x_t::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_n_e_x_t::DB_VERSION_OPTION );
	}
}
