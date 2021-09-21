<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Google_API\Google_API_Base
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub\Google_API;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Google_API\Google_API;

/**
 * Base class for Idea Hub API.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 *
 * @property-read Context $context Plugin context.
 */
abstract class Google_API_Base extends Google_API {

	/**
	 * Gets the parent slug to use for Idea Hub API requests.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Parent slug.
	 */
	protected function get_parent_slug() {
		$reference_url = $this->context->get_reference_site_url();
		$reference_url = rawurlencode( $reference_url );

		return "platforms/sitekit/properties/{$reference_url}";
	}

}
