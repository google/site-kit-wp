<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class WaitingToRecurDetails extends \Google\Model
{
  /**
   * @var bool
   */
  public $freeTrial;
  /**
   * @var string
   */
  public $nextRecurrenceTime;

  /**
   * @param bool
   */
  public function setFreeTrial($freeTrial)
  {
    $this->freeTrial = $freeTrial;
  }
  /**
   * @return bool
   */
  public function getFreeTrial()
  {
    return $this->freeTrial;
  }
  /**
   * @param string
   */
  public function setNextRecurrenceTime($nextRecurrenceTime)
  {
    $this->nextRecurrenceTime = $nextRecurrenceTime;
  }
  /**
   * @return string
   */
  public function getNextRecurrenceTime()
  {
    return $this->nextRecurrenceTime;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(WaitingToRecurDetails::class, 'Google_Service_SubscribewithGoogle_WaitingToRecurDetails');
