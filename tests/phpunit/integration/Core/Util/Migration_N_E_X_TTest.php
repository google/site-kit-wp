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
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_1_123_0;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Modules\Ads\Settings as Ads_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings as Reader_Revenue_Manager_Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
use Google\Site_Kit\Tests\TestCase;

class Migration_N_E_X_TTest extends TestCase {

	protected Context $context;
	protected Options $options;
	protected Analytics_Settings $analytics_settings;
	protected Audience_Settings $audience_settings;
	protected Ads_Settings $ads_settings;
	protected Sign_In_With_Google_Settings $sign_in_with_google_settings;
	protected Reader_Revenue_Manager_Settings $rrm_settings;

	public function set_up() {
		parent::set_up();

		$this->context                      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options                      = new Options( $this->context );
		$this->analytics_settings           = new Analytics_Settings( $this->options );
		$this->audience_settings            = new Audience_Settings( $this->options );
		$this->ads_settings                 = new Ads_Settings( $this->options );
		$this->sign_in_with_google_settings = new Sign_In_With_Google_Settings( $this->options );
		$this->rrm_settings                 = new Reader_Revenue_Manager_Settings( $this->options );

		$this->analytics_settings->register();
		$this->audience_settings->register();
		$this->ads_settings->register();
		$this->sign_in_with_google_settings->register();
		$this->rrm_settings->register();

		// Remove every option the migration reads or writes, so each test relies
		// only on the values it creates and stores.
		foreach ( $this->get_migrated_options() as $option ) {
			$this->options->delete( $option );
		}
		$this->options->delete( Migration_N_E_X_T::DB_VERSION_OPTION );
	}

