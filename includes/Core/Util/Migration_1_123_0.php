<?php
/**
 * Migration for 1.123.0
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;

/**
 * Class Migration_1_123_0
 *
 * @since 1.123.0
 * @access private
 * @ignore
 */
class Migration_1_123_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.123.0';

	/**
	 * DB version option name.
	 */
	const DB_VERSION_OPTION = 'googlesitekit_db_version';

	/**
	 * Legacy analytics module slug.
	 */
	const LEGACY_ANALYTICS_MODULE_SLUG = 'analytics';

	/**
	 * Legacy analytics option name.
	 */
	const LEGACY_ANALYTICS_OPTION = 'googlesitekit_analytics_settings';

	/**
	 * Context instance.
	 *
	 * @since 1.123.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.123.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Analytics_Settings instance.
	 *
	 * @since 1.123.0
	 * @var Analytics_Settings
	 */
	protected $analytics_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.123.0
	 *
	 * @param Context $context Plugin context instance.
	 * @param Options $options Optional. Options instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null
	) {
		$this->context            = $context;
		$this->options            = $options ?: new Options( $context );
		$this->analytics_settings = new Analytics_Settings( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.123.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.123.0
	 */
	public function migrate() {
		$db_version = $this->options->get( self::DB_VERSION_OPTION );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_legacy_analytics_settings();
			$this->activate_analytics();
			$this->migrate_legacy_analytics_sharing_settings();

			$this->options->set( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Migrates the legacy analytics settings over to analytics-4.
	 *
	 * @since 1.123.0
	 */
	protected function migrate_legacy_analytics_settings() {
		if ( ! $this->analytics_settings->has() ) {
			return;
		}

		$legacy_settings = $this->options->get( self::LEGACY_ANALYTICS_OPTION );

		if ( empty( $legacy_settings ) ) {
			return;
		}

		$recovered_settings = array();
		$options_to_migrate = array(
			'accountID',
			'adsConversionID',
			'trackingDisabled',
		);

		array_walk(
			$options_to_migrate,
			function ( $setting ) use ( &$recovered_settings, $legacy_settings ) {
				$recovered_settings[ $setting ] = $legacy_settings[ $setting ];
			}
		);

		if ( ! empty( $recovered_settings ) ) {
			$this->analytics_settings->merge(
				$recovered_settings
			);
		}
	}

	/**
	 * Activates the analytics-4 module if the legacy analytics module was active.
	 *
	 * @since 1.123.0
	 */
	protected function activate_analytics() {
		$option = $this->options->get( Modules::OPTION_ACTIVE_MODULES );

		// Check legacy option.
		if ( ! is_array( $option ) ) {
			$option = $this->options->get( 'googlesitekit-active-modules' );
		}

		if ( ! is_array( $option ) ) {
			return;
		}

		$analytics_active = in_array( Analytics_4::MODULE_SLUG, $option, true );

		// If analytics-4 is already active, bail.
		if ( $analytics_active ) {
			return;
		}

		$legacy_analytics_active = in_array(
			self::LEGACY_ANALYTICS_MODULE_SLUG,
			$option,
			true
		);

		if ( $legacy_analytics_active ) {
			$option[] = Analytics_4::MODULE_SLUG;

			$this->options->set( Modules::OPTION_ACTIVE_MODULES, $option );
		}
	}

	/**
	 * Replicates sharing settings from the legacy analytics module to analytics-4.
	 *
	 * @since 1.123.0
	 */
	protected function migrate_legacy_analytics_sharing_settings() {
		$option = $this->options->get( Module_Sharing_Settings::OPTION );

		if ( ! is_array( $option ) ) {
			return;
		}

		// If sharing settings for analytics-4 already exist, bail.
		if ( isset( $option[ Analytics_4::MODULE_SLUG ] ) ) {
			return;
		}

		if ( isset( $option[ self::LEGACY_ANALYTICS_MODULE_SLUG ] ) ) {
			$option[ Analytics_4::MODULE_SLUG ] = $option[ self::LEGACY_ANALYTICS_MODULE_SLUG ];

			$this->options->set( Module_Sharing_Settings::OPTION, $option );
		}
	}
}
