<?php
/**
 * Migration for Audience Settings.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;

/**
 * Class Migration_1_163_0
 *
 * @since 1.163.0
 * @access private
 * @ignore
 */
class Migration_1_163_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.163.0';

	/**
	 * DB version option name.
	 */
	const DB_VERSION_OPTION = 'googlesitekit_db_version';

	/**
	 * Context instance.
	 *
	 * @since 1.163.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.163.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Sign_In_With_Google_Settings instance.
	 *
	 * @since 1.163.0
	 * @var Sign_In_With_Google_Settings
	 */
	protected $sign_in_with_google_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.163.0
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
		$this->sign_in_with_google_settings = new Sign_In_With_Google_Settings( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.163.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.163.0
	 */
	public function migrate() {
		$db_version = $this->options->get( self::DB_VERSION_OPTION );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_one_tap_enabled_setting();

			$this->options->set( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Migrates the One Tap Setting to the most conservative value based
	 * on previous user settings.
	 *
	 * Given the new setting is equivalent to the old setting of
	 * "One Tap on all pages", we only set One Tap to be enabled if
	 * the no-longer-used "One Tap on all pages" setting was set to true.
	 *
	 * @since 1.163.0
	 */
	protected function migrate_one_tap_enabled_setting() {
		if ( ! $this->sign_in_with_google_settings->has() ) {
			return;
		}

		$sign_in_with_google_settings = $this->sign_in_with_google_settings->get();

		if ( ! is_array( $sign_in_with_google_settings ) || empty( $sign_in_with_google_settings ) ) {
			return;
		}

		if ( true === $sign_in_with_google_settings['oneTapOnAllPages'] ) {
			$sign_in_with_google_settings['oneTapEnabled'] = true;
		} else {
			$sign_in_with_google_settings['oneTapEnabled'] = false;
		}

		unset( $sign_in_with_google_settings['oneTapOnAllPages'] );

		// Save the updated settings.
		$this->sign_in_with_google_settings->set( $sign_in_with_google_settings );
	}
}
