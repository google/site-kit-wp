<?php
/**
 * Interface Google\Site_Kit\Core\Golinks\Golink_Handler_Interface
 *
 * @package   Google\Site_Kit\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Golinks;

use Google\Site_Kit\Context;
use WP_Error;

/**
 * Interface for golink handlers.
 *
 * @since 1.174.0
 * @access private
 * @ignore
 */
interface Golink_Handler_Interface {

	/**
	 * Builds the destination URL for a golink request.
	 *
	 * @since 1.174.0
	 *
	 * @param Context $context Plugin context.
	 * @return string|WP_Error Destination URL or error.
	 */
	public function handle( Context $context );
}
