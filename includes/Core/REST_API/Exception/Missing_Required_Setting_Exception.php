<?php
/**
 * Class Missing_Required_Setting_Exception
 *
 * @package   Google\Site_Kit\Core\REST_API\Exception
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API\Exception;

use Exception;
use Google\Site_Kit\Core\Contracts\WP_Errorable;
use WP_Error;

/**
 * Class for representing a missing required setting.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Missing_Required_Setting_Exception extends Exception implements WP_Errorable {

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $setting_name Missing setting name.
	 */
	public function __construct( $setting_name ) {
		parent::__construct(
			/* translators: %s: Missing setting name */
			sprintf( __( 'Required setting is missing: %s.', 'google-site-kit' ), $setting_name )
		);
	}

	/**
	 * Gets the WP_Error representation of this exception.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Error Error representation.
	 */
	public function to_wp_error() {
		return new WP_Error(
			'missing_required_setting',
			$this->getMessage(),
			array(
				'status' => 500, // Internal server error.
			)
		);
	}
}
