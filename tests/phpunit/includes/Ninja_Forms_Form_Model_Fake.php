<?php
/**
 * Ninja_Forms_Form_Model_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fakes the Ninja Forms `NF_Database_Models_Form` class, which returns the title
 * from `get_setting()`, and the default for every other setting.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Ninja_Forms_Form_Model_Fake {

	/**
	 * The title `get_setting()` returns, or an empty string when the form has no
	 * title.
	 *
	 * @since 1.186.0
	 * @var string
	 */
	private $title;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
	 *
	 * @param string $title The title `get_setting()` returns, or an empty string when the form has no title.
	 */
	public function __construct( $title ) {
		$this->title = $title;
	}

	/**
	 * Gets the title for the `title` setting, or the default for every other setting.
	 *
	 * @since 1.186.0
	 *
	 * @param string $setting       The setting name.
	 * @param mixed  $default_value Optional. The value to return for any setting other than `title`. Default false.
	 * @return mixed The title, or the default.
	 */
	public function get_setting( $setting, $default_value = false ) {
		if ( 'title' === $setting && '' !== $this->title ) {
			return $this->title;
		}

		return $default_value;
	}
}
