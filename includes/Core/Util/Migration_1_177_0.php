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
 * Class Migration_1_177_0
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Migration_1_177_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.177.0';

	/**
	 * DB version option name.
	 */
	const DB_VERSION_OPTION = 'googlesitekit_db_version';

	/**
	 * Context instance.
	 *
	 * @since 1.177.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.177.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Reader_Revenue_Manager_Settings instance.
	 *
	 * @since 1.177.0
	 * @var Reader_Revenue_Manager_Settings
	 */
	protected $rrm_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
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
	 * @since 1.177.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.177.0
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
	 * @since 1.177.0
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
		$rrm_settings['policyInfoLink']     = $content_policy_status['policyInfoLink'] ?? '';

		unset( $rrm_settings['contentPolicyStatus'] );

		$this->rrm_settings->set( $rrm_settings );
	}
}
