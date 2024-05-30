<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Has_Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the Ads tag guard.
 *
 * @since 1.124.0
 * @since 1.128.0 Renamed class to be specific to presence of web tag.
 * @access private
 * @ignore
 */
class Has_Tag_Guard extends Module_Tag_Guard {
	/**
	 * Modules tag_id value.
	 *
	 * @since 1.128.0
	 *
	 * @var String
	 */
	protected $tag_id;

	/**
	 * Class constructor.
	 *
	 * @since 1.128.0
	 *
	 * @param string $tag_id Modules web tag string value.
	 */
	public function __construct( $tag_id = '' ) {
		$this->tag_id = $tag_id;
	}

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.124.0
	 * @since 1.128.0 Updated logic to check modules tag_id value..
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		return ! empty( $this->tag_id );
	}

}
