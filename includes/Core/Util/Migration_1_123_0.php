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
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;

/**
 * Class Migration_1_123_0
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Migration_1_123_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.123.0';

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected $options;

	/**
	 * Analytics_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_Settings
	 */
	protected $analytics_settings;

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
		Options $options = null
	) {
		$this->context            = $context;
		$this->options            = $options ?: new Options( $context );
		$this->analytics_settings = new Analytics_Settings( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since n.e.x.t
	 */
	public function migrate() {
		$db_version = $this->options->get( 'googlesitekit_db_version' );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_legacy_analytics_settings();
			$this->activate_analytics();

			$this->options->set( 'googlesitekit_db_version', self::DB_VERSION );
		}
	}

	/**
	 * Migrates the legacy analytics settings over to analytics-4.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_legacy_analytics_settings() {
		if ( ! $this->analytics_settings->has() ) {
			return;
		}

		$legacy_settings = $this->options->get( 'googlesitekit_analytics_settings' );

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
			function( $setting ) use ( &$recovered_settings, $legacy_settings ) {
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
	 * @since n.e.x.t
	 */
	protected function activate_analytics() {
		$option = $this->options->get( Modules::OPTION_ACTIVE_MODULES );

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

		$legacy_analytics_active = in_array( 'analytics', $option, true );

		if ( $legacy_analytics_active ) {
			$option[] = Analytics_4::MODULE_SLUG;

			$this->options->set( Modules::OPTION_ACTIVE_MODULES, $option );
		}
	}
}
