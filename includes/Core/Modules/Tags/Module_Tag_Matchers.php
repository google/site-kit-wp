<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Tags
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Tags\Tag_Matchers_Interface;

/**
 * Base class for Tag matchers.
 *
 * @since 1.119.0
 * @access private
 * @ignore
 */
abstract class Module_Tag_Matchers implements Tag_Matchers_Interface {

	const NO_TAG_FOUND             = 0;
	const TAG_EXISTS               = 1;
	const TAG_EXISTS_WITH_COMMENTS = 2;

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since 1.119.0
	 *
	 * @return array Array of regex matchers.
	 */
	abstract public function regex_matchers();

}
