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

class UserEntitlementsPlan extends \Google\Collection
{
  /**
   * Unspecified.
   */
  public const PLAN_TYPE_PLAN_TYPE_UNSPECIFIED = 'PLAN_TYPE_UNSPECIFIED';
  /**
   * Revenue model is Subscription.
   */
  public const PLAN_TYPE_SUBSCRIPTION = 'SUBSCRIPTION';
  /**
   * Revenue model is Recurring contribution.
   */
  public const PLAN_TYPE_RECURRING_CONTRIBUTIONS = 'RECURRING_CONTRIBUTIONS';
  /**
   * Revenue model is one time contribution.
   */
  public const PLAN_TYPE_ONE_TIME_CONTRIBUTION = 'ONE_TIME_CONTRIBUTION';
  protected $collection_key = 'planEntitlements';
  /**
   * The resource name of the entitlementplan. Entitlementplans names have the
   * form `publications/{publication_id}/readers/{user_id}/entitlementplans/{pla
   * n_id}`.
   *
   * @var string
   */
  public $name;
  protected $planEntitlementsType = PlanEntitlement::class;
  protected $planEntitlementsDataType = 'array';
  /**
   * Unique id for the plan shared externally.
   *
   * @var string
   */
  public $planId;
  /**
   * Indicates the type of revenue model associated with this plan.
   *
   * @var string
   */
  public $planType;
  /**
   * Unique id for the publication within RRM.
   *
   * @var string
   */
  public $publicationId;
  protected $purchaseInfoType = PurchaseInfo::class;
  protected $purchaseInfoDataType = '';
  /**
   * Unique id for reader shared externally. This field is to replace user_id
   * for better name.
   *
   * @var string
   */
  public $readerId;
  protected $recurringPlanDetailsType = RecurringPlanDetails::class;
  protected $recurringPlanDetailsDataType = '';
  /**
   * Unique id for the user shared externally.
   *
   * @deprecated
   * @var string
   */
  public $userId;

  /**
   * The resource name of the entitlementplan. Entitlementplans names have the
   * form `publications/{publication_id}/readers/{user_id}/entitlementplans/{pla
   * n_id}`.
   *
   * @param string $name
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * Entitlements granted under the given plan for the user.
   *
   * @param PlanEntitlement[] $planEntitlements
   */
  public function setPlanEntitlements($planEntitlements)
  {
    $this->planEntitlements = $planEntitlements;
  }
  /**
   * @return PlanEntitlement[]
   */
  public function getPlanEntitlements()
  {
    return $this->planEntitlements;
  }
  /**
   * Unique id for the plan shared externally.
   *
   * @param string $planId
   */
  public function setPlanId($planId)
  {
    $this->planId = $planId;
  }
  /**
   * @return string
   */
  public function getPlanId()
  {
    return $this->planId;
  }
  /**
   * Indicates the type of revenue model associated with this plan.
   *
   * Accepted values: PLAN_TYPE_UNSPECIFIED, SUBSCRIPTION,
   * RECURRING_CONTRIBUTIONS, ONE_TIME_CONTRIBUTION
   *
   * @param self::PLAN_TYPE_* $planType
   */
  public function setPlanType($planType)
  {
    $this->planType = $planType;
  }
  /**
   * @return self::PLAN_TYPE_*
   */
  public function getPlanType()
  {
    return $this->planType;
  }
  /**
   * Unique id for the publication within RRM.
   *
   * @param string $publicationId
   */
  public function setPublicationId($publicationId)
  {
    $this->publicationId = $publicationId;
  }
  /**
   * @return string
   */
  public function getPublicationId()
  {
    return $this->publicationId;
  }
  /**
   * Contains details about the purchase of the given entitlement plan. This
   * info would be filled on a best effort basis and might not be available for
   * all sources.
   *
   * @param PurchaseInfo $purchaseInfo
   */
  public function setPurchaseInfo(PurchaseInfo $purchaseInfo)
  {
    $this->purchaseInfo = $purchaseInfo;
  }
  /**
   * @return PurchaseInfo
   */
  public function getPurchaseInfo()
  {
    return $this->purchaseInfo;
  }
  /**
   * Unique id for reader shared externally. This field is to replace user_id
   * for better name.
   *
   * @param string $readerId
   */
  public function setReaderId($readerId)
  {
    $this->readerId = $readerId;
  }
  /**
   * @return string
   */
  public function getReaderId()
  {
    return $this->readerId;
  }
  /**
   * Contains plan details if plan type is SUBSCRIPTION or
   * RECURRING_CONTRIBUTION. This will be set to the default value while the
   * subscription is initially being activated.
   *
   * @param RecurringPlanDetails $recurringPlanDetails
   */
  public function setRecurringPlanDetails(RecurringPlanDetails $recurringPlanDetails)
  {
    $this->recurringPlanDetails = $recurringPlanDetails;
  }
  /**
   * @return RecurringPlanDetails
   */
  public function getRecurringPlanDetails()
  {
    return $this->recurringPlanDetails;
  }
  /**
   * Unique id for the user shared externally.
   *
   * @deprecated
   * @param string $userId
   */
  public function setUserId($userId)
  {
    $this->userId = $userId;
  }
  /**
   * @deprecated
   * @return string
   */
  public function getUserId()
  {
    return $this->userId;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(UserEntitlementsPlan::class, 'Google_Service_SubscribewithGoogle_UserEntitlementsPlan');
