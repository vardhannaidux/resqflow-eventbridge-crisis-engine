import sys
import os
import json
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

import ingestion.app as ingestion_app

def test_polly_voices_endpoint():
    event = {
        "httpMethod": "GET",
        "path": "/polly/voices"
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "voices" in body
    assert len(body["voices"]) >= 4
    voice_ids = [v["id"] for v in body["voices"]]
    assert "Kajal" in voice_ids
    assert "Matthew" in voice_ids

def test_polly_synthesize_validation_error():
    event = {
        "httpMethod": "POST",
        "path": "/polly/synthesize",
        "body": json.dumps({})
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert "error" in body

@patch("boto3.client")
def test_polly_synthesize_success(mock_boto):
    mock_polly = MagicMock()
    mock_boto.return_value = mock_polly

    # Mock audio stream
    mock_stream = MagicMock()
    mock_stream.read.return_value = b"fake-audio-bytes"
    mock_polly.synthesize_speech.return_value = {
        "AudioStream": mock_stream
    }

    event = {
        "httpMethod": "POST",
        "path": "/polly/synthesize",
        "body": json.dumps({
            "text": "Priority 1 Emergency at Banjara Hills.",
            "voiceId": "Kajal"
        })
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "audioBase64" in body
    assert body["voiceId"] == "Kajal"
    assert body["contentType"] == "audio/mpeg"