	/**
	 * Gets a migration whose target version is above the current version.
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

	public function test_migrate__converts_settings_skipped_since_1_185_0() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Migration_N_E_X_T::DB_VERSION_OPTION, '1.185.0' );
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( 'analytics-4', 'sign-in-with-google', 'reader-revenue-manager' ) );
		$this->analytics_settings->set(
			array(
				'accountID'                            => '12345678',
				'adsConversionID'                      => 'AW-123456789',
				'availableAudiences'                   => array( array( 'name' => 'properties/123/audiences/1' ) ),
				'availableAudiencesLastSyncedAt'       => 1678886400,
				'audienceSegmentationSetupCompletedBy' => 2,
			)
		);
		$this->sign_in_with_google_settings->set(
			array(
				'clientID'         => '1234567890.googleusercontent.com',
				'oneTapEnabled'    => true,
				'oneTapOnAllPages' => true,
			)
		);
		$this->rrm_settings->set(
			array(
				'publicationID'       => 'test-pub-id',
				'contentPolicyStatus' => array(
					'contentPolicyState' => 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD',
					'policyInfoLink'     => 'https://example.com/policy-info',
				),
			)
		);

		$migration->migrate();

		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();
		$this->assertTrue( $sign_in_with_google_settings['oneTapEnabled'], 'One Tap should stay enabled when it was enabled on all pages.' );
		$this->assertArrayNotHasKey( 'oneTapOnAllPages', $sign_in_with_google_settings, 'The legacy `oneTapOnAllPages` key should be removed.' );

		$rrm_settings = $this->rrm_settings->get();
		$this->assertArrayNotHasKey( 'contentPolicyStatus', $rrm_settings, 'The legacy `contentPolicyStatus` key should be removed.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD', $rrm_settings['contentPolicyState'], 'The `contentPolicyState` should be copied from the legacy `contentPolicyStatus`.' );
		$this->assertSame( 'https://example.com/policy-info', $rrm_settings['policyInfoLink'], 'The `policyInfoLink` should be copied from the legacy `contentPolicyStatus`.' );

		$audience_settings = $this->audience_settings->get();
		$this->assertSame( array( array( 'name' => 'properties/123/audiences/1' ) ), $audience_settings['availableAudiences'], 'The `availableAudiences` should be moved to the Audience settings.' );
		$this->assertSame( 1678886400, $audience_settings['availableAudiencesLastSyncedAt'], 'The `availableAudiencesLastSyncedAt` should be moved to the Audience settings.' );
		$this->assertSame( 2, $audience_settings['audienceSegmentationSetupCompletedBy'], 'The `audienceSegmentationSetupCompletedBy` should be moved to the Audience settings.' );

		$analytics_settings = $this->analytics_settings->get();
		$this->assertArrayNotHasKey( 'availableAudiences', $analytics_settings, 'The `availableAudiences` should be removed from the Analytics settings.' );
		$this->assertArrayNotHasKey( 'availableAudiencesLastSyncedAt', $analytics_settings, 'The `availableAudiencesLastSyncedAt` should be removed from the Analytics settings.' );
		$this->assertArrayNotHasKey( 'audienceSegmentationSetupCompletedBy', $analytics_settings, 'The `audienceSegmentationSetupCompletedBy` should be removed from the Analytics settings.' );
		$this->assertTrue( empty( $analytics_settings['adsConversionID'] ), 'The `adsConversionID` should be removed from the Analytics settings.' );

		$this->assertSame( 'AW-123456789', $this->ads_settings->get()['conversionID'], 'The Analytics `adsConversionID` should be moved to the Ads settings.' );
		$this->assertContains( 'ads', $this->options->get( Modules::OPTION_ACTIVE_MODULES ), 'The Ads module should be activated.' );
	}

	public function test_migrate__migrates_the_legacy_analytics_module() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( 'pagespeed-insights', 'analytics' ) );
		$this->options->set(
			Module_Sharing_Settings::OPTION,
			array(
				'analytics' => array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'owner',
				),
			)
		);
		$this->options->set(
			Migration_1_123_0::LEGACY_ANALYTICS_OPTION,
			array(
				'accountID'        => '12345678',
				'adsConversionID'  => 'AW-123456789',
				'trackingDisabled' => array( 'loggedinUsers' ),
			)
		);
		$this->analytics_settings->set(
			array(
				'accountID'  => '',
				'propertyID' => '987654321',
			)
		);

		$migration->migrate();

		$analytics_settings = $this->analytics_settings->get();
		$this->assertSame( '12345678', $analytics_settings['accountID'], 'The legacy `accountID` should be copied to the Analytics 4 settings.' );
		$this->assertSame( array( 'loggedinUsers' ), $analytics_settings['trackingDisabled'], 'The legacy `trackingDisabled` should be copied to the Analytics 4 settings.' );
		$this->assertTrue( empty( $analytics_settings['adsConversionID'] ), 'The legacy `adsConversionID` should be removed from the Analytics 4 settings.' );

		$this->assertSame( 'AW-123456789', $this->ads_settings->get()['conversionID'], 'The legacy `adsConversionID` should be moved to the Ads settings.' );
		$this->assertSame(
			array( 'pagespeed-insights', 'analytics', 'analytics-4', 'ads' ),
			$this->options->get( Modules::OPTION_ACTIVE_MODULES ),
			'Analytics 4 and Ads should be activated.'
		);
		$this->assertSame(
			array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			$this->options->get( Module_Sharing_Settings::OPTION )['analytics-4'],
			'The `analytics` sharing settings should be copied to `analytics-4`.'
		);
	}

	public function test_migrate__skips_the_legacy_analytics_module_when_analytics_4_is_active() {
		$migration = $this->get_new_migration_instance();

		$active_modules = array( 'analytics', 'analytics-4' );
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, $active_modules );
		$this->options->set(
			Migration_1_123_0::LEGACY_ANALYTICS_OPTION,
			array(
				'accountID'       => '12345678',
				'adsConversionID' => 'AW-123456789',
			)
		);
		$this->analytics_settings->set( array( 'accountID' => '' ) );

		$migration->migrate();

		$this->assertSame( '', $this->analytics_settings->get()['accountID'], 'The legacy `accountID` should not be copied when Analytics 4 is already active.' );
		$this->assertSame( $active_modules, $this->options->get( Modules::OPTION_ACTIVE_MODULES ), 'The active modules should not change.' );
		$this->assertOptionNotExists( Ads_Settings::OPTION );
	}

	public function test_migrate__skips_the_legacy_analytics_module_without_analytics_4_settings() {
		$migration = $this->get_new_migration_instance();

		$active_modules = array( 'analytics' );
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, $active_modules );
		$this->options->set( Migration_1_123_0::LEGACY_ANALYTICS_OPTION, array( 'accountID' => '12345678' ) );

		$migration->migrate();

		$this->assertSame( $active_modules, $this->options->get( Modules::OPTION_ACTIVE_MODULES ), 'Analytics 4 should not be activated when no Analytics 4 settings are stored.' );
		$this->assertOptionNotExists( Analytics_Settings::OPTION );
	}

	public function test_migrate__keeps_stored_audience_settings() {
		$migration = $this->get_new_migration_instance();

		$stored_audience_settings = array(
			'availableAudiences'                   => array( array( 'name' => 'properties/123/audiences/2' ) ),
			'availableAudiencesLastSyncedAt'       => 1700000000,
			'audienceSegmentationSetupCompletedBy' => 3,
		);
		$this->audience_settings->set( $stored_audience_settings );
		$this->analytics_settings->set(
			array(
				'accountID'                            => '12345678',
				'availableAudiences'                   => array( array( 'name' => 'properties/123/audiences/1' ) ),
				'availableAudiencesLastSyncedAt'       => 1678886400,
				'audienceSegmentationSetupCompletedBy' => 2,
			)
		);

		$migration->migrate();

		$this->assertSame( $stored_audience_settings, $this->audience_settings->get(), 'Stored Audience settings should not be overwritten by old keys in the Analytics settings.' );

		$analytics_settings = $this->analytics_settings->get();
		$this->assertArrayNotHasKey( 'availableAudiences', $analytics_settings, 'The `availableAudiences` should be removed from the Analytics settings.' );
		$this->assertArrayNotHasKey( 'availableAudiencesLastSyncedAt', $analytics_settings, 'The `availableAudiencesLastSyncedAt` should be removed from the Analytics settings.' );
		$this->assertArrayNotHasKey( 'audienceSegmentationSetupCompletedBy', $analytics_settings, 'The `audienceSegmentationSetupCompletedBy` should be removed from the Analytics settings.' );
	}

	public function test_migrate__keeps_one_tap_disabled_when_enabled_on_all_pages() {
		$migration = $this->get_new_migration_instance();

		$this->sign_in_with_google_settings->set(
			array(
				'oneTapEnabled'    => false,
				'oneTapOnAllPages' => true,
			)
		);

		$migration->migrate();

		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();
		$this->assertFalse( $sign_in_with_google_settings['oneTapEnabled'], 'One Tap should stay disabled when `oneTapEnabled` is false.' );
		$this->assertArrayNotHasKey( 'oneTapOnAllPages', $sign_in_with_google_settings, 'The legacy `oneTapOnAllPages` key should be removed.' );
	}

	public function test_migrate__disables_one_tap_when_not_enabled_on_all_pages() {
		$migration = $this->get_new_migration_instance();

		$this->sign_in_with_google_settings->set(
			array(
				'oneTapEnabled'    => true,
				'oneTapOnAllPages' => false,
			)
		);

		$migration->migrate();

		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();
		$this->assertFalse( $sign_in_with_google_settings['oneTapEnabled'], 'One Tap should be disabled when it was limited to login pages.' );
		$this->assertArrayNotHasKey( 'oneTapOnAllPages', $sign_in_with_google_settings, 'The legacy `oneTapOnAllPages` key should be removed.' );
	}

	public function test_migrate__keeps_one_tap_without_the_legacy_key() {
		$migration = $this->get_new_migration_instance();

		$this->sign_in_with_google_settings->set( array( 'oneTapEnabled' => true ) );

		$migration->migrate();

		$this->assertTrue( $this->sign_in_with_google_settings->get()['oneTapEnabled'], 'One Tap should stay enabled when the settings have no `oneTapOnAllPages` key.' );
	}

	public function test_migrate__keeps_an_existing_ads_conversion_id() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( 'analytics-4', 'ads' ) );
		$this->analytics_settings->set( array( 'adsConversionID' => 'AW-123456789' ) );
		$this->ads_settings->set( array( 'conversionID' => 'AW-987654321' ) );

		$migration->migrate();

		$this->assertSame( 'AW-987654321', $this->ads_settings->get()['conversionID'], 'An existing Ads `conversionID` should not be overwritten.' );
		$this->assertTrue( empty( $this->analytics_settings->get()['adsConversionID'] ), 'The `adsConversionID` should be removed from the Analytics settings.' );
	}

	public function test_migrate__skips_ads_when_inactive_without_ads_settings() {
		$migration = $this->get_new_migration_instance();

		$active_modules = array( 'analytics-4' );
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, $active_modules );
		$this->analytics_settings->set( array( 'accountID' => '12345678' ) );

		$migration->migrate();

		$this->assertSame( $active_modules, $this->options->get( Modules::OPTION_ACTIVE_MODULES ), 'Ads should not be activated without a conversion ID.' );
		$this->assertOptionNotExists( Ads_Settings::OPTION );
	}

	public function test_migrate__changes_nothing_on_a_fresh_install() {
		$migration = $this->get_new_migration_instance();

		$options_before = $this->get_site_kit_option_names();

		$migration->migrate();

		$this->assertSame(
			array( Migration_N_E_X_T::DB_VERSION_OPTION ),
			array_values( array_diff( $this->get_site_kit_option_names(), $options_before ) ),
			'The database version should be the only option the migration creates on a fresh install.'
		);
		$this->assertSame( $migration::DB_VERSION, $this->options->get( Migration_N_E_X_T::DB_VERSION_OPTION ), "Database version should update to the migration's target version on a fresh install." );
	}

	public function test_migrate__sets_db_version() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Migration_N_E_X_T::DB_VERSION_OPTION, '1.185.0' );

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

		$this->sign_in_with_google_settings->set(
			array(
				'oneTapEnabled'    => true,
				'oneTapOnAllPages' => false,
			)
		);

		$migration->migrate();

		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();
		$this->assertTrue( $sign_in_with_google_settings['oneTapEnabled'], 'Migration should leave `oneTapEnabled` alone when the database version already matches its target.' );
		$this->assertArrayHasKey( 'oneTapOnAllPages', $sign_in_with_google_settings, 'Migration should leave `oneTapOnAllPages` alone when the database version already matches its target.' );
	}

	/**
	 * Gets the names of every stored Site Kit option.
	 */
	protected function get_site_kit_option_names() {
		global $wpdb;

		return $wpdb->get_col(
			$wpdb->prepare( "SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s", 'googlesitekit\_%' )
		);
	}

	/**
	 * Gets the options the migration reads or writes, other than the database version.
	 */
	protected function get_migrated_options() {
		return array(
			Modules::OPTION_ACTIVE_MODULES,
			Module_Sharing_Settings::OPTION,
			Migration_1_123_0::LEGACY_ANALYTICS_OPTION,
			Analytics_Settings::OPTION,
			Audience_Settings::OPTION,
			Ads_Settings::OPTION,
			Sign_In_With_Google_Settings::OPTION,
			Reader_Revenue_Manager_Settings::OPTION,
		);
	}
}
