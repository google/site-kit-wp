<?php
/**
 * Class Google\Site_Kit\Core\Util\Plugin_Version
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Storage\Options;

/**
 * Class for storing the installed plugin version in an option.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Plugin_Version {

	const OPTION = 'googlesitekit_version';

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	private $options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Options $options Options instance.
	 */
	public function __construct( Options $options ) {
		$this->options = $options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'update_version' ) );
	}

	/**
	 * Stores the running plugin version.
	 *
	 * Fires `googlesitekit_plugin_updated` when the write replaced a version the site had stored
	 * before.
	 *
	 * The version is saved on the first admin request after an update, as that is the first request
	 * that runs the code of the new release.
	 *
	 * @since n.e.x.t
	 */
	public function update_version() {
		$stored_version = $this->options->get( self::OPTION );

		if ( GOOGLESITEKIT_VERSION === $stored_version ) {
			return;
		}

		$this->options->set( self::OPTION, GOOGLESITEKIT_VERSION );

		// An empty stored version is a fresh install or a site that predates this option, neither
		// of which is an update of Site Kit.
		if ( ! empty( $stored_version ) ) {
			/**
			 * Fires when the stored plugin version changes.
			 *
			 * @since n.e.x.t
			 *
			 * @param string $stored_version The version the site was running before.
			 * @param string $new_version    The version the site is running now.
			 */
			do_action( 'googlesitekit_plugin_updated', $stored_version, GOOGLESITEKIT_VERSION );
		}
	}
}
