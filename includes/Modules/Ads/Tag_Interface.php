<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Tag_Interface
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

/**
 * Interface for an Ads tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Tag_Interface {

	/**
	 * Sets the ads conversion ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $ads_conversion_id Ads ID.
	 */
	public function set_ads_conversion_id( $ads_conversion_id );

}
