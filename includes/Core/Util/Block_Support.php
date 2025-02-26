<?php
/**
 * Class Google\Site_Kit\Core\Util\Block_Support
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for block support checks.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Block_Support {

	/**
	 * Checks whether blocks are supported in Site Kit based on WordPress version.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if blocks are supported, false otherwise.
	 */
	public static function has_block_support() {
		// We currently require version WP 5.8 or higher to support blocks, as this is the version
		// where the `block.json` configuration format was introduced.
		return (bool) version_compare( '5.8', get_bloginfo( 'version' ), '<=' );
	}
}
