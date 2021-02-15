<?php
/**
 * Class Google\Site_Kit\Core\Util\Reset_Persistent
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class providing functions to reset the persistent plugin settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Reset_Persistent extends Reset {

	/**
	 * MySQL key pattern for all Site Kit keys.
	 */
	const KEY_PATTERN = 'googlesitekitpersistent\_%';

	/**
	 * REST API endpoint.
	 */
	const REST_ROUTE = 'core/site/data/reset-persistent';
}
