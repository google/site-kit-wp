<?php
/**
 * Site Kit Cache CLI Commands
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\CLI;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Reset;
use WP_CLI;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

WP_CLI::add_command( 'google-site-kit reset', __NAMESPACE__ . '\reset' );

/**
 * Resets Site Kit Settings and Data
 *
 * @since 1.0.0
 */
function reset() {
	$reset = new Reset( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	$reset->all();

	WP_CLI::success( 'Settings successfully reset.' );
}
