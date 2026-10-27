<?php
/**
 * Migration for the settings changes skipped since 1.185.0.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;

/**
 * Class Migration_N_E_X_T.
 *
 * Sites that updated from 1.176.0 or earlier to 1.185.0 or later skipped the
 * older migrations, because `Migration_1_185_0` ran first and saved its
 * version. This migration runs their settings changes again, without
 * overwriting settings changed after that update.
 *
 * One Tap is the exception. A site that skipped 1.163.0 with One Tap enabled
 * but not on all pages has shown One Tap on every page since that update.
 * This migration turns One Tap off for it, as 1.163.0 does.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Migration_N_E_X_T {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = 'n.e.x.t';

	/**
	 * DB version option name.
	 */
	const DB_VERSION_OPTION = 'googlesitekit_db_version';

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected Context $context;

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected Options $options;

	/**
	 * Analytics_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_Settings
	 */
	protected Analytics_Settings $analytics_settings;

	/**
	 * Audience_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Audience_Settings
	 */
	protected Audience_Settings $audience_settings;

	/**
	 * Sign_In_With_Google_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Sign_In_With_Google_Settings
	 */
	protected Sign_In_With_Google_Settings $sign_in_with_google_settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context instance.
	 * @param Options $options Optional. Options instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null
	) {
		$this->context                      = $context;
		$this->options                      = $options ?: new Options( $context );
		$this->analytics_settings           = new Analytics_Settings( $this->options );
		$this->audience_settings            = new Audience_Settings( $this->options );
		$this->sign_in_with_google_settings = new Sign_In_With_Google_Settings( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ), 0 );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since n.e.x.t
	 */
	public function migrate() {
		$db_version = $this->options->get( self::DB_VERSION_OPTION );

		if ( ! $db_version || version_compare( $db_version, static::DB_VERSION, '<' ) ) {
			if ( $this->is_legacy_analytics_active() ) {
				$this->migrate_legacy_analytics_settings();
				$this->migrate_legacy_analytics_module();
			}

			( new Migration_1_129_0( $this->context, $this->options ) )->apply_changes();
			$this->migrate_audience_settings();
			$this->migrate_one_tap_enabled_setting();
			( new Migration_1_177_0( $this->context, $this->options ) )->apply_changes();

			$this->options->set( self::DB_VERSION_OPTION, static::DB_VERSION );
		}
	}

	/**
	 * Checks whether the legacy Analytics module is still active in place of
	 * Analytics 4.
	 *
	 * A site that turned Analytics off after migrating still lists the legacy
	 * slug, but its Analytics 4 settings were deleted, so this returns false.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if Analytics 4 settings are stored and `analytics` is active without `analytics-4`.
	 */
	protected function is_legacy_analytics_active() {
		if ( ! $this->analytics_settings->has() ) {
			return false;
		}

		$active_modules = $this->options->get( Modules::OPTION_ACTIVE_MODULES );

		return is_array( $active_modules )
			&& in_array( Migration_1_123_0::LEGACY_ANALYTICS_MODULE_SLUG, $active_modules, true )
			&& ! in_array( Analytics_4::MODULE_SLUG, $active_modules, true );
	}

	/**
	 * Copies the legacy Analytics settings over to Analytics 4.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_legacy_analytics_settings() {
		( new Migration_1_123_0( $this->context, $this->options ) )->migrate_legacy_analytics_settings();
	}

	/**
	 * Activates Analytics 4 and copies the legacy Analytics sharing settings.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_legacy_analytics_module() {
		$migration_1_123_0 = new Migration_1_123_0( $this->context, $this->options );
		$migration_1_123_0->activate_analytics();
		$migration_1_123_0->migrate_legacy_analytics_sharing_settings();
	}

	/**
	 * Moves the audience keys from the Analytics settings to the Audience
	 * settings, without overwriting a value the Audience settings already have.
	 *
	 * The keys are only removed, not copied, when their audiences belong to
	 * another property than the current one.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_audience_settings() {
		if ( ! $this->analytics_settings->has() ) {
			return;
		}

		$analytics_settings = $this->analytics_settings->get();

		if ( ! is_array( $analytics_settings ) || empty( $analytics_settings ) ) {
			return;
		}

		$audience_settings = $this->audience_settings->get();
		$audience_settings = is_array( $audience_settings ) ? $audience_settings : array();

		$is_current_property = $this->has_current_property_audiences( $analytics_settings );
		$has_migration       = false;

		foreach ( Migration_1_150_0::AUDIENCE_SETTINGS_KEYS as $key ) {
			if ( ! array_key_exists( $key, $analytics_settings ) ) {
				continue;
			}

			if ( $is_current_property && empty( $audience_settings[ $key ] ) ) {
				$audience_settings[ $key ] = $analytics_settings[ $key ];
			}

			unset( $analytics_settings[ $key ] );
			$has_migration = true;
		}

		if ( $has_migration ) {
			$this->audience_settings->set( $audience_settings );
			$this->analytics_settings->set( $analytics_settings );
		}
	}

	/**
	 * Checks whether the audiences in the Analytics settings belong to the
	 * current property.
	 *
	 * A site that changed its property after skipping 1.150.0 still has the
	 * old property's audiences in its Analytics settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $analytics_settings Analytics settings.
	 * @return bool True if every audience name starts with `properties/{propertyID}/` for the current property.
	 */
	protected function has_current_property_audiences( array $analytics_settings ) {
		$audiences = $analytics_settings['availableAudiences'] ?? null;

		if ( empty( $analytics_settings['propertyID'] ) || ! is_array( $audiences ) || empty( $audiences ) ) {
			return false;
		}

		$prefix = 'properties/' . $analytics_settings['propertyID'] . '/';

		foreach ( $audiences as $audience ) {
			if ( ! isset( $audience['name'] ) || 0 !== strpos( $audience['name'], $prefix ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Converts the legacy "One Tap on all pages" setting.
	 *
	 * Runs only when the stored settings still have `oneTapOnAllPages`, so
	 * One Tap is left as it is on a site without that key.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_one_tap_enabled_setting() {
		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();

		if (
			! is_array( $sign_in_with_google_settings ) ||
			! array_key_exists( 'oneTapOnAllPages', $sign_in_with_google_settings )
		) {
			return;
		}

		( new Migration_1_163_0( $this->context, $this->options ) )->apply_changes();
	}
}
