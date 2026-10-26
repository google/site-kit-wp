<?php
/**
 * Migration for the settings migrations skipped since 1.185.0.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
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
 * overwriting values changed since.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Migration_N_E_X_T {
	use Active_Modules_Option_Trait;

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
				( new Migration_1_123_0( $this->context, $this->options ) )->apply_changes();
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
	 * slug, but its Analytics 4 settings were deleted, so it is skipped.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if Analytics 4 settings are stored and `analytics` is active without `analytics-4`.
	 */
	protected function is_legacy_analytics_active() {
		if ( ! $this->analytics_settings->has() ) {
			return false;
		}

		$active_modules = $this->get_active_modules_option();

		return in_array( Migration_1_123_0::LEGACY_ANALYTICS_MODULE_SLUG, $active_modules, true )
			&& ! in_array( Analytics_4::MODULE_SLUG, $active_modules, true );
	}

	/**
	 * Moves the audience keys from the Analytics settings to the Audience
	 * settings, keeping any value already stored in the Audience settings.
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

		if ( ! is_array( $audience_settings ) ) {
			$audience_settings = array();
		}

		$has_migration = false;

		foreach ( Migration_1_150_0::AUDIENCE_SETTINGS_KEYS as $key ) {
			if ( ! array_key_exists( $key, $analytics_settings ) ) {
				continue;
			}

			if ( empty( $audience_settings[ $key ] ) ) {
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
	 * Removes the legacy "One Tap on all pages" setting.
	 *
	 * One Tap stays enabled only when both `oneTapEnabled` and
	 * `oneTapOnAllPages` are true, so this can turn One Tap off but never on.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_one_tap_enabled_setting() {
		if ( ! $this->sign_in_with_google_settings->has() ) {
			return;
		}

		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();

		if (
			! is_array( $sign_in_with_google_settings ) ||
			! array_key_exists( 'oneTapOnAllPages', $sign_in_with_google_settings )
		) {
			return;
		}

		$sign_in_with_google_settings['oneTapEnabled'] = true === ( $sign_in_with_google_settings['oneTapEnabled'] ?? false )
			&& true === $sign_in_with_google_settings['oneTapOnAllPages'];

		unset( $sign_in_with_google_settings['oneTapOnAllPages'] );

		$this->sign_in_with_google_settings->set( $sign_in_with_google_settings );
	}
}
