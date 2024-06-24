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

class RecurrenceTerms extends \Google\Model
{
  /**
   * @var string
   */
  public $accountOnHoldMillis;
  protected $freeTrialPeriodType = RecurrenceDuration::class;
  protected $freeTrialPeriodDataType = '';
  /**
   * @var string
   */
  public $gracePeriodMillis;
  protected $recurrencePeriodType = RecurrenceDuration::class;
  protected $recurrencePeriodDataType = '';

  /**
   * @param string
   */
  public function setAccountOnHoldMillis($accountOnHoldMillis)
  {
    $this->accountOnHoldMillis = $accountOnHoldMillis;
  }
  /**
   * @return string
   */
  public function getAccountOnHoldMillis()
  {
    return $this->accountOnHoldMillis;
  }
  /**
   * @param RecurrenceDuration
   */
  public function setFreeTrialPeriod(RecurrenceDuration $freeTrialPeriod)
  {
    $this->freeTrialPeriod = $freeTrialPeriod;
  }
  /**
   * @return RecurrenceDuration
   */
  public function getFreeTrialPeriod()
  {
    return $this->freeTrialPeriod;
  }
  /**
   * @param string
   */
  public function setGracePeriodMillis($gracePeriodMillis)
  {
    $this->gracePeriodMillis = $gracePeriodMillis;
  }
  /**
   * @return string
   */
  public function getGracePeriodMillis()
  {
    return $this->gracePeriodMillis;
  }
  /**
   * @param RecurrenceDuration
   */
  public function setRecurrencePeriod(RecurrenceDuration $recurrencePeriod)
  {
    $this->recurrencePeriod = $recurrencePeriod;
  }
  /**
   * @return RecurrenceDuration
   */
  public function getRecurrencePeriod()
  {
    return $this->recurrencePeriod;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(RecurrenceTerms::class, 'Google_Service_SubscribewithGoogle_RecurrenceTerms');
