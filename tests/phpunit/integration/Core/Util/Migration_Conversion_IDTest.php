<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_Conversion_IDTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_Conversion_ID;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Ads\Settings as Ads_Settings;
use Google\Site_Kit\Tests\TestCase;

class Migration_Conversion_IDTest extends TestCase {

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
	 * @var Ads_Settings
	 */
	protected $ads_settings;

	public function set_up() {
		parent::set_up();

		$this->context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options            = new Options( $this->context );
		$this->analytics_settings = new Analytics_Settings( $this->options );
		$this->ads_settings       = new Ads_Settings( $this->options );

		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_Conversion_ID(
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

	// If the Analytics module is not active, the migration should not
	// activate the Ads module.
	public function test_no_migration_if_analytics_not_active() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->options->set(
			Modules::OPTION_ACTIVE_MODULES,
			array( 'pagespeed-insights' )
		);

		$migration->migrate();

		$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( in_array( 'ads', $active_modules, true ) );
	}

	// If the Analytics module is active, but does not have an adsConversionID
	// set, the migration should not activate the Ads module.
	public function test_migration_with_no_analytics_ads_conversion_id_field() {

		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->options->set(
			Modules::OPTION_ACTIVE_MODULES,
			array( 'pagespeed-insights', 'analytics-4' )
		);

		$this->configure_analytics_module( false );

		$migration->migrate();

		$analytics_4_settings = $this->analytics_settings->get();
		$this->assertTrue( empty( $analytics_4_settings['adsConversionID'] ) );

		$ads_settings = $this->ads_settings->get();
		$this->assertTrue( empty( $ads_settings['conversionID'] ) );

		$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( in_array( 'ads', $active_modules, true ) );
	}

	// If the Analytics module is active but has an empty adsConversionID
	// set, the migration should not activate the Ads module.
	public function test_migration_with_empty_analytics_ads_conversion_id() {

		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->options->set(
			Modules::OPTION_ACTIVE_MODULES,
			array( 'pagespeed-insights', 'analytics-4' )
		);

		$this->configure_analytics_module( '' );

		$migration->migrate();

		$analytics_4_settings = $this->analytics_settings->get();
		$this->assertTrue( empty( $analytics_4_settings['adsConversionID'] ) );

		$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( in_array( 'ads', $active_modules, true ) );
	}

	// When the Analytics module is active and has an adsConversionID set,
	// and the Ads module is not active, the migration should activate the
	// Ads module and migrate the conversionID to the Ads module.
	public function test_migration_with_analytics_ads_conversion_id() {

		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->options->set(
			Modules::OPTION_ACTIVE_MODULES,
			array( 'pagespeed-insights', 'analytics-4' )
		);

		$this->configure_analytics_module( '1234567890' );

		$migration->migrate();

		$analytics_4_settings = $this->analytics_settings->get();
		$this->assertTrue( empty( $analytics_4_settings['adsConversionID'] ) );
		$this->assertEquals( '12845678', $analytics_4_settings['accountID'] );
		$this->assertTrue( ! empty( $analytics_4_settings['adsConversionIDMigratedAtMs'] ) );

		$ads_settings = $this->ads_settings->get();
		$this->assertEquals( '1234567890', $ads_settings['conversionID'] );

		$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );
		$this->assertTrue( in_array( 'ads', $active_modules, true ) );
	}

	// When the Ads module is already active and has an conversionID set,
	// the migration should not update the Ads module, but should remove the
	// adsConversionID from the Analytics module.
	public function test_migration_with_ads_conversion_id_already_set() {

		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->options->set(
			Modules::OPTION_ACTIVE_MODULES,
			array( 'pagespeed-insights', 'analytics-4', 'ads' )
		);

		$this->configure_analytics_module( '1234567890' );
		$this->configure_ads_module( '9876543210' );

		$migration->migrate();

		$analytics_4_settings = $this->analytics_settings->get();
		$this->assertTrue( empty( $analytics_4_settings['adsConversionID'] ) );
		$this->assertEquals( '12845678', $analytics_4_settings['accountID'] );
		$this->assertTrue( empty( $analytics_4_settings['adsConversionIDMigratedAtMs'] ) );

		$ads_settings = $this->ads_settings->get();
		$this->assertEquals( '9876543210', $ads_settings['conversionID'] );

		$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );
		$this->assertTrue( in_array( 'ads', $active_modules, true ) );
	}

	protected function configure_analytics_module( $adsConversionID ) {

		$options = array(
			'ownerID'   => get_current_user_id(),
			'accountID' => '12845678',
		);

		if ( false !== $adsConversionID ) {
			$options['adsConversionID'] = $adsConversionID;
		}

		$this->analytics_settings->set(
			$options
		);
	}

	protected function configure_ads_module( $conversionID ) {
		$options = array(
			'ownerID'       => get_current_user_id(),
			'extCustomerID' => '12845678',
		);

		if ( false !== $conversionID ) {
			$options['conversionID'] = $conversionID;
		}

		$this->ads_settings->set(
			$options
		);
	}

	protected function get_db_version() {
		return $this->options->get( Migration_Conversion_ID::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_Conversion_ID::DB_VERSION_OPTION );
	}
}
