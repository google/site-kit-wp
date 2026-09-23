<?php
/**
 * Class Google\Site_Kit\Core\Util\Plugin_Update
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class recording the plugin version the site is running.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Plugin_Update {

	/**
	 * Plugin version option name.
	 */
	const VERSION_OPTION = 'googlesitekit_version';

	/**
	 * Cron action recording the version once an update has been installed.
	 */
	const CRON_ACTION = 'googlesitekit_cron_update_version';

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	protected Options $options;

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
		$this->options = $options ?: new Options( $context );
	}

	/**
	 * Registers hooks.
	 *
	 * The version is recorded on two paths. `admin_init` covers every way a site can end up on a
	 * new release - admin update, auto-update, WP-CLI, SFTP, build pipeline, managed host - because
	 * it compares the stored version against the running one rather than listening for an update
	 * event. It runs at priority 20, after the migrations hooked to the same action, so the site
	 * fields synchronised by the write describe a database the new release has already migrated.
	 *
	 * The cron event scheduled from `upgrader_process_complete` records the version without waiting
	 * for the next admin request, which matters on sites whose administrator is not the one who
	 * triggered the update.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'update_version' ), 20 );
		add_action( 'upgrader_process_complete', array( $this, 'maybe_schedule_update_version' ), 10, 2 );
		add_action( self::CRON_ACTION, array( $this, 'update_version' ) );
	}

	/**
	 * Schedules the version to be recorded once WordPress has replaced the plugin files.
	 *
	 * `upgrader_process_complete` fires inside the request that performed the update, where the
	 * pre-update code is still loaded and `GOOGLESITEKIT_VERSION` is therefore the version being
	 * replaced. Recording it there would store the old value and, worse, make the stored and
	 * running versions agree on the next load, suppressing the comparison for good. The work is
	 * deferred to a one-off cron event instead, which runs in a later request that loads the new
	 * release.
	 *
	 * @since n.e.x.t
	 *
	 * @param \WP_Upgrader $upgrader   Upgrader instance. Unused.
	 * @param array        $hook_extra Arguments describing what was updated.
	 */
	public function maybe_schedule_update_version( $upgrader, $hook_extra ) {
		if ( ! $this->is_plugin_updated( $hook_extra ) ) {
			return;
		}

		if ( wp_next_scheduled( self::CRON_ACTION ) || wp_installing() ) {
			return;
		}

		wp_schedule_single_event( time(), self::CRON_ACTION );
	}

	/**
	 * Determines whether a completed upgrader run updated this plugin.
	 *
	 * WordPress names a single plugin in `plugin` and a bulk selection in `plugins`. A fresh
	 * install reports `install` without naming the plugin at all, so it is left to `admin_init`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $hook_extra Arguments describing what was updated.
	 * @return bool TRUE if this plugin was updated, FALSE otherwise.
	 */
	protected function is_plugin_updated( $hook_extra ) {
		if ( ! is_array( $hook_extra ) ) {
			return false;
		}

		$type   = isset( $hook_extra['type'] ) ? $hook_extra['type'] : '';
		$action = isset( $hook_extra['action'] ) ? $hook_extra['action'] : '';

		if ( 'plugin' !== $type || 'update' !== $action ) {
			return false;
		}

		if ( isset( $hook_extra['plugins'] ) ) {
			$plugins = (array) $hook_extra['plugins'];
		} elseif ( isset( $hook_extra['plugin'] ) ) {
			$plugins = (array) $hook_extra['plugin'];
		} else {
			$plugins = array();
		}

		return in_array( GOOGLESITEKIT_PLUGIN_BASENAME, $plugins, true );
	}

	/**
	 * Stores the running plugin version when the site has no version stored or stores another one.
	 *
	 * @since n.e.x.t
	 */
	public function update_version() {
		if ( GOOGLESITEKIT_VERSION === $this->options->get( self::VERSION_OPTION ) ) {
			return;
		}

		$this->options->set( self::VERSION_OPTION, GOOGLESITEKIT_VERSION );
	}
}
