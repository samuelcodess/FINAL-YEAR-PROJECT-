# AI Logic Explanation

## Approach

The project uses rule-based intelligent logic instead of complex machine learning. This is intentional and appropriate because the goal is to provide explainable HR decision support rather than black-box predictions.

## Input to the engine

The recommendation engine analyzes:

- current evaluation KPI scores
- KPI weights
- total weighted score
- previous evaluation history
- trend direction over time

## Weighted scoring logic

Each KPI contributes to the total score according to its weight percentage.

### Formula

`weighted contribution = (kpi score / 100) * weight percentage`

### Total score

`total score = sum of all weighted contributions`

The final total is normalized to a 100-point scale.

## Performance classification rules

- `90 - 100` = Excellent Performance
- `75 - 89` = Very Good Performance
- `60 - 74` = Good Performance
- `50 - 59` = Average Performance
- `Below 50` = Poor Performance

## Recommendation rules

### Excellent

- Recommend promotion
- Recommend leadership opportunities

### Very good

- Recommend bonuses
- Recommend advanced responsibilities

### Good

- Recommend training
- Recommend skill development

### Average or poor

- Recommend performance improvement plan

## Trend detection rules

The system compares the latest score with previous evaluations:

- higher than previous = improving
- lower than previous = declining
- nearly unchanged = stable

## Consecutive change logic

### Decline for three evaluations

If an employee shows a declining score across three consecutive evaluation periods:

- generate a warning recommendation
- create a warning notification for relevant HR users

### Continuous improvement

If performance improves consistently:

- generate positive recognition
- recommend acknowledgement or reward

## Explainability

Every recommendation includes a reason. Example:

- "Training is recommended because communication and timeliness scored below target while the overall score remained in the good performance band."

This makes the system academically defendable and professionally realistic.
