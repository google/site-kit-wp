<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Verification_Evidence
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for determining the site verification evidence reported to the proxy.
 *
 * The evidence is the verification method the current user has a stored token
 * for, which the service uses to re-register the verification rather than
 * relying on the Site Verification API alone.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Verification_Evidence {

	const FILE = 'FILE';
	const META = 'META';
	const NONE = 'none';

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context           $context      Plugin context.
	 * @param User_Options|null $user_options Optional. User_Options instance. Default is a new instance for the current user.
	 */
	public function __construct( Context $context, ?User_Options $user_options = null ) {
		$this->context      = $context;
		$this->user_options = $user_options ?: new User_Options( $context );
	}

	/**
	 * Gets the verification method the user has stored evidence for.
	 *
	 * Takes the first match in order of preference: a file token when the site
	 * supports file verification, then a meta token. The value is read on every
	 * call so that it always reflects the most recently stored token.
	 *
	 * @since n.e.x.t
	 *
	 * @return string One of `FILE`, `META` or `none`.
	 */
	public function get() {
		if (
			( new Verification_File( $this->user_options ) )->get()
			&& Verification_File::is_supported( $this->context )
		) {
			return self::FILE;
		}

		if ( ( new Verification_Meta( $this->user_options ) )->get() ) {
			return self::META;
		}

		return self::NONE;
	}
}
