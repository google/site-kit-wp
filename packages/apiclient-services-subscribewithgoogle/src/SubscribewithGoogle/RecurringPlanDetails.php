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

class RecurringPlanDetails extends \Google\Model
{
  protected $canceledDetailsType = CanceledDetails::class;
  protected $canceledDetailsDataType = '';
  protected $recurrenceTermsType = RecurrenceTerms::class;
  protected $recurrenceTermsDataType = '';
  /**
   * @var string
   */
  public $recurringPlanState;
  protected $suspendedDetailsType = SuspendedDetails::class;
  protected $suspendedDetailsDataType = '';
  /**
   * @var string
   */
  public $updateTime;
  protected $waitingToRecurDetailsType = WaitingToRecurDetails::class;
  protected $waitingToRecurDetailsDataType = '';

  /**
   * @param CanceledDetails
   */
  public function setCanceledDetails(CanceledDetails $canceledDetails)
  {
    $this->canceledDetails = $canceledDetails;
  }
  /**
   * @return CanceledDetails
   */
  public function getCanceledDetails()
  {
    return $this->canceledDetails;
  }
  /**
   * @param RecurrenceTerms
   */
  public function setRecurrenceTerms(RecurrenceTerms $recurrenceTerms)
  {
    $this->recurrenceTerms = $recurrenceTerms;
  }
  /**
   * @return RecurrenceTerms
   */
  public function getRecurrenceTerms()
  {
    return $this->recurrenceTerms;
  }
  /**
   * @param string
   */
  public function setRecurringPlanState($recurringPlanState)
  {
    $this->recurringPlanState = $recurringPlanState;
  }
  /**
   * @return string
   */
  public function getRecurringPlanState()
  {
    return $this->recurringPlanState;
  }
  /**
   * @param SuspendedDetails
   */
  public function setSuspendedDetails(SuspendedDetails $suspendedDetails)
  {
    $this->suspendedDetails = $suspendedDetails;
  }
  /**
   * @return SuspendedDetails
   */
  public function getSuspendedDetails()
  {
    return $this->suspendedDetails;
  }
  /**
   * @param string
   */
  public function setUpdateTime($updateTime)
  {
    $this->updateTime = $updateTime;
  }
  /**
   * @return string
   */
  public function getUpdateTime()
  {
    return $this->updateTime;
  }
  /**
   * @param WaitingToRecurDetails
   */
  public function setWaitingToRecurDetails(WaitingToRecurDetails $waitingToRecurDetails)
  {
    $this->waitingToRecurDetails = $waitingToRecurDetails;
  }
  /**
   * @return WaitingToRecurDetails
   */
  public function getWaitingToRecurDetails()
  {
    return $this->waitingToRecurDetails;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(RecurringPlanDetails::class, 'Google_Service_SubscribewithGoogle_RecurringPlanDetails');
