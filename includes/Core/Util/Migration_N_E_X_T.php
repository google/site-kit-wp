<?php
/**
 * Migration for the Key Metrics widget area hidden setting.
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Is_Widget_Area_Hidden;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * Class Migration_N_E_X_T.
 *
 * Earlier versions hid Key Metrics for the whole site every time an admin
 * started a Google sign-in, even when Analytics was already connected. This
 * migration shows Key Metrics again on sites where Analytics is connected.
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
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected Options $options;

	/**
	 * Key_Metrics_Setup_Is_Widget_Area_Hidden instance.
	 *
	 * @since n.e.x.t
	 * @var Key_Metrics_Setup_Is_Widget_Area_Hidden
	 */
	protected Key_Metrics_Setup_Is_Widget_Area_Hidden $key_metrics_setup_is_widget_area_hidden;

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
		$this->options                                 = $options ?: new Options( $context );
		$this->key_metrics_setup_is_widget_area_hidden = new Key_Metrics_Setup_Is_Widget_Area_Hidden( $this->options );
	}

	/**
	 * Registers hooks.
	 *
	 * All migrations register at priority 0, so they run in the order
	 * `Plugin.php` registers them.
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
			$this->migrate_key_metrics_setup_is_widget_area_hidden();

			$this->options->set( self::DB_VERSION_OPTION, static::DB_VERSION );
		}
	}

	/**
	 * Deletes the Key Metrics widget area hidden setting when Analytics is
	 * connected.
	 *
	 * @since n.e.x.t
	 */
	protected function migrate_key_metrics_setup_is_widget_area_hidden() {
		if ( ! apply_filters( 'googlesitekit_is_module_connected', false, Analytics_4::MODULE_SLUG ) ) {
			return;
		}

		$this->key_metrics_setup_is_widget_area_hidden->delete();
	}
}
