<?php
/**
 * Migration for Google Tag Gateway health status decoupling.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Health;

/**
 * Class Migration_N_E_X_T
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
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected $options;

	/**
	 * Google_Tag_Gateway_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Tag_Gateway_Settings
	 */
	protected $gtg_settings;

	/**
	 * Google_Tag_Gateway_Health instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Tag_Gateway_Health
	 */
	protected $gtg_health;

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
		$this->context      = $context;
		$this->options      = $options ?: new Options( $context );
		$this->gtg_settings = new Google_Tag_Gateway_Settings( $this->options );
		$this->gtg_health   = new Google_Tag_Gateway_Health( $this->options );
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
		$db_version = $this->options->get( self::DB_VERSION_OPTION );

		if ( ! $db_version || version_compare( $db_version, self::DB_VERSION, '<' ) ) {
			$this->migrate_gtg_health_data();

			$this->options->set( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Migrates Google Tag Gateway health data from settings to separate health option.
	 *
	 * Extracts health monitoring data (isGTGHealthy, isScriptAccessEnabled) from the
	 * GTG settings option and migrates it to the new health option (isUpstreamHealthy,
	 * isMpathHealthy). Handles the isEnabled setting based on its value:
	 * - If isEnabled is true: keeps it as an explicit user choice
	 * - If isEnabled is false: removes the entire settings option (treats as default state)
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_gtg_health_data() {
		if ( ! $this->options->has( Google_Tag_Gateway_Settings::OPTION ) ) {
			return;
		}

		$gtg_settings = $this->gtg_settings->get();

		if ( ! is_array( $gtg_settings ) || empty( $gtg_settings ) ) {
			// Delete empty settings as they represent default state.
			$this->options->delete( Google_Tag_Gateway_Settings::OPTION );
			return;
		}

		// Migrate health data to new health option.
		$health_data = array(
			'isUpstreamHealthy' => $gtg_settings['isGTGHealthy'] ?? null,
			'isMpathHealthy'    => $gtg_settings['isScriptAccessEnabled'] ?? null,
		);

		$this->gtg_health->set( $health_data );

		// Delete existing option to remove deprecated health fields, then re-save only isEnabled if true.
		$this->options->delete( Google_Tag_Gateway_Settings::OPTION );

		if ( ! empty( $gtg_settings['isEnabled'] ) ) {
			// Keep isEnabled: true as explicit user choice.
			$this->gtg_settings->set( array( 'isEnabled' => true ) );
		}
	}
}
