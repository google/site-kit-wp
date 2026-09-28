<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Verification_File
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\Util\URL;

/**
 * Class representing the site verification file token for a user.
 *
 * @since 1.1.0
 * @access private
 * @ignore
 */
final class Verification_File extends User_Setting {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekit_site_verification_file';

	/**
	 * Checks whether the site supports the file verification method.
	 *
	 * File verification is only possible when the site is served from the
	 * root of its domain, as the verification file must be served from there.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @return bool True if file verification is supported, false otherwise.
	 */
	public static function is_supported( Context $context ) {
		$home_path = URL::parse( $context->get_canonical_home_url(), PHP_URL_PATH );

		return ! $home_path || '/' === $home_path;
	}
}
