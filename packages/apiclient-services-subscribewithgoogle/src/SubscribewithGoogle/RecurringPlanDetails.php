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
  /**
   * Unspecified. This value may be set while the subscription is in an interim
   * state.
   */
  public const RECURRING_PLAN_STATE_RECURRING_PLAN_STATE_UNSPECIFIED = 'RECURRING_PLAN_STATE_UNSPECIFIED';
  /**
   * Represents that the plan is currently active and is waiting to be recurred
   * at the next iteration.
   */
  public const RECURRING_PLAN_STATE_WAITING_TO_RECUR = 'WAITING_TO_RECUR';
  /**
   * Represents that the plan is suspended (before it could be renewed for next
   * cycle) and can be resumed later but user won't have access to entitlements.
   */
  public const RECURRING_PLAN_STATE_SUSPENDED = 'SUSPENDED';
  /**
   * Represents that the plan couldn't be renewed successfully due to payment
   * failure and requires the user to fix it. The user might still have access
   * to entitlements until a certain grace period after which the plan would be
   * put on hold or be canceled.
   */
  public const RECURRING_PLAN_STATE_FIX_REQUIRED = 'FIX_REQUIRED';
  /**
   * Represents the change from FIX_REQUIRED, if publishers allow for the plan
   * to be fixable for some more time (account_on_hold_millis). During this
   * time, the user won't have access to entitlements but can still fix their
   * plan on their own to resume their account. If they fail to do so until the
   * hold time, the plan is canceled.
   */
  public const RECURRING_PLAN_STATE_ACCOUNT_ON_HOLD = 'ACCOUNT_ON_HOLD';
  /**
   * Represents that this plan is going to be canceled at the end of the current
   * billing cycle and user will only have access to entitlements until then.
   */
  public const RECURRING_PLAN_STATE_WAITING_TO_CANCEL = 'WAITING_TO_CANCEL';
  /**
   * Represents a terminal state for the plan where the plan has been canceled
   * and can't be revived. After this user won't have access to entitlements via
   * this plan. If they want access again, they'll have to purchase a new plan.
   */
  public const RECURRING_PLAN_STATE_CANCELED = 'CANCELED';
  protected $canceledDetailsType = CanceledDetails::class;
  protected $canceledDetailsDataType = '';
  protected $recurrenceTermsType = RecurrenceTerms::class;
  protected $recurrenceTermsDataType = '';
  /**
   * The state the recurring plan is in eg WAITING_TO_RECUR, CANCELED etc.
   *
   * @var string
   */
  public $recurringPlanState;
  protected $suspendedDetailsType = SuspendedDetails::class;
  protected $suspendedDetailsDataType = '';
  /**
   * Timestamp when this plan was most recently updated.
   *
   * @var string
   */
  public $updateTime;
  protected $waitingToRecurDetailsType = WaitingToRecurDetails::class;
  protected $waitingToRecurDetailsDataType = '';

  /**
   * Contains additional details about the plan if the plan is in CANCELED
   * state.
   *
   * @param CanceledDetails $canceledDetails
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
   * Terms of the recurrence, like recurrence duration.
   *
   * @param RecurrenceTerms $recurrenceTerms
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
   * The state the recurring plan is in eg WAITING_TO_RECUR, CANCELED etc.
   *
   * Accepted values: RECURRING_PLAN_STATE_UNSPECIFIED, WAITING_TO_RECUR,
   * SUSPENDED, FIX_REQUIRED, ACCOUNT_ON_HOLD, WAITING_TO_CANCEL, CANCELED
   *
   * @param self::RECURRING_PLAN_STATE_* $recurringPlanState
   */
  public function setRecurringPlanState($recurringPlanState)
  {
    $this->recurringPlanState = $recurringPlanState;
  }
  /**
   * @return self::RECURRING_PLAN_STATE_*
   */
  public function getRecurringPlanState()
  {
    return $this->recurringPlanState;
  }
  /**
   * Contains additional details about the plan if the plan is in SUSPENDED
   * state.
   *
   * @param SuspendedDetails $suspendedDetails
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
   * Timestamp when this plan was most recently updated.
   *
   * @param string $updateTime
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
   * Contains additional details about the plan if the plan is in
   * WAITING_TO_RECUR state.
   *
   * @param WaitingToRecurDetails $waitingToRecurDetails
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
