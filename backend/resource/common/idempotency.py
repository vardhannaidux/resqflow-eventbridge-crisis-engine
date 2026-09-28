import boto3
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

def check_and_set_idempotency(table_name: str, idempotency_key: str, incident_id: str, action: str) -> bool:
    """
    Checks if an event action has already been processed using DynamoDB conditional write.
    Returns True if this is the FIRST time processing (acquired lock/record).
    Returns False if already processed (duplicate).
    """
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(table_name)
    
    try:
        table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression="SET lastEventId = :eid, #v = if_not_exists(#v, :zero) + :one",
            ConditionExpression="attribute_not_exists(lastEventId) OR lastEventId <> :eid",
            ExpressionAttributeNames={
                "#v": "version"
            },
            ExpressionAttributeValues={
                ":eid": idempotency_key,
                ":one": 1,
                ":zero": 0
            }
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning("Duplicate event detected with idempotencyKey=%s for incidentId=%s", idempotency_key, incident_id)
            return False
        logger.error("DynamoDB error checking idempotency: %s", str(e))
        raise
