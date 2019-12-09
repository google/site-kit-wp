<?php
/**
 * Class Google\Site_Kit\Core\Util\Reset
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;

/**
 * Class providing functions to reset the plugin.
 *
 * @since 1.0.0
 * @since 1.1.1 Removed delete_all_plugin_options(), delete_all_user_metas() and delete_all_transients() methods.
 * @access private
 * @ignore
 */
final class Reset {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @since 1.1.1 Removed $options and $transients params.
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Deletes options, user stored options, transients and clears object cache for stored options.
	 *
	 * @since 1.0.0
	 */
	public function all() {
		$googlesitekit_reset_context = $this->context;

		// Call uninstaller.
		require $this->context->path( 'uninstall.php' );
	}
}
