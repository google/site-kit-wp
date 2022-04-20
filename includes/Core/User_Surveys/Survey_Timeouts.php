<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\Survey_Timeouts
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing user survey timeouts.
 *
 * @since 1.73.0
 * @access private
 * @ignore
 */
class Survey_Timeouts extends User_Setting {

	const OPTION = 'googlesitekit_survey_timeouts';

	/**
	 * Adds a timeout for the provided survey.
	 *
	 * @since 1.73.0
	 *
	 * @param string $survey  Survey name.
	 * @param int    $timeout Tiemout for the survey.
	 */
	public function add( $survey, $timeout ) {
		$surveys            = $this->get();
		$surveys[ $survey ] = time() + $timeout;

		$this->set( $surveys );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.73.0
	 *
	 * @return array Value set for the option, or default if not set.
	 */
	public function get() {
		$value = parent::get();
		return is_array( $value ) ? $value : $this->get_default();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.73.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.73.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.73.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return array( $this, 'filter_survey_timeouts' );
	}

	/**
	 * Gets survey timeouts.
	 *
	 * @since 1.73.0
	 *
	 * @return array Survey timeouts array.
	 */
	public function get_survey_timeouts() {
		$surveys = $this->get();
		$surveys = $this->filter_survey_timeouts( $surveys );

		return array_keys( $surveys );
	}

	/**
	 * Filters survey timeouts.
	 *
	 * @since 1.73.0
	 *
	 * @param array $items Survey timeouts list.
	 * @return array Filtered survey timeouts.
	 */
	private function filter_survey_timeouts( $items ) {
		$surveys = array();

		if ( is_array( $items ) ) {
			foreach ( $items as $item => $ttl ) {
				if ( $ttl > time() ) {
					$surveys[ $item ] = $ttl;
				}
			}
		}

		return $surveys;
	}

}
