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
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;

/**
 * Class Migration_1_150_0
 *
 * @since 1.151.0
 * @access private
 * @ignore
 */
class Migration_1_150_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.150.0';

	/**
	 * DB version option name.
	 */
	const DB_VERSION_OPTION = 'googlesitekit_db_version';

	/**
	 * Context instance.
	 *
	 * @since 1.151.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.151.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Analytics_Settings instance.
	 *
	 * @since 1.151.0
	 * @var Analytics_Settings
	 */
	protected $analytics_settings;

	/**
	 * Audience_Settings instance.
	 *
	 * @since 1.151.0
	 * @var Audience_Settings
	 */
	protected $audience_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.151.0
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
		$this->audience_settings  = new Audience_Settings( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.151.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.151.0
	 */
	public function migrate() {
		$db_version = $this->options->get( self::DB_VERSION_OPTION );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_audience_settings();

			$this->options->set( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Migrates the Audience Settings from Analytics settings to new Audience settings.
	 *
	 * @since 1.151.0
	 */
	protected function migrate_audience_settings() {
		if ( ! $this->analytics_settings->has() ) {
			return;
		}

		$analytics_settings = $this->analytics_settings->get();

		if ( ! is_array( $analytics_settings ) || empty( $analytics_settings ) ) {
			return;
		}

		$audience_settings = (array) $this->audience_settings->get();

		$keys_to_migrate = array(
			'availableAudiences',
			'availableAudiencesLastSyncedAt',
			'audienceSegmentationSetupCompletedBy',
		);

		$has_migration = false;

		foreach ( $keys_to_migrate as $key ) {
			if ( array_key_exists( $key, $analytics_settings ) ) {
				$audience_settings[ $key ] = $analytics_settings[ $key ];
				unset( $analytics_settings[ $key ] );
				$has_migration = true;
			}
		}

		if ( $has_migration ) {
			$this->audience_settings->set( $audience_settings );
			$this->analytics_settings->set( $analytics_settings );
		}
	}
}
