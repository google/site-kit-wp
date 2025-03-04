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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaCalculatedMetric extends \Google\Collection
{
  protected $collection_key = 'restrictedMetricType';
  /**
   * @var string
   */
  public $calculatedMetricId;
  /**
   * @var string
   */
  public $description;
  /**
   * @var string
   */
  public $displayName;
  /**
   * @var string
   */
  public $formula;
  /**
   * @var bool
   */
  public $invalidMetricReference;
  /**
   * @var string
   */
  public $metricUnit;
  /**
   * @var string
   */
  public $name;
  /**
   * @var string[]
   */
  public $restrictedMetricType;

  /**
   * @param string
   */
  public function setCalculatedMetricId($calculatedMetricId)
  {
    $this->calculatedMetricId = $calculatedMetricId;
  }
  /**
   * @return string
   */
  public function getCalculatedMetricId()
  {
    return $this->calculatedMetricId;
  }
  /**
   * @param string
   */
  public function setDescription($description)
  {
    $this->description = $description;
  }
  /**
   * @return string
   */
  public function getDescription()
  {
    return $this->description;
  }
  /**
   * @param string
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * @param string
   */
  public function setFormula($formula)
  {
    $this->formula = $formula;
  }
  /**
   * @return string
   */
  public function getFormula()
  {
    return $this->formula;
  }
  /**
   * @param bool
   */
  public function setInvalidMetricReference($invalidMetricReference)
  {
    $this->invalidMetricReference = $invalidMetricReference;
  }
  /**
   * @return bool
   */
  public function getInvalidMetricReference()
  {
    return $this->invalidMetricReference;
  }
  /**
   * @param string
   */
  public function setMetricUnit($metricUnit)
  {
    $this->metricUnit = $metricUnit;
  }
  /**
   * @return string
   */
  public function getMetricUnit()
  {
    return $this->metricUnit;
  }
  /**
   * @param string
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
   * @param string[]
   */
  public function setRestrictedMetricType($restrictedMetricType)
  {
    $this->restrictedMetricType = $restrictedMetricType;
  }
  /**
   * @return string[]
   */
  public function getRestrictedMetricType()
  {
    return $this->restrictedMetricType;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaCalculatedMetric::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaCalculatedMetric');
