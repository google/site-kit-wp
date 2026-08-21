<?php
/**
 * Ninja_Forms_Model_Factory_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fakes the Ninja Forms `NF_Abstracts_ModelFactory` class, which wraps the form
 * for one ID and returns it from `get()`.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Ninja_Forms_Model_Factory_Fake {

	/**
	 * The form this factory wraps.
	 *
	 * @since 1.186.0
	 * @var Ninja_Forms_Form_Model_Fake
	 */
	private $form;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
	 *
	 * @param Ninja_Forms_Form_Model_Fake $form The form this factory wraps.
	 */
	public function __construct( Ninja_Forms_Form_Model_Fake $form ) {
		$this->form = $form;
	}

	/**
	 * Gets the form this factory wraps.
	 *
	 * @since 1.186.0
	 *
	 * @return Ninja_Forms_Form_Model_Fake The form this factory wraps.
	 */
	public function get() {
		return $this->form;
	}
}
