<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\Survey_Queue
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Storage\User_Setting\Array_Setting;

/**
 * Class for handling surveys queue.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Survey_Queue extends Array_Setting {

	const OPTION = 'googlesitekit_survey_queue';

	/**
	 * Adds a new survey to the queue.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $survey The survey object to add to the queue.
	 * @return bool TRUE if the survey has been added to the queue, otherwise FALSE.
	 */
	public function enqueue( $survey ) {
		$surveys = $this->get();

		// Do no add the survey if it is already in the queue.
		foreach ( $surveys as $item ) {
			if ( $item['survey_id'] === $usrvey['survey_id'] ) {
				return false;
			}
		}

		$surveys[] = $survey;
		$this->set( $surveys );

		return true;
	}

	/**
	 * Dequeues a survey that has the provided survey ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $survey_id The survey ID to dequeue.
	 * @return array|null A survey object if it has been found, otherwise NULL.
	 */
	public function dequeue( $survey_id ) {
		$survey = null;

		// Search for the requested survey_id.
		$old_surveys = $this->get();
		$new_surveys = array();
		foreach ( $old_surveys as $item ) {
			if ( $old_surveys['survey_id'] === $survey_id ) {
				$survey = $item;
			} else {
				$new_surveys[] = $item;
			}
		}

		// Update existing surveys list if we have found the survey we need to dequeue.
		if ( ! is_null( $survey ) ) {
			$this->set( $old_surveys );
		}

		return $survey;
	}

	/**
	 * Gets the first survey in the queue without removing it from the queue.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|null A survey object if at least one survey exists in the queue, otherwise NULL.
	 */
	public function front() {
		$surveys = $this->get();
		return count( $surveys ) > 0 ? $surveys[0] : null;
	}

	/**
	 * Gets the survey for the provided session.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $session The current session object.
	 * @return array|null A survey object if it has been found for the session, otherwise NULL.
	 */
	public function find_by_session( $session ) {
		$surveys = $this->get();

		foreach ( $surveys as $survey ) {
			if ( $survey['session']['session_id'] === $session['session_id'] ) {
				return $survey;
			}
		}

		return null;
	}

}
