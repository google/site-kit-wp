<?php
/**
 * Migration for Reader Revenue Manager Content Policy Status Settings.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings as Reader_Revenue_Manager_Settings;

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
	 * Reader_Revenue_Manager_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Reader_Revenue_Manager_Settings
	 */
	protected $rrm_settings;

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
		$this->rrm_settings = new Reader_Revenue_Manager_Settings( $this->options );
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
			$this->migrate_rrm_content_policy_status();

			$this->options->set( self::DB_VERSION_OPTION, self::DB_VERSION );
		}
	}

	/**
	 * Migrates the legacy nested `contentPolicyStatus` setting into
	 * flat `contentPolicyState` and `policyInfoLink` settings.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_rrm_content_policy_status() {
		if ( ! $this->rrm_settings->has() ) {
			return;
		}

		$rrm_settings = $this->rrm_settings->get();

		if ( ! is_array( $rrm_settings ) || empty( $rrm_settings ) ) {
			return;
		}

		if ( ! array_key_exists( 'contentPolicyStatus', $rrm_settings ) ) {
			return;
		}

		$content_policy_status = (array) $rrm_settings['contentPolicyStatus'];

		$rrm_settings['contentPolicyState'] = $content_policy_status['contentPolicyState'] ?? '';
		$rrm_settings['policyInfoLink']     = $content_policy_status['policyInfoLink'] ?? null;

		unset( $rrm_settings['contentPolicyStatus'] );

		$this->rrm_settings->set( $rrm_settings );
	}
}
