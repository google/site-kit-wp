<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_1_123_0Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_1_123_0;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_123_0Test extends TestCase {

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

		$this->set_legacy_options();
		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_1_123_0(
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

	public function test_migrate() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->reset_analytics_4_options();

		// Set initial active modules where it doesn't include analytics-4.
		$this->options->set(
			Modules::OPTION_ACTIVE_MODULES,
			array( 'pagespeed-insights', 'analytics' )
		);

		// Set initial sharing settings where it doesn't include analytics-4.
		$this->options->set(
			Module_Sharing_Settings::OPTION,
			array(
				'pagespeed-insights' => array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				),
				'analytics'          => array(
					'sharedRoles' => array( 'administrator' ),
					'management'  => 'owner',
				),
			)
		);

		$migration->migrate();

		$legacy_settings      = get_option( 'googlesitekit_analytics_settings' );
		$analytics_4_settings = $this->analytics_settings->get();
		$migrated_keys        = array(
			'accountID',
			'adsConversionID',
			'trackingDisabled',
		);

		$this->assertEquals(
			$this->filter_settings( $analytics_4_settings, $migrated_keys ),
			$this->filter_settings( $legacy_settings, $migrated_keys )
		);

		// Verify that analytics-4 is now included in active modules.
		$this->assertEquals(
			$this->options->get( Modules::OPTION_ACTIVE_MODULES ),
			array( 'pagespeed-insights', 'analytics', 'analytics-4' )
		);

		// Verify that analytics-4 now has duplicate sharing settings.
		$this->assertEquals(
			$this->options->get( Module_Sharing_Settings::OPTION ),
			array(
				'pagespeed-insights' => array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				),
				'analytics'          => array(
					'sharedRoles' => array( 'administrator' ),
					'management'  => 'owner',
				),
				'analytics-4'        => array(
					'sharedRoles' => array( 'administrator' ),
					'management'  => 'owner',
				),
			)
		);

		$this->assertEquals( Migration_1_123_0::DB_VERSION, $this->get_db_version() );
	}

	protected function filter_settings( $settings, $keys_to_filter ) {
		return array_filter(
			$settings,
			function ( $key ) use ( $keys_to_filter ) {
				if ( in_array( $key, $keys_to_filter, true ) ) {
					return true;
				}

				return false;
			},
			ARRAY_FILTER_USE_KEY
		);
	}

	protected function reset_analytics_4_options() {
		// Set initial Analytics 4 module settings.
		$this->analytics_settings->merge(
			array(
				'accountID'        => '', // Simulate an empty account id.
				'propertyID'       => '987654321',
				'webDataStreamID'  => '1234567890',
				'measurementID'    => 'G-A1B2C3D4E5',
				'trackingDisabled' => array( 'loggedinUsers' ),
				'useSnippet'       => true,
				'adSenseLinked'    => false,
				'ownerID'          => get_current_user_id(),
			)
		);
	}

	protected function set_legacy_options() {
		$this->options->set(
			Migration_1_123_0::LEGACY_ANALYTICS_OPTION,
			array(
				'ownerID'               => get_current_user_id(),
				'accountID'             => '12345678',
				'adsenseLinked'         => true,
				'adsConversionID'       => '111111',
				'anonymizeIP'           => true,
				'internalWebPropertyID' => '',
				'profileID'             => '',
				'propertyID'            => '',
				'trackingDisabled'      => array(),
				'useSnippet'            => false,
			)
		);
	}

	protected function get_db_version() {
		return $this->options->get( Migration_1_123_0::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_1_123_0::DB_VERSION_OPTION );
	}
}
