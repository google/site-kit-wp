<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_1_150_0Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_1_150_0;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_150_0Test extends TestCase {

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

	/**
	 * @var Audience_Settings
	 */
	protected $audience_settings;

	public function set_up() {
		parent::set_up();

		$this->context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options            = new Options( $this->context );
		$this->analytics_settings = new Analytics_Settings( $this->options );
		$this->audience_settings  = new Audience_Settings( $this->options );

		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_1_150_0(
			$this->context,
			$this->options
		);
	}

	public function test_register() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
	}

	public function test_migrate_audience_settings() {
		$migration = $this->get_new_migration_instance();

		$analytics_data = array(
			'availableAudiences'                   => array( 'audience1', 'audience2' ),
			'availableAudiencesLastSyncedAt'       => 1678886400,
			'audienceSegmentationSetupCompletedBy' => 123,
			'other_analytics_setting'              => 'value',
		);

		$this->analytics_settings->set( $analytics_data );

		$migration->migrate();

		$analytics_settings_after = $this->analytics_settings->get();
		$audience_settings_after  = $this->audience_settings->get();

		$this->assertArrayNotHasKey( 'availableAudiences', $analytics_settings_after );
		$this->assertArrayNotHasKey( 'availableAudiencesLastSyncedAt', $analytics_settings_after );
		$this->assertArrayNotHasKey( 'audienceSegmentationSetupCompletedBy', $analytics_settings_after );
		$this->assertArrayHasKey( 'other_analytics_setting', $analytics_settings_after );

		$this->assertEquals( array( 'audience1', 'audience2' ), $audience_settings_after['availableAudiences'] );
		$this->assertEquals( 1678886400, $audience_settings_after['availableAudiencesLastSyncedAt'] );
		$this->assertEquals( 123, $audience_settings_after['audienceSegmentationSetupCompletedBy'] );
	}

	public function test_migrate_audience_settings_no_analytics_settings() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$audience_settings_after = $this->audience_settings->get();

		$this->assertEmpty( $audience_settings_after );
	}

	public function test_migrate_audience_settings_empty_analytics_settings() {
		$migration = $this->get_new_migration_instance();

		$this->analytics_settings->set( array() );

		$migration->migrate();

		$audience_settings_after = $this->audience_settings->get();

		$this->assertEmpty( $audience_settings_after );
	}

	protected function get_db_version() {
		return $this->options->get( Migration_1_150_0::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_1_150_0::DB_VERSION_OPTION );
	}
}
